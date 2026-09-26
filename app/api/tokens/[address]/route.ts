import { NextResponse } from "next/server";
import type { DexPair } from "../../../../lib/ranking";
import { normalize, scorePair } from "../../../../lib/ranking";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;

  try {
    const r = await fetch("https://api.dexscreener.com/tokens/v1/solana/" + address, {
      headers: { accept: "application/json" },
      next: { revalidate: 15 }
    });
    if (!r.ok) {
      return NextResponse.json({ token: null, error: "Market data unavailable" }, { status: r.status });
    }

    const pairs: DexPair[] = await r.json();
    const pair = pairs
      .filter((p) => p.chainId === "solana" && p.baseToken?.address === address)
      .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];

    if (!pair) {
      return NextResponse.json({ token: null, error: "Token not found" }, { status: 404 });
    }

    return NextResponse.json(
      { token: { ...normalize(pair), heat: scorePair(pair), sourcePair: pair } },
      { headers: { "Cache-Control": "s-maxage=15, stale-while-revalidate=30" } }
    );
  } catch (error) {
    return NextResponse.json(
      { token: null, error: error instanceof Error ? error.message : "Token lookup failed" },
      { status: 502 }
    );
  }
}
