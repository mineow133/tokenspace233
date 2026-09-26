import {NextResponse} from "next/server";
export const dynamic="force-dynamic";

export async function POST(req:Request){
  try{
    const body=await req.json();
    const signedTransaction=typeof body?.signedTransaction==="string"?body.signedTransaction:"";
    const requestId=typeof body?.requestId==="string"?body.requestId:"";
    if(!signedTransaction||!requestId) return NextResponse.json({error:"Missing signed transaction or requestId"},{status:400});
    const headers:Record<string,string>={"Content-Type":"application/json","accept":"application/json"};
    if(process.env.JUPITER_API_KEY) headers["x-api-key"]=process.env.JUPITER_API_KEY;
    const r=await fetch("https://api.jup.ag/swap/v2/execute",{
      method:"POST",headers,
      body:JSON.stringify({signedTransaction,requestId}),cache:"no-store"
    });
    const data=await r.json();
    return NextResponse.json(data,{status:r.status,headers:{"Cache-Control":"no-store"}});
  }catch{
    return NextResponse.json({error:"Jupiter execution request failed"},{status:502});
  }
}