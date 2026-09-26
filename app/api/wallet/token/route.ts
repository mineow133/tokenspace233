import {NextResponse} from "next/server";
import {Connection,PublicKey} from "@solana/web3.js";
export const dynamic="force-dynamic";
const RPC=process.env.SOLANA_RPC_URL||"https://api.mainnet-beta.solana.com";
function key(v:string|null){if(!v)throw new Error("Missing address");return new PublicKey(v)}
export async function GET(req:Request){
 const {searchParams}=new URL(req.url);const owner=searchParams.get("owner"),mint=searchParams.get("mint");
 try{const ownerKey=key(owner),mintKey=key(mint);const c=new Connection(RPC,"confirmed");const rows=await c.getParsedTokenAccountsByOwner(ownerKey,{mint:mintKey});const amount=rows.value.reduce((s,x)=>s+Number(x.account.data.parsed.info.tokenAmount.amount),0);return NextResponse.json({amount},{headers:{"Cache-Control":"no-store"}})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Balance lookup failed"},{status:400})}
}