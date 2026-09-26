import {NextResponse} from "next/server";
import {normalize,DexPair,scorePair} from "../../../lib/ranking";
export const dynamic="force-dynamic";
const API="https://api.dexscreener.com";
async function getJson(path:string){const r=await fetch(API+path,{headers:{accept:"application/json"},next:{revalidate:20}});if(!r.ok)throw new Error("DEX Screener "+r.status);return r.json()}
export async function GET(){try{
const profiles=await getJson("/token-profiles/latest/v1");
const addresses=[...new Set((Array.isArray(profiles)?profiles:[]).filter((x:any)=>x?.chainId==="solana"&&x?.tokenAddress).map((x:any)=>x.tokenAddress))].slice(0,60) as string[];
const pairs:DexPair[]=[];
for(let i=0;i<addresses.length;i+=30){const data=await getJson("/tokens/v1/solana/"+addresses.slice(i,i+30).join(","));if(Array.isArray(data))pairs.push(...data)}
const best=new Map<string,DexPair>();
for(const p of pairs){if(!p.baseToken?.address||p.chainId!=="solana")continue;const old=best.get(p.baseToken.address);if(!old||scorePair(p)>scorePair(old))best.set(p.baseToken.address,p)}
const tokens=[...best.values()].map(normalize).filter(t=>t.liquidity>=5000&&t.marketCap>=10000).sort((x,y)=>y.score-x.score).slice(0,100);
return NextResponse.json({tokens,source:"dexscreener",updatedAt:Date.now()},{headers:{"Cache-Control":"s-maxage=20, stale-while-revalidate=60"}})
}catch(e){return NextResponse.json({tokens:[],error:e instanceof Error?e.message:"Unknown error"},{status:502})}}