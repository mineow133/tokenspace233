# TokenSpace

Solana token discovery and trading terminal.

## Stack
- Next.js + TypeScript
- Tailwind/CSS terminal UI
- Solana Wallet Adapter
- Phantom + Solflare
- DEX Screener market data
- Jupiter swap execution

## Local setup

```bash
npm install
npm run dev
```

Create `.env.local` from `.env.example`.

Required:
- `JUPITER_API_KEY`

Optional:
- `SOLANA_RPC_URL`
- `NEXT_PUBLIC_SOLANA_RPC_URL`

Never commit `.env.local` or a real Jupiter key.

## Production smoke test

1. Open the home market.
2. Confirm Solana tokens load.
3. Open a token detail page.
4. Connect Phantom or Solflare.
5. Confirm the wallet address appears.
6. Check Buy/Sell tabs.
7. For a real mainnet swap, use a small test amount only.
8. Confirm the signed transaction appears on Solscan.
9. Open `/api/health` and confirm `ok: true`.

## Vercel

Import the GitHub repository into Vercel and add the environment variables in Project Settings before deployment. Do not put secrets in client-side code.
