export type AlphaCandidate = {
  address: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  marketCap: number;
  liquidity: number;
  volume5m: number;
  volume1h: number;
  buys5m: number;
  sells5m: number;
  priceChange5m: number;
  ageMinutes: number;
  source: string;
};

export type AlphaSignal = AlphaCandidate & {
  score: number;
  buyPressure: number;
  volumeAcceleration: number;
};

const clamp=(x:number,min=0,max=100)=>Math.max(min,Math.min(max,x));

export function alphaScore(t:AlphaCandidate){
  const trades=t.buys5m+t.sells5m;
  const pressure=trades?t.buys5m/trades*100:50;
  const volVsCap=t.marketCap>0?t.volume5m/t.marketCap:0;
  const acceleration=t.volume1h>0?(t.volume5m*12)/t.volume1h:0;
  const freshness=t.ageMinutes<=5?100:t.ageMinutes<=15?88:t.ageMinutes<=30?72:t.ageMinutes<=60?56:35;
  const flow=clamp(Math.log10(1+volVsCap*100)*43);
  const pressureScore=clamp(50+(pressure-50)*1.35);
  const liquidity=clamp(Math.log10(t.liquidity+1)*19);
  const velocity=clamp(acceleration*27);
  const shortMove=clamp(50+t.priceChange5m*2.4);
  return Math.round(freshness*.25+flow*.23+pressureScore*.18+liquidity*.13+velocity*.13+shortMove*.08);
}

export function toAlphaSignal(t:AlphaCandidate):AlphaSignal{
  const trades=t.buys5m+t.sells5m;
  return {
    ...t,
    score:alphaScore(t),
    buyPressure:trades?t.buys5m/trades*100:50,
    volumeAcceleration:t.volume1h>0?(t.volume5m*12)/t.volume1h:0
  };
}

export function isAlphaCall(t:AlphaSignal){
  return t.score>=72&&t.ageMinutes<=120&&t.marketCap>=5000&&t.marketCap<=750000&&t.liquidity>=1200&&t.volume5m>=1000&&t.buyPressure>=54;
}
