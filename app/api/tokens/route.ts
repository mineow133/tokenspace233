import { NextResponse } from "next/server";
import { normalize, scorePair, type DexPair } from "../../../lib/ranking";

export const dynamic = "force-dynamic";

const DEX = "https://api.dexscreener.com";
const JUP = "https://api.jup.ag";
const GECKO = "https://api.geckoterminal.com/api/v2";

async function getJson(base: string, path: string, cacheSeconds?: number) {
  const response = await fetch(base + path, {
    headers: { accept: "application/json" },
    ...(cacheSeconds ? { next: { revalidate: cacheSeconds } } : { cache: "no-store" })
  });
  if (!response.ok) throw new Error("Market source " + response.status);
  return response.json();
}

type GeckoPool = {
  attributes?: {
    name?: string;
    base_token_price_usd?: string;
    fdv_usd?: string;
    market_cap_usd?: string;
    reserve_in_usd?: string;
    pool_created_at?: string;
    price_change_percentage?: Record<string, string>;
    volume_usd?: Record<string, string>;
    transactions?: Record<string, { buys?: number; sells?: number }>;
  };
  relationships?: { base_token?: { data?: { id?: string } } };
};

function geckoToken(pool: GeckoPool) {
  const a = pool.attributes ?? {};
  const address = pool.relationships?.base_token?.data?.id?.replace(/^solana_/, "") || "";
  const created = Date.parse(a.pool_created_at || "");
  return {
    address,
    symbol: (a.name || "UNKNOWN").split(" / ")[0].slice(0, 18),
    name: a.name || "Fresh Solana pool",
    image: "",
    pairAddress: "",
    price: Number(a.base_token_price_usd ?? 0),
    marketCap: Number(a.market_cap_usd ?? a.fdv_usd ?? 0),
    liquidity: Number(a.reserve_in_usd ?? 0),
    volume: Number(a.volume_usd?.h24 ?? 0),
    volume5m: Number(a.volume_usd?.m5 ?? 0),
    volume1h: Number(a.volume_usd?.h1 ?? 0),
    change: Number(a.price_change_percentage?.h24 ?? 0),
    priceChange5m: Number(a.price_change_percentage?.m5 ?? 0),
    buys: a.transactions?.h24?.buys ?? 0,
    sells: a.transactions?.h24?.sells ?? 0,
    txns: (a.transactions?.h24?.buys ?? 0) + (a.transactions?.h24?.sells ?? 0),
    score: 0,
    pairUrl: "",
    createdAt: created ? new Date(created).toISOString() : ""
  };
}

export async function GET() {
  try {
    const results = await Promise.allSettled([
      getJson(DEX, "/token-profiles/latest/v1", 15),
      getJson(DEX, "/token-boosts/latest/v1", 15),
      getJson(DEX, "/token-boosts/top/v1", 15),
      getJson(DEX, "/community-takeovers/latest/v1", 15),
      getJson(JUP, "/tokens/v2/recent?limit=100"),
      getJson(GECKO, "/networks/solana/new_pools?page=1", 10),
      getJson(GECKO, "/networks/solana/new_pools?page=2", 10),
      getJson(GECKO, "/networks/solana/new_pools?page=3", 10)
    ]);

    const addresses = new Set<string>();

    for (const index of [0, 1, 2, 3]) {
      const result = results[index];
      if (result.status !== "fulfilled" || !Array.isArray(result.value)) continue;
      for (const row of result.value) {
        if (row?.chainId === "solana" && row?.tokenAddress) addresses.add(row.tokenAddress);
      }
    }

    const recent = results[4].status === "fulfilled" && Array.isArray(results[4].value) ? results[4].value : [];
    for (const row of recent) if (row?.id) addresses.add(row.id);

    const freshPools: GeckoPool[] = [];
    for (const index of [5, 6, 7]) {
      const result = results[index];
      if (result.status === "fulfilled" && Array.isArray(result.value?.data)) {
        freshPools.push(...result.value.data);
      }
    }
    for (const pool of freshPools) {
      const address = geckoToken(pool).address;
      if (address) addresses.add(address);
    }

    const unique = [...addresses].slice(0, 360);
    const chunks = Array.from({ length: Math.ceil(unique.length / 30) }, (_, index) =>
      getJson(DEX, "/tokens/v1/solana/" + unique.slice(index * 30, (index + 1) * 30).join(","), 15).catch(() => [])
    );
    const pairResults = await Promise.all(chunks);
    const pairs: DexPair[] = pairResults.flat();

    const best = new Map<string, DexPair>();
    for (const pair of pairs) {
      if (pair.chainId !== "solana" || !pair.baseToken?.address) continue;
      const previous = best.get(pair.baseToken.address);
      if (!previous || (pair.liquidity?.usd ?? 0) > (previous.liquidity?.usd ?? 0)) {
        best.set(pair.baseToken.address, pair);
      }
    }

    const tokens = [...best.values()]
      .map(normalize)
      .filter((token) => token.liquidity >= 800 && token.marketCap >= 2500)
      .sort((a, b) => b.score - a.score);

    const fresh = freshPools
      .map(geckoToken)
      .filter((token) => token.address && token.liquidity >= 500 && token.marketCap >= 1500)
      .map((token) => {
        const pair = best.get(token.address);
        if (!pair) return token;
        return { ...normalize(pair), createdAt: pair.pairCreatedAt ? new Date(pair.pairCreatedAt).toISOString() : token.createdAt };
      })
      .sort((a, b) => Date.parse(b.createdAt || "0") - Date.parse(a.createdAt || "0"));

    const merged = new Map<string, any>();
    for (const token of tokens) merged.set(token.address, token);
    for (const token of fresh) if (!merged.has(token.address)) merged.set(token.address, token);

    const all = [...merged.values()];
    return NextResponse.json(
      {
        tokens: all.slice(0, 300),
        newTokens: fresh.slice(0, 180),
        candidates: unique.length,
        sources: ["DEX Screener", "Jupiter", "GeckoTerminal"],
        updatedAt: Date.now()
      },
      { headers: { "Cache-Control": "s-maxage=15, stale-while-revalidate=30" } }
    );
  } catch (error) {
    return NextResponse.json(
      { tokens: [], newTokens: [], candidates: 0, error: error instanceof Error ? error.message : "Market unavailable" },
      { status: 502 }
    );
  }
}
