"use client";

import Link from "next/link";
import { ExternalLink, Star, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import WatchlistButton from "./WatchlistButton";

export type MarketToken = {
  address:string;symbol:string;name:string;image:string;marketCap:number;liquidity:number;volume:number;change:number;score:number;
  txns?:number;buys?:number;sells?:number;createdAt?:string;pairUrl?:string;price?:number;volume5m?:number;volume1h?:number;priceChange5m?:number;
};

function money(v:number){
  if(!Number.isFinite(v))return "—";
  if(v>=1e9)return "$"+(v/1e9).toFixed(2)+"B";
  if(v>=1e6)return "$"+(v/1e6).toFixed(2)+"M";
  if(v>=1e3)return "$"+(v/1e3).toFixed(1)+"K";
  return "$"+v.toFixed(0)
}
function price(v:number){
  if(!v)return "—";
  if(v>=1)return "$"+v.toFixed(2);
  if(v>=.01)return "$"+v.toFixed(4);
  if(v>=.0001)return "$"+v.toFixed(6);
  return "$"+v.toFixed(9)
}

function Avatar({token}:{token:MarketToken}){
  return token.image?<img className="ds-token-img" src={token.image} alt=""/>:<span className="ds-token-img fallback">{token.symbol.slice(0,1)}</span>
}

function LiveValue({value}:{value:number}){
  const oldRef=useRef(value); const [dir,setDir]=useState<"up"|"down"|"same">("same");
  useEffect(()=>{
    const old=oldRef.current;
    if(value>old)setDir("up"); else if(value<old)setDir("down"); else setDir("same");
    oldRef.current=value;
    if(value!==old){const id=window.setTimeout(()=>setDir("same"),700);return()=>window.clearTimeout(id)}
  },[value]);
  return <span className={"ds-live-number "+dir}>{dir==="up"?<TrendingUp size={11}/>:dir==="down"?<TrendingDown size={11}/>:null}{money(value)}</span>
}

export default function TokenTable({tokens,loading=false,emptyLabel="No matching tokens."}:{tokens:MarketToken[];loading?:boolean;emptyLabel?:string}){
 return <section className="ds-data-card">
  <div className="ds-table-header">
    <div className="ds-table-title"><span>PAIRS</span><strong>Live market</strong></div>
    <div className="ds-table-note"><i/> Market cap · liquidity · volume</div>
  </div>

  <div className="ds-columns">
    <span># / PAIR</span><span>PRICE</span><span>AGE</span><span>TXNS</span><span>VOLUME</span><span>5M</span><span>1H</span><span>6H / 24H</span><span>LIQUIDITY</span><span>MCAP</span><span/>
  </div>

  {loading?<div className="ds-skeleton-list">{Array.from({length:10}).map((_,i)=><div className="ds-skeleton-row" key={i}><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/></div>)}</div>
  :tokens.length===0?<div className="ds-empty">{emptyLabel}</div>
  :tokens.map((token,index)=>{
    const href=token.address?"/token/"+token.address:"/";
    const age=token.createdAt?(()=>{const m=Math.max(0,Math.floor((Date.now()-Date.parse(token.createdAt))/60000));return m<60?m+"m":m<1440?Math.floor(m/60)+"h":Math.floor(m/1440)+"d"})():"—";
    return <div className="ds-pair-row" key={token.address||token.symbol+index}>
      <Link href={href} className="ds-pair-cell">
        <span className="ds-rank">{index+1}</span>
        <Avatar token={token}/>
        <span className="ds-pair-copy"><strong>{token.symbol}</strong><small>{token.name}</small><em>{token.symbol}/SOL</em></span>
      </Link>
      <Link href={href} className="ds-cell price-cell">{price(token.price??0)}</Link>
      <Link href={href} className="ds-cell muted-cell">{age}</Link>
      <Link href={href} className="ds-cell">{token.txns?.toLocaleString()??"—"}</Link>
      <Link href={href} className="ds-cell">{money(token.volume)}</Link>
      <Link href={href} className={token.priceChange5m??token.change>=0?"ds-cell up":"ds-cell down"}>{(token.priceChange5m??token.change)>=0?"+":""}{(token.priceChange5m??token.change).toFixed(1)}%</Link>
      <Link href={href} className={token.change>=0?"ds-cell up":"ds-cell down"}>{token.change>=0?"+":""}{token.change.toFixed(1)}%</Link>
      <Link href={href} className={token.change>=0?"ds-cell up":"ds-cell down"}>{token.change>=0?"+":""}{token.change.toFixed(1)}%</Link>
      <Link href={href} className="ds-cell muted-cell">{money(token.liquidity)}</Link>
      <Link href={href} className="ds-cell live-mc-link"><LiveValue value={token.marketCap}/></Link>
      <span className="ds-row-actions"><WatchlistButton address={token.address}/>{token.pairUrl&&<a href={token.pairUrl} target="_blank" rel="noreferrer" className="ds-external"><ExternalLink size={13}/></a>}<Star size={12} className="ds-star-placeholder"/></span>
    </div>
  })}
 </section>
}
