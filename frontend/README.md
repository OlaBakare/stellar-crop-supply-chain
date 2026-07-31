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

Create a `.env.local` file:

```env
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org:443
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_CONTRACT_ID=
```

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
    ├── api.ts        # API client
    └── types.ts      # TypeScript types
```
