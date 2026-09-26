"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";

const SOL = "So11111111111111111111111111111111111111112";
const LAMPORTS = 1_000_000_000;

function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.slice(i, i + 0x8000));
  }
  return btoa(binary);
}

function rememberTrade(item: { token: string; symbol: string; side: "BUY" | "SELL"; amount: string; signature: string }) {
  try {
    const key = "tokenspace:activity:v1";
    const current = JSON.parse(localStorage.getItem(key) || "[]");
    const rows = Array.isArray(current) ? current : [];
    rows.unshift({ ...item, timestamp: Date.now() });
    localStorage.setItem(key, JSON.stringify(rows.slice(0, 50)));
    window.dispatchEvent(new Event("tokenspace-activity"));
  } catch {}
}

export default function JupiterTrade({ outputMint, symbol = "TOKEN" }: { outputMint: string; symbol?: string }) {
  const { publicKey, signTransaction } = useWallet();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("0.1");
  const [status, setStatus] = useState("");
  const [rawBalance, setRawBalance] = useState("0");
  const [uiBalance, setUiBalance] = useState(0);
  const [busy, setBusy] = useState(false);
  const [sig, setSig] = useState("");

  async function loadBalance() {
    if (!publicKey) {
      setRawBalance("0");
      setUiBalance(0);
      return;
    }

    try {
      const r = await fetch(
        "/api/wallet/token?owner=" + publicKey.toBase58() + "&mint=" + outputMint,
        { cache: "no-store" }
      );
      const d = await r.json();
      setRawBalance(typeof d.rawAmount === "string" ? d.rawAmount : "0");
      setUiBalance(Number(d.uiAmount ?? 0));
    } catch {
      setRawBalance("0");
      setUiBalance(0);
    }
  }

  useEffect(() => {
    loadBalance();
  }, [publicKey, outputMint]);

  async function swap() {
    if (!publicKey || !signTransaction) {
      setStatus("Connect Phantom or Solflare first.");
      return;
    }

    setBusy(true);
    setSig("");
    setStatus("Building the route…");

    try {
      const inputMint = side === "buy" ? SOL : outputMint;
      const outputMintValue = side === "buy" ? outputMint : SOL;

      let rawAmount: string;
      if (side === "buy") {
        const solAmount = Number(amount);
        if (!Number.isFinite(solAmount) || solAmount <= 0 || solAmount > 100000) {
          throw new Error("Enter a valid SOL amount.");
        }
        rawAmount = String(Math.round(solAmount * LAMPORTS));
      } else {
        const percent = Number(amount);
        if (!Number.isInteger(percent) || percent < 1 || percent > 100) {
          throw new Error("Enter a sell percentage from 1 to 100.");
        }
        const raw = (BigInt(rawBalance) * BigInt(percent)) / 100n;
        if (raw <= 0n) throw new Error("Your wallet has no sellable balance.");
        rawAmount = raw.toString();
      }

      const orderUrl =
        "/api/jupiter/order?inputMint=" +
        inputMint +
        "&outputMint=" +
        outputMintValue +
        "&amount=" +
        rawAmount +
        "&taker=" +
        publicKey.toBase58();

      const orderResponse = await fetch(orderUrl, { cache: "no-store" });
      const order = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(order.error || order.errorMessage || "Jupiter could not build the swap.");
      }
      if (!order.transaction || !order.requestId) {
        throw new Error(order.errorMessage || "Jupiter returned an incomplete order.");
      }

      const transaction = VersionedTransaction.deserialize(
        Uint8Array.from(atob(order.transaction), (char) => char.charCodeAt(0))
      );

      setStatus("Confirm in your wallet…");
      const signed = await signTransaction(transaction);

      setStatus("Sending through Jupiter…");
      const executionResponse = await fetch("/api/jupiter/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signedTransaction: toBase64(signed.serialize()),
          requestId: order.requestId
        })
      });

      const result = await executionResponse.json();
      if (!executionResponse.ok) {
        throw new Error(result.error || result.errorMessage || "Execution failed.");
      }
      if (result.status !== "Success") {
        throw new Error(result.error || result.errorMessage || "Swap was not confirmed.");
      }

      const signature = result.signature || "";
      setSig(signature);
      setStatus("Swap confirmed.");
      rememberTrade({
        token: outputMint,
        symbol,
        side: side === "buy" ? "BUY" : "SELL",
        amount: side === "buy" ? amount + " SOL" : amount + "% position",
        signature
      });
      await loadBalance();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Swap failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="jupiter-trade">
      <div className="trade-balance-row">
        <span>POSITION</span>
        <strong>{uiBalance.toLocaleString(undefined, { maximumFractionDigits: 5 })} {symbol}</strong>
      </div>

      <div className="trade-side-tabs">
        <button className={side === "buy" ? "active buy-tab" : ""} onClick={() => setSide("buy")}>Buy</button>
        <button className={side === "sell" ? "active sell-tab" : ""} onClick={() => setSide("sell")}>Sell</button>
      </div>

      <div className="trade-input-card">
        <div className="trade-input-top">
          <span>{side === "buy" ? "YOU PAY" : "POSITION TO SELL"}</span>
          {side === "buy" ? <small>SOL</small> : <small>%</small>}
        </div>
        <div className="trade-input-line">
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
          <span>{side === "buy" ? "SOL" : "%"}</span>
        </div>
      </div>

      <div className="quick-trades">
        {(side === "buy" ? ["0.1", "0.5", "1", "5"] : ["25", "50", "75", "100"]).map((value) => (
          <button key={value} onClick={() => setAmount(value)}>
            {value}{side === "buy" ? " SOL" : "%"}
          </button>
        ))}
      </div>

      <button className={side === "buy" ? "trade-submit buy" : "trade-submit sell"} onClick={swap} disabled={busy}>
        {busy ? "PROCESSING…" : !publicKey ? "CONNECT WALLET" : side === "buy" ? "BUY " + symbol : "SELL " + symbol}
      </button>

      <div className="trade-meta">
        <span>Jupiter routing</span>
        <span>Phantom · Solflare</span>
      </div>

      {status && <div className="trade-message">{status}</div>}
      {sig && (
        <a className="trade-success-link" href={"https://solscan.io/tx/" + sig} target="_blank" rel="noreferrer">
          View confirmed transaction ↗
        </a>
      )}
    </div>
  );
}
