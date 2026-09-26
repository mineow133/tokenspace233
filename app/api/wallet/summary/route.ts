import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

export const dynamic = "force-dynamic";
const RPC = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const DEX = "https://api.dexscreener.com";

type Asset = {
  mint: string;
  amount: string;
  decimals: number;
  uiAmount: number;
  symbol: string;
  name: string;
  image: string;
  priceUsd: number;
  valueUsd: number;
};

function toPublicKey(value: string | null) {
  if (!value) throw new Error("Missing wallet address");
  return new PublicKey(value);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get("owner");

  try {
    const ownerKey = toPublicKey(owner);
    const connection = new Connection(RPC, "confirmed");
    const [lamports, tokenRows] = await Promise.all([
      connection.getBalance(ownerKey, "confirmed"),
      connection.getParsedTokenAccountsByOwner(ownerKey, { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") })
    ]);

    const rawAssets = tokenRows.value
      .map((row) => {
        const tokenAmount = row.account.data.parsed.info.tokenAmount;
        const mint = row.account.data.parsed.info.mint as string;
        return {
          mint,
          amount: tokenAmount.amount as string,
          decimals: tokenAmount.decimals as number,
          uiAmount: Number(tokenAmount.uiAmount ?? 0)
        };
      })
      .filter((x) => x.uiAmount > 0)
      .slice(0, 30);

    const assets: Asset[] = [];
    for (let i = 0; i < rawAssets.length; i += 30) {
      const batch = rawAssets.slice(i, i + 30);
      try {
        const r = await fetch(DEX + "/tokens/v1/solana/" + batch.map((x) => x.mint).join(","), {
          headers: { accept: "application/json" },
          next: { revalidate: 30 }
        });
        const pairs = r.ok ? await r.json() : [];
        const best = new Map<string, any>();
        for (const pair of Array.isArray(pairs) ? pairs : []) {
          const mint = pair?.baseToken?.address;
          if (!mint) continue;
          const previous = best.get(mint);
          if (!previous || (pair?.liquidity?.usd ?? 0) > (previous?.liquidity?.usd ?? 0)) best.set(mint, pair);
        }

        for (const item of batch) {
          const pair = best.get(item.mint);
          const priceUsd = Number(pair?.priceUsd ?? 0);
          assets.push({
            ...item,
            symbol: pair?.baseToken?.symbol ?? item.mint.slice(0, 5),
            name: pair?.baseToken?.name ?? "Unknown token",
            image: pair?.info?.imageUrl ?? "",
            priceUsd,
            valueUsd: priceUsd * item.uiAmount
          });
        }
      } catch {
        for (const item of batch) {
          assets.push({
            ...item,
            symbol: item.mint.slice(0, 5),
            name: "Unpriced token",
            image: "",
            priceUsd: 0,
            valueUsd: 0
          });
        }
      }
    }

    assets.sort((a, b) => b.valueUsd - a.valueUsd);

    return NextResponse.json(
      {
        wallet: ownerKey.toBase58(),
        sol: {
          lamports,
          amount: lamports / 1e9
        },
        assets
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Wallet summary failed" },
      { status: 400 }
    );
  }
}
