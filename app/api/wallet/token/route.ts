import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

export const dynamic = "force-dynamic";
const RPC = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

function publicKey(value: string | null) {
  if (!value) throw new Error("Missing address");
  return new PublicKey(value);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get("owner");
  const mint = searchParams.get("mint");

  try {
    const connection = new Connection(RPC, "confirmed");
    const ownerKey = publicKey(owner);
    const mintKey = publicKey(mint);
    const rows = await connection.getParsedTokenAccountsByOwner(ownerKey, { mint: mintKey });

    let rawAmount = 0n;
    let decimals = 0;
    for (const row of rows.value) {
      const tokenAmount = row.account.data.parsed.info.tokenAmount;
      rawAmount += BigInt(tokenAmount.amount);
      decimals = tokenAmount.decimals;
    }

    const divisor = 10 ** decimals;
    const uiAmount = Number(rawAmount) / divisor;

    return NextResponse.json(
      { rawAmount: rawAmount.toString(), uiAmount, decimals },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Balance lookup failed" },
      { status: 400 }
    );
  }
}
