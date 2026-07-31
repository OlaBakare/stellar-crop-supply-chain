# AGENTS.md

This file provides guidance for AI agents (like Kilo) working on the Stellar Crop Supply Chain project.

## Project Overview

Stellar Crop Supply Chain is a transparent, on-chain crop supply contract system for agriculture built on Stellar Soroban. It consists of:

1. **Smart Contracts** (`contracts/`) — Rust/Soroban contract for crop supply contract and order management
2. **TypeScript SDK** (`sdk/`) — Type-safe client for contract interaction
3. **Frontend** (`frontend/`) — Next.js dashboard for browsing and creating crop supply contracts

## Build & Test Commands

### Contracts
```bash
cd contracts
cargo test                    # Run unit tests
cargo clippy                  # Lint
cargo fmt                     # Format
cargo build --target wasm32v1-none --release  # Build WASM
```

### SDK
```bash
cd sdk
npm install
npm run build                 # Build
npm run test                  # Run tests
npm run lint                  # Lint
```

### Frontend
```bash
cd frontend
npm install
npm run dev                   # Dev server at localhost:3000
npm run build                 # Production build
npm run typecheck             # Type check
npm run lint                  # Lint
```

## Code Style Guidelines

### Rust/Soroban
- `#![no_std]` at the top of `lib.rs`
- Use `symbol_short!` for strings ≤ 9 characters
- Use `contracterror` for error types with `#[repr(u32)]`
- Use `contracttype` for all serializable types
- Add doc comments to all public functions
- Run `cargo fmt` and `cargo clippy` before committing
- Keep WASM size small — avoid unnecessary abstractions

### TypeScript
- Use strict mode
- Use `const` over `let` where possible
- Prefer `async/await` over `.then()`
- Use proper type annotations
- Run `npm run lint` and `npm run typecheck` before committing

### React/Frontend
- Use the App Router (Next.js 14+)
- Use `use client` for interactive components
- Use the `clsx` library for conditional class names
- Follow the existing component patterns in `src/components/`

## Common Tasks

### Adding a new contract function
1. Add the function to the `impl CropSupplyContract` block in `contracts/src/lib.rs`
2. Add any new types to `contracts/src/types.rs`
3. Add any new errors to `contracts/src/error.rs`
4. Add any new constants to `contracts/src/constants.rs`
5. Write unit tests in `contracts/src/test.rs`
6. Run `cargo test` to verify

### Adding a new SDK method
1. Add the method to `sdk/src/client.ts` in the `CropSupplyClient` class
2. Add any new types to `sdk/src/types.ts`
3. Export new types from `sdk/src/index.ts`
4. Run `npm run build` to verify

### Adding a new frontend page
1. Create the page in `frontend/src/app/`
2. Add API routes in `frontend/src/app/api/` if needed
3. Use existing UI components from `frontend/src/components/`
4. Run `npm run typecheck` to verify

## Drips Wave Contribution Guidelines

When working on issues labeled for Drips Wave:
- Comment on the issue before starting work
- Create a branch from `main` with a descriptive name
- Follow the conventional commit format
- Ensure all tests pass
- Keep PRs focused on a single issue
- Reference the issue number in the PR description

## File Locations

| Component | Path |
|-----------|------|
| Contract source | `contracts/src/lib.rs` |
| Contract types | `contracts/src/types.rs` |
| Contract errors | `contracts/src/error.rs` |
| Contract constants | `contracts/src/constants.rs` |
| Contract tests | `contracts/src/test.rs` |
| SDK client | `sdk/src/client.ts` |
| SDK types | `sdk/src/types.ts` |
| Frontend pages | `frontend/src/app/` |
| Frontend components | `frontend/src/components/` |
| Frontend API | `frontend/src/app/api/` |
| Frontend types | `frontend/src/lib/types.ts` |
| Frontend API client | `frontend/src/lib/api.ts` |
| Drips Wave issues | `issues/wave-issues.md` |
