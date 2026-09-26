import {NextResponse} from "next/server";
import {normalize,DexPair,scorePair} from "../../../lib/ranking";

export const dynamic="force-dynamic";
const DEX="https://api.dexscreener.com";
const JUP="https://api.jup.ag";

async function dex(path:string){
  const r=await fetch(DEX+path,{headers:{accept:"application/json"},next:{revalidate:20}});
  if(!r.ok) throw new Error("DEX Screener "+r.status);
  return r.json();
}

async function jup(path:string){
  const headers:Record<string,string>={accept:"application/json"};
  if(process.env.JUPITER_API_KEY) headers["x-api-key"]=process.env.JUPITER_API_KEY;
  const r=await fetch(JUP+path,{headers,cache:"no-store"});
  if(!r.ok) throw new Error("Jupiter "+r.status);
  return r.json();
}

type Recent={
  id:string;name?:string;symbol?:string;icon?:string;usdPrice?:number;fdv?:number;mcap?:number;liquidity?:number;
  firstPool?:{id?:string;createdAt?:string};
  stats24h?:{priceChange?:number;buyVolume?:number;sellVolume?:number;numBuys?:number;numSells?:number;numTraders?:number};
};

function recentScore(t:Recent){
  const s=t.stats24h??{};
  const volume=(s.buyVolume??0)+(s.sellVolume??0);
  const tx=(s.numBuys??0)+(s.numSells??0);
  const liq=t.liquidity??0;
  const change=(s.priceChange??0)*100;
  const vm=Math.min(100,Math.log10(volume+1)*12);
  const cm=Math.max(0,Math.min(100,50+change));
  const tm=Math.min(100,Math.log10(tx+1)*22);
  const lm=Math.min(100,Math.log10(liq+1)*20);
  return Math.round(vm*.3+cm*.25+tm*.2+lm*.15+10);
}

export async function GET(){
  try{
    const [profiles,boosts,recent] = await Promise.allSettled([
      dex("/token-profiles/latest/v1"),
      dex("/token-boosts/latest/v1"),
      jup("/tokens/v2/recent?limit=100")
    ]);

    const addresses=new Set<string>();
    for(const result of [profiles,boosts]){
      if(result.status!=="fulfilled"||!Array.isArray(result.value)) continue;
      for(const x of result.value){
        if(x?.chainId==="solana"&&x?.tokenAddress) addresses.add(x.tokenAddress);
      }
    }

    const recentRows:Recent[]=recent.status==="fulfilled"&&Array.isArray(recent.value)
      ? recent.value.filter((x:any)=>x?.id) : [];
    for(const x of recentRows) addresses.add(x.id);

    const all=[...addresses].slice(0,180);
    const pairs:DexPair[]=[];
    for(let i=0;i<all.length;i+=30){
      try{
        const data=await dex("/tokens/v1/solana/"+all.slice(i,i+30).join(","));
        if(Array.isArray(data)) pairs.push(...data);
      }catch{}
    }

    const best=new Map<string,DexPair>();
    for(const p of pairs){
      if(!p.baseToken?.address||p.chainId!=="solana") continue;
      const old=best.get(p.baseToken.address);
      if(!old||scorePair(p)>scorePair(old)) best.set(p.baseToken.address,p);
    }

    const dexTokens=[...best.values()]
      .map(normalize)
      .filter(t=>t.liquidity>=5000&&t.marketCap>=10000)
      .sort((a,b)=>b.score-a.score)
      .slice(0,100);

    const newTokens=recentRows.map(t=>{
      const p=best.get(t.id);
      const n=p?normalize(p):{
        address:t.id,
        symbol:t.symbol??"UNKNOWN",
        name:t.name??"Unknown token",
        image:t.icon??"",
        pairAddress:t.firstPool?.id??"",
        price:Number(t.usdPrice??0),
        marketCap:t.mcap??t.fdv??0,
        liquidity:t.liquidity??0,
        volume:(t.stats24h?.buyVolume??0)+(t.stats24h?.sellVolume??0),
        change:(t.stats24h?.priceChange??0)*100,
        txns:(t.stats24h?.numBuys??0)+(t.stats24h?.numSells??0),
        score:recentScore(t),
        pairUrl:""
      };
      return {...n,createdAt:t.firstPool?.createdAt??""};
    })
    .filter(t=>t.liquidity>=1000&&t.marketCap>=5000)
    .sort((a,b)=>Date.parse(b.createdAt||"0")-Date.parse(a.createdAt||"0"))
    .slice(0,100);

    const merged=new Map<string,any>();
    for(const t of dexTokens) merged.set(t.address,t);
    for(const t of newTokens) if(!merged.has(t.address)) merged.set(t.address,t);

    return NextResponse.json(
      {tokens:[...merged.values()].slice(0,100),newTokens,source:"dexscreener+jupiter",updatedAt:Date.now()},
      {headers:{"Cache-Control":"s-maxage=20, stale-while-revalidate=60"}}
    );
  }catch(e){
    return NextResponse.json({tokens:[],newTokens:[],error:e instanceof Error?e.message:"Unknown error"},{status:502});
  }
}