import { NextResponse } from "next/server";
import { normalize, type DexPair } from "../../../lib/ranking";
import { isAlphaCall, toAlphaSignal, type AlphaCandidate } from "../../../lib/alpha";

export const dynamic="force-dynamic";

const DEX="https://api.dexscreener.com";
const GECKO="https://api.geckoterminal.com/api/v2";

async function get(url:string){
  const response=await fetch(url,{headers:{accept:"application/json"},next:{revalidate:10}});
  if(!response.ok)throw new Error("Alpha source "+response.status);
  return response.json();
}

type GPool={
  attributes?:{
    name?:string;base_token_price_usd?:string;fdv_usd?:string;market_cap_usd?:string;reserve_in_usd?:string;pool_created_at?:string;
    price_change_percentage?:Record<string,string>;volume_usd?:Record<string,string>;
    transactions?:Record<string,{buys?:number;sells?:number}>
  };
  relationships?:{base_token?:{data?:{id?:string}}}
};

function candidateFromGecko(pool:GPool):AlphaCandidate{
  const a=pool.attributes??{};
  const tx=a.transactions?.m5??{};
  const address=pool.relationships?.base_token?.data?.id?.replace(/^solana_/,"")||"";
  const created=Date.parse(a.pool_created_at||"");
  return {
    address,
    symbol:(a.name||"UNKNOWN").split(" / ")[0].slice(0,20),
    name:a.name||"Fresh pool",
    image:"",
    price:Number(a.base_token_price_usd??0),
    marketCap:Number(a.market_cap_usd??a.fdv_usd??0),
    liquidity:Number(a.reserve_in_usd??0),
    volume5m:Number(a.volume_usd?.m5??0),
    volume1h:Number(a.volume_usd?.h1??0),
    buys5m:tx.buys??0,
    sells5m:tx.sells??0,
    priceChange5m:Number(a.price_change_percentage?.m5??0),
    ageMinutes:created?Math.max(0,(Date.now()-created)/60000):9999,
    source:"GeckoTerminal"
  };
}

async function enrich(input:AlphaCandidate[]){
  const addresses=[...new Set(input.map(x=>x.address).filter(Boolean))].slice(0,180);
  const chunks=await Promise.all(
    Array.from({length:Math.ceil(addresses.length/30)},(_,i)=>
      get(DEX+"/tokens/v1/solana/"+addresses.slice(i*30,(i+1)*30).join(",")).catch(()=>[])
    )
  );
  const pairs:DexPair[]=chunks.flat();
  const best=new Map<string,DexPair>();
  for(const pair of pairs){
    const address=pair.baseToken?.address;
    if(!address)continue;
    const previous=best.get(address);
    if(!previous||(pair.liquidity?.usd??0)>(previous.liquidity?.usd??0))best.set(address,pair);
  }
  return input.map(item=>{
    const pair=best.get(item.address);
    if(!pair)return item;
    const token=normalize(pair);
    return {
      ...item,
      symbol:token.symbol,
      name:token.name,
      image:token.image,
      price:token.price,
      marketCap:token.marketCap,
      liquidity:token.liquidity,
      volume5m:Number(pair.volume?.m5??item.volume5m),
      volume1h:Number(pair.volume?.h1??item.volume1h),
      buys5m:Number(pair.txns?.m5?.buys??item.buys5m),
      sells5m:Number(pair.txns?.m5?.sells??item.sells5m),
      priceChange5m:Number(pair.priceChange?.m5??item.priceChange5m)
    };
  });
}

export async function GET(){
  try{
    const pages=await Promise.all(
      [1,2,3,4].map((page)=>get(GECKO+"/networks/solana/new_pools?page="+page).catch(()=>({data:[]})))
    );
    const raw:GPool[]=pages.flatMap((p)=>Array.isArray(p.data)?p.data:[]);
    const candidates=await enrich(raw.map(candidateFromGecko).filter(x=>x.address&&x.ageMinutes<=180));

    const signals=candidates
      .filter(x=>x.marketCap>=5000&&x.liquidity>=1000)
      .map(toAlphaSignal)
      .sort((a,b)=>b.score-a.score)
      .slice(0,80);

    const calls=signals.filter(isAlphaCall).slice(0,20);

    return NextResponse.json(
      {signals,calls,scanner:"early-runner-v1",updatedAt:Date.now()},
      {headers:{"Cache-Control":"s-maxage=10, stale-while-revalidate=20"}}
    );
  }catch(error){
    return NextResponse.json(
      {signals:[],calls:[],error:error instanceof Error?error.message:"Alpha scanner unavailable"},
      {status:502}
    );
  }
}
