import TerminalShell from "../components/TerminalShell";
import MarketBoard from "../components/MarketBoard";

export default function HomePage() {
  return (
    <TerminalShell>
      <MarketBoard
        title="Find the move before the crowd."
        subtitle="TokenSpace turns raw Solana activity into a fast visual radar — then puts execution one click away."
      />
    </TerminalShell>
  );
}
