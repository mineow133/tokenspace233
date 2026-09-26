import {NextResponse} from "next/server";
import {PublicKey} from "@solana/web3.js";
export const dynamic="force-dynamic";
function valid(v:string|null){if(!v)return false;try{new PublicKey(v);return true}catch{return false}}
export async function GET(req:Request){
 const key=process.env.JUPITER_API_KEY;
 if(!key)return NextResponse.json({error:"Jupiter API key is not configured"},{status:500});
 const {searchParams}=new URL(req.url);
 const inputMint=searchParams.get("inputMint"),outputMint=searchParams.get("outputMint"),amount=searchParams.get("amount"),taker=searchParams.get("taker");
 if(!valid(inputMint)||!valid(outputMint)||!valid(taker))return NextResponse.json({error:"Invalid Solana address"},{status:400});
 if(inputMint===outputMint)return NextResponse.json({error:"Input and output tokens must differ"},{status:400});
 if(!amount||!/^[1-9]\d*$/.test(amount)||amount.length>20)return NextResponse.json({error:"Invalid amount"},{status:400});
 const url=new URL("https://api.jup.ag/swap/v2/order");
 url.searchParams.set("inputMint",inputMint!);url.searchParams.set("outputMint",outputMint!);url.searchParams.set("amount",amount);url.searchParams.set("taker",taker!);
 try{const r=await fetch(url,{headers:{accept:"application/json","x-api-key":key},cache:"no-store"});const data=await r.json();return NextResponse.json(data,{status:r.status,headers:{"Cache-Control":"no-store"}})}catch{return NextResponse.json({error:"Jupiter request failed"},{status:502})}
}