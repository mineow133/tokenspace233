export type DexPair = {
  chainId?: string;
  url?: string;
  pairAddress?: string;
  baseToken?: { address: string; name: string; symbol: string };
  priceUsd?: string;
  txns?: { h24?: { buys?: number; sells?: number } };
  volume?: { h24?: number };
  priceChange?: { h24?: number };
  liquidity?: { usd?: number };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  info?: { imageUrl?: string; websites?: { url?: string }[]; socials?: { type?: string; url?: string }[] };
};

export function scorePair(p: DexPair) {
  const volume = p.volume?.h24 ?? 0;
  const change = p.priceChange?.h24 ?? 0;
  const txns = (p.txns?.h24?.buys ?? 0) + (p.txns?.h24?.sells ?? 0);
  const liquidity = p.liquidity?.usd ?? 0;
  const age = p.pairCreatedAt ? Math.max(0, Date.now() - p.pairCreatedAt) : Infinity;
  const volumeMomentum = Math.min(100, Math.log10(volume + 1) * 12);
  const changeMomentum = Math.max(0, Math.min(100, 50 + change));
  const transactionMomentum = Math.min(100, Math.log10(txns + 1) * 22);
  const liquidityMomentum = Math.min(100, Math.log10(liquidity + 1) * 20);
  const recency = age < 86_400_000 ? 100 : age < 604_800_000 ? 70 : 35;
  return Math.round(
    volumeMomentum * 0.3 +
    changeMomentum * 0.25 +
    transactionMomentum * 0.2 +
    liquidityMomentum * 0.15 +
    recency * 0.1
  );
}

export function normalize(p: DexPair) {
  return {
    address: p.baseToken?.address ?? "",
    symbol: p.baseToken?.symbol ?? "UNKNOWN",
    name: p.baseToken?.name ?? "Unknown token",
    image: p.info?.imageUrl ?? "",
    pairAddress: p.pairAddress ?? "",
    price: Number(p.priceUsd ?? 0),
    marketCap: p.marketCap ?? p.fdv ?? 0,
    liquidity: p.liquidity?.usd ?? 0,
    volume: p.volume?.h24 ?? 0,
    change: p.priceChange?.h24 ?? 0,
    txns: (p.txns?.h24?.buys ?? 0) + (p.txns?.h24?.sells ?? 0),
    buys: p.txns?.h24?.buys ?? 0,
    sells: p.txns?.h24?.sells ?? 0,
    score: scorePair(p),
    pairUrl: p.url ?? "",
    createdAt: p.pairCreatedAt ? new Date(p.pairCreatedAt).toISOString() : ""
  };
}
