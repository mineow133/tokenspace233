import {NextResponse} from "next/server";
export const dynamic="force-dynamic";

export async function POST(req:Request){
  const key=process.env.JUPITER_API_KEY;
  if(!key)return NextResponse.json({error:"Jupiter API key is not configured"},{status:500});
  try{
    const body=await req.json();
    const signedTransaction=typeof body?.signedTransaction==="string"?body.signedTransaction:"";
    const requestId=typeof body?.requestId==="string"?body.requestId:"";
    if(!signedTransaction||!requestId)return NextResponse.json({error:"Missing signed transaction or requestId"},{status:400});
    const r=await fetch("https://api.jup.ag/swap/v2/execute",{
      method:"POST",
      headers:{"Content-Type":"application/json","accept":"application/json","x-api-key":key},
      body:JSON.stringify({signedTransaction,requestId}),
      cache:"no-store"
    });
    const data=await r.json();
    return NextResponse.json(data,{status:r.status,headers:{"Cache-Control":"no-store"}});
  }catch{
    return NextResponse.json({error:"Jupiter execution request failed"},{status:502});
  }
}