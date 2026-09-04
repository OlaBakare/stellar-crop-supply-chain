# Frontend Dashboard

The Next.js frontend for Stellar Crop Supply Chain.

## Development

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

## Build

```bash
npm run build
npm start
```

## Features

- **Contract browsing** — View all active crop supply contracts
- **Contract creation** — Create new crop supply contracts
- **Wallet connection** — Connect Stellar wallets (Freighter, xBull)
- **Order flow** — Place crop orders with on-chain confirmation
- **Status tracking** — Track order status from pending to delivered

## Environment Variables

The API routes connect to a live Soroban contract server-side. Copy
[`.env.example`](./.env.example) to `.env.local` and fill in the values:

```env
STELLAR_RPC_URL=https://soroban-testnet.stellar.org:443
STELLAR_NETWORK_PASSPHRASE=Test SDF Network; September 2015
STELLAR_CONTRACT_ID=
STELLAR_SIGNER_SECRET=
```

- `STELLAR_SIGNER_SECRET` — secret seed (`S...`) of the account the API routes
  sign with. Its public key is used as the farmer/buyer for on-chain calls, so
  never commit a real secret.

When the variables are unset the API routes return empty results so the app
still runs locally without a network.

> The frontend depends on the local SDK package via
> `"@stellar-crop-supply/sdk": "file:../sdk"`. Build the SDK first
> (`cd ../sdk && npm install && npm run build`) so its `dist` output exists
> before installing the frontend.

## Project Structure

```
src/
├── app/
│   ├── api/          # API routes (Next.js App Router)
│   ├── contracts/    # Contracts list page
│   ├── create/       # Create contract page
│   ├── page.tsx      # Home page
│   └── layout.tsx    # Root layout
├── components/
│   ├── ui/           # Reusable UI components
│   ├── ContractCard.tsx
│   └── ConnectWalletButton.tsx
└── lib/
    ├── api.ts        # Browser API client
    ├── soroban.ts    # Server-side Soroban/SDK adapter
    └── types.ts      # TypeScript types
```
