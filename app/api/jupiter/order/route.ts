import {NextResponse} from "next/server";
export const dynamic="force-dynamic";
export async function GET(req:Request){
 const key=process.env.JUPITER_API_KEY;
 if(!key)return NextResponse.json({error:"Jupiter API key is not configured"},{status:500});
 const {searchParams}=new URL(req.url);
 const inputMint=searchParams.get("inputMint"),outputMint=searchParams.get("outputMint"),amount=searchParams.get("amount"),taker=searchParams.get("taker");
 if(!inputMint||!outputMint||!amount||!taker)return NextResponse.json({error:"Missing inputMint, outputMint, amount, or taker"},{status:400});
 const url=new URL("https://api.jup.ag/swap/v2/order");
 url.searchParams.set("inputMint",inputMint);url.searchParams.set("outputMint",outputMint);url.searchParams.set("amount",amount);url.searchParams.set("taker",taker);
 const r=await fetch(url,{headers:{accept:"application/json","x-api-key":key}});
 const data=await r.json();
 return NextResponse.json(data,{status:r.status});
}