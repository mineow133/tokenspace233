"use client";
import {useState} from "react";
import {useWallet} from "@solana/wallet-adapter-react";
import {VersionedTransaction} from "@solana/web3.js";
const SOL="So11111111111111111111111111111111111111112";
const LAMPORTS=1_000_000_000;
export default function JupiterTrade({outputMint}:{outputMint:string}){
 const {publicKey,signTransaction}=useWallet();
 const [side,setSide]=useState<"buy"|"sell">("buy");
 const [amount,setAmount]=useState("0.1");
 const [status,setStatus]=useState("");
 const [balance,setBalance]=useState(0);
 const [busy,setBusy]=useState(false);
 const [sig,setSig]=useState("");
 async function loadBalance(){
   if(!publicKey)return;
   try{
     const r=await fetch("/api/wallet/token?owner="+publicKey.toBase58()+"&mint="+outputMint);
     const d=await r.json();
     setBalance(d.amount||0)
   }catch{setBalance(0)}
 }
 async function swap(){
  if(!publicKey||!signTransaction){setStatus("Connect Phantom or Solflare first.");return}
  setStatus("Getting Jupiter order...");setSig("");setBusy(true);
  try{
   const input=side==="buy"?SOL:outputMint,output=side==="buy"?outputMint:SOL;
   const raw=side==="buy"?Math.round(Number(amount)*LAMPORTS):Math.round(balance*Number(amount)/100);
   if(!Number.isSafeInteger(raw)||raw<=0)throw new Error("Enter a valid amount.");
   const r=await fetch("/api/jupiter/order?inputMint="+input+"&outputMint="+output+"&amount="+raw+"&taker="+publicKey.toBase58());
   const order=await r.json();
   if(!r.ok)throw new Error(order.error||order.errorMessage||"Jupiter order failed");
   if(!order.transaction)throw new Error(order.errorMessage||"Jupiter could not build a swap transaction.");
   if(!order.requestId)throw new Error("Jupiter order did not return a request ID.");
   const bytes=Uint8Array.from(atob(order.transaction),(c)=>c.charCodeAt(0));
   const tx=VersionedTransaction.deserialize(bytes);
   setStatus("Waiting for wallet signature...");
   const signed=await signTransaction(tx);
   const signedTransaction=btoa(String.fromCharCode(...signed.serialize()));
   setStatus("Sending to Jupiter...");
   const ex=await fetch("/api/jupiter/execute",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({signedTransaction,requestId:order.requestId})});
   const result=await ex.json();
   if(!ex.ok)throw new Error(result.error||result.errorMessage||"Jupiter execution failed");
   if(result.status!=="Success")throw new Error(result.error||"Swap failed on-chain.");
   setSig(result.signature||"");setStatus("Transaction confirmed.");
  }catch(e){setStatus(e instanceof Error?e.message:"Swap failed")}finally{setBusy(false)}
 }
 return <div className="jupiter-trade">
   <div className="trade-tabs"><button className={side==="buy"?"active":""} onClick={()=>setSide("buy")}>Buy</button><button className={side==="sell"?"active":""} onClick={()=>setSide("sell")}>Sell</button></div>
   <div className="trade-box"><small>{side==="buy"?"SOL INPUT":"TOKEN SELL %"}{side==="sell"&&" · balance loaded on selection"}</small><input value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal"/><div className="trade-mint">{side==="buy"?"SOL":balance.toLocaleString()+" tokens"}</div></div>
   {side==="buy"?<div className="quick"><button onClick={()=>setAmount("0.1")}>0.1 SOL</button><button onClick={()=>setAmount("0.5")}>0.5 SOL</button><button onClick={()=>setAmount("1")}>1 SOL</button><button onClick={()=>setAmount("5")}>5 SOL</button></div>:<div className="quick"><button onClick={()=>{setAmount("25");loadBalance()}}>25%</button><button onClick={()=>{setAmount("50");loadBalance()}}>50%</button><button onClick={()=>{setAmount("75");loadBalance()}}>75%</button><button onClick={()=>{setAmount("100");loadBalance()}}>100%</button></div>}
   <button className="connect-big" onClick={swap} disabled={busy||!publicKey}>{busy?"Processing...":side==="buy"?"Swap SOL → Token":"Swap Token → SOL"}</button>
   {sig&&<a className="tx-link" href={"https://solscan.io/tx/"+sig} target="_blank" rel="noreferrer">View transaction ↗</a>}
   {status&&<p className="trade-status">{status}</p>}
   <p>Powered by Jupiter · Solana</p>
 </div>
}