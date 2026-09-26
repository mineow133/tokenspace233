"use client";
import {useEffect,useState} from "react";
import {useWallet} from "@solana/wallet-adapter-react";
import {VersionedTransaction} from "@solana/web3.js";

const SOL="So11111111111111111111111111111111111111112";
const LAMPORTS=1_000_000_000;

function toBase64(bytes:Uint8Array){
  let binary="";
  for(let i=0;i<bytes.length;i+=0x8000) binary+=String.fromCharCode(...bytes.slice(i,i+0x8000));
  return btoa(binary);
}

export default function JupiterTrade({outputMint}:{outputMint:string}){
 const {publicKey,signTransaction}=useWallet();
 const [side,setSide]=useState<"buy"|"sell">("buy");
 const [amount,setAmount]=useState("0.1");
 const [status,setStatus]=useState("");
 const [balance,setBalance]=useState("0");
 const [busy,setBusy]=useState(false);
 const [sig,setSig]=useState("");

 useEffect(()=>{if(publicKey) loadBalance()},[publicKey,outputMint]);

 async function loadBalance(){
   if(!publicKey)return;
   try{
     const r=await fetch("/api/wallet/token?owner="+publicKey.toBase58()+"&mint="+outputMint,{cache:"no-store"});
     const d=await r.json();
     setBalance(String(d.amount??"0"));
   }catch{setBalance("0")}
 }

 async function swap(){
  if(!publicKey||!signTransaction){setStatus("Connect Phantom or Solflare first.");return}
  setStatus("Getting quote…");setSig("");setBusy(true);
  try{
   const input=side==="buy"?SOL:outputMint,output=side==="buy"?outputMint:SOL;
   const raw=side==="buy"?Math.round(Number(amount)*LAMPORTS):Math.floor(Number(balance)*Number(amount)/100);
   if(!Number.isSafeInteger(raw)||raw<=0) throw new Error("Enter a valid amount.");
   const r=await fetch("/api/jupiter/order?inputMint="+input+"&outputMint="+output+"&amount="+raw+"&taker="+publicKey.toBase58(),{cache:"no-store"});
   const order=await r.json();
   if(!r.ok) throw new Error(order.error||order.errorMessage||"Jupiter order failed");
   if(!order.transaction) throw new Error(order.errorMessage||"Jupiter could not build this swap.");
   if(!order.requestId) throw new Error("Jupiter order did not return a request ID.");
   const tx=VersionedTransaction.deserialize(Uint8Array.from(atob(order.transaction),(c)=>c.charCodeAt(0)));
   setStatus("Confirm in your wallet…");
   const signed=await signTransaction(tx);
   setStatus("Executing swap…");
   const ex=await fetch("/api/jupiter/execute",{
     method:"POST",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({signedTransaction:toBase64(signed.serialize()),requestId:order.requestId})
   });
   const result=await ex.json();
   if(!ex.ok) throw new Error(result.error||result.errorMessage||"Jupiter execution failed");
   if(result.status!=="Success") throw new Error(result.error||result.errorMessage||"Swap failed on-chain.");
   setSig(result.signature||"");setStatus("Swap confirmed.");
   await loadBalance();
  }catch(e){setStatus(e instanceof Error?e.message:"Swap failed")}finally{setBusy(false)}
 }

 const connected=!!publicKey;
 return <div className="jupiter-trade">
   <div className="trade-tabs"><button className={side==="buy"?"active":""} onClick={()=>setSide("buy")}>BUY</button><button className={side==="sell"?"active":""} onClick={()=>setSide("sell")}>SELL</button></div>
   <div className="trade-balance"><span>YOUR TOKEN BALANCE</span><b>{Number(balance).toLocaleString()}</b></div>
   <div className="trade-box">
     <div className="trade-label">{side==="buy"?"YOU PAY":"SELL AMOUNT"}</div>
     <div className="trade-input"><input value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal"/><span>{side==="buy"?"SOL":"%"}</span></div>
   </div>
   <div className="quick">{side==="buy"?["0.1","0.5","1","5"].map(x=><button key={x} onClick={()=>setAmount(x)}>{x} SOL</button>):["25","50","75","100"].map(x=><button key={x} onClick={()=>setAmount(x)}>{x}%</button>)}</div>
   <button className="connect-big" onClick={swap} disabled={busy||!connected}>{busy?"PROCESSING…":connected?(side==="buy"?"BUY TOKEN":"SELL TOKEN"):"CONNECT WALLET"}</button>
   {sig&&<a className="tx-link" href={"https://solscan.io/tx/"+sig} target="_blank" rel="noreferrer">View transaction ↗</a>}
   {status&&<p className="trade-status">{status}</p>}
   <div className="trade-footer"><span>Jupiter routing</span><span>Phantom · Solflare</span></div>
 </div>
}