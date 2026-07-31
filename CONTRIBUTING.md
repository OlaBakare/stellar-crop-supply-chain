# Contributing to Stellar Crop Supply Chain

Thank you for your interest in contributing! This guide covers everything you need to get started.

## Getting Started

### Prerequisites

| Dependency | Version | Purpose |
|---|---|---|
| **Rust** | >= 1.75 stable | Soroban smart contracts |
| **wasm32v1-none** | — | Cross-compile contracts to WASM |
| **Stellar CLI** (`stellar`) | >= 21.x | Deploy and invoke contracts |
| **Node.js** | >= 18.x | SDK and frontend |
| **npm** | >= 9.x | Package management |

Install the Rust WASM target:

```bash
rustup target add wasm32v1-none
```

Install the Stellar CLI:

```bash
cargo install --locked stellar-cli
```

### Local Development Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-org/stellar-crop-supply-chain.git
   cd stellar-crop-supply-chain
   ```

2. **Build and test smart contracts:**

   ```bash
   cd contracts
   cargo test           # Run all unit tests
   cargo clippy         # Lint the contract code
   cargo fmt            # Format the code
   ```

3. **Build the SDK:**

   ```bash
   cd sdk
   npm install
   npm run build
   ```

4. **Run the frontend:**

   ```bash
   cd frontend
   npm install
   npm run dev          # http://localhost:3000
   ```

## Project Structure

```
stellar-crop-supply-chain/
├── contracts/           # Soroban smart contracts (Rust)
│   ├── src/
│   │   ├── lib.rs       # Main contract entry points
│   │   ├── error.rs     # Error types
│   │   ├── types.rs     # Data structures
│   │   ├── constants.rs # Contract constants
│   │   └── test.rs      # Unit tests
│   └── Cargo.toml
├── sdk/                 # TypeScript SDK
│   ├── src/
│   │   ├── client.ts    # Contract client
│   │   ├── types.ts     # Type definitions
│   │   └── index.ts     # Main exports
│   └── package.json
├── frontend/            # Next.js dashboard
│   ├── src/
│   │   ├── app/         # App Router pages
│   │   ├── components/   # React components
│   │   └── lib/         # Utilities and types
│   └── package.json
├── scripts/             # Build and deploy scripts
├── issues/              # Drips Wave issue definitions
├── README.md
└── CONTRIBUTING.md
```

## Running Tests

### Contract Tests

```bash
cd contracts
cargo test
```

### SDK Tests

```bash
cd sdk
npm run test
```

### Frontend Type Checking

```bash
cd frontend
npm run typecheck
```

## Code Style

### Contracts (Rust/Soroban)

- Run `cargo fmt` before committing
- Run `cargo clippy` and fix all warnings
- Write tests for all new functions
- Use `symbol_short!` for strings ≤ 9 characters
- Add doc comments to all public functions
- Keep contracts small — WASM size matters

### SDK (TypeScript)

- Follow the ESLint configuration
- Use strict TypeScript types
- Write unit tests for SDK functions
- Run `npm run build` to verify compilation

### Frontend (TypeScript/React)

- Use TypeScript strict mode
- Follow existing component patterns
- Run `npm run lint` and `npm run typecheck`

## Branch Naming

Use descriptive branch names with prefixes:

- `feat/` — New features (e.g., `feat/order-refund-ui`)
- `fix/` — Bug fixes (e.g., `fix/contract-deadline-validation`)
- `docs/` — Documentation (e.g., `docs/api-endpoint-reference`)
- `chore/` — Maintenance tasks (e.g., `chore/update-dependencies`)
- `refactor/` — Code restructuring
- `test/` — Adding or updating tests

## Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): short description

Optional longer description explaining the change.
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples:**
```
feat(contract): add refund functionality for expired contracts
fix(sdk): handle network errors in place order method
docs: add API reference for order status endpoints
```

## Pull Request Process

1. Open a PR against the `main` branch.
2. Fill in the PR template with a clear description.
3. Reference related issues (e.g., `Closes #42`).
4. Wait for CI checks to pass.
5. Address review feedback promptly.
6. A maintainer will merge once approved.

### PR Checklist

Before opening a PR:
- [ ] Tests pass (`cargo test` for contracts, `npm run test` for SDK/frontend)
- [ ] Linting passes (`cargo clippy`, `npm run lint`)
- [ ] New features have accompanying tests
- [ ] Commit messages follow the conventional format
- [ ] PR description explains what changed and why

## Finding Good First Issues

Look for issues labeled with:
- `good first issue` — Beginner-friendly tasks
- `help wanted` — Tasks where we need community help
- `complexity: trivial` — Simple changes (100 points)
- `complexity: medium` — Standard features (150 points)
- `complexity: high` — Complex features (200 points)

## Security

This project handles financial transactions. Do not open public issues for security vulnerabilities.

If you find a security issue, please report it responsibly via email to `security@stellar-crop-supply.org`.

## Code of Conduct

Please be respectful and constructive in all interactions. We are building a welcoming community for contributors of all backgrounds and experience levels.

## License

By contributing, you agree that your contributions will be licensed under the MIT license.
