import TerminalShell from "../../components/TerminalShell";
import MarketBoard from "../../components/MarketBoard";

export default function MarketsPage() {
  return (
    <TerminalShell>
      <MarketBoard
        title="The Solana market, without the noise."
        subtitle="Scan the live market by volume, liquidity, price momentum and fresh pair activity."
        compact
      />
    </TerminalShell>
  );
}
