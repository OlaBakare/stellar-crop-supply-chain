# Drips Wave Issues

This document defines the issues available for contribution during Drips Wave cycles. Each issue is categorized by complexity level.

## Complexity Levels

| Level | Points | Description |
|-------|--------|-------------|
| Trivial | 100 | Typos, minor copy changes, small bug fixes |
| Medium | 150 | Standard features or involved bug fixes |
| High | 200 | Complex features, refactors, new integrations |

---

## Trivial Issues (100 points)

### 1. Add unit tests for `version()` and `get_metadata()`
**Complexity:** Trivial  
**Files:** `contracts/src/test.rs`  
**Description:** The contract has `version()` and `get_metadata()` functions but they lack dedicated unit tests. Add tests that verify:
- `version()` returns `1`
- `get_metadata()` returns a map containing keys "name", "version", and "features"

**Acceptance Criteria:**
- Tests pass with `cargo test`
- No clippy warnings

---

### 2. Fix typo in contract description string
**Complexity:** Trivial  
**Files:** `contracts/src/lib.rs`  
**Description:** The metadata description string contains a typo. Find and fix it.

**Acceptance Criteria:**
- Typo is corrected
- No new warnings introduced

---

### 3. Add `.env.example` for the frontend
**Complexity:** Trivial  
**Files:** `frontend/.env.example`  
**Description:** The frontend README references a `.env.local` file but there's no example. Create a `.env.example` with the required environment variables documented.

**Acceptance Criteria:**
- File exists at `frontend/.env.example`
- Contains `NEXT_PUBLIC_RPC_URL`, `NEXT_PUBLIC_NETWORK`, `NEXT_PUBLIC_CONTRACT_ID`
- Each variable has a comment explaining its purpose

---

### 4. Improve error message in SDK `ContractError`
**Complexity:** Trivial  
**Files:** `sdk/src/types.ts`  
**Description:** The `ContractError` class should include a human-readable message for each error code. Add a `getMessage()` method that returns a descriptive string based on the error code.

**Acceptance Criteria:**
- Method added to `ContractError` class
- Returns appropriate message for each `ContractErrorCode`
- TypeScript compiles without errors

---

## Medium Issues (150 points)

### 5. Add contract search/filter by title
**Complexity:** Medium  
**Files:** `contracts/src/lib.rs`, `contracts/src/test.rs`  
**Description:** Add a `search_contracts(env, query: String) -> Vec<u64>` function that returns contract IDs whose titles contain the query string. This requires iterating over the farmer-contracts index or maintaining a separate title index.

**Acceptance Criteria:**
- Function added to contract
- Returns matching contract IDs
- Tests cover: exact match, partial match, no match, empty query
- `cargo test` passes

---

### 6. Enforce order amount limits in `place_order`
**Complexity:** Medium  
**Files:** `contracts/src/lib.rs`, `contracts/src/constants.rs`, `contracts/src/test.rs`  
**Description:** `MIN_ORDER_AMOUNT` is defined in `constants.rs` but `place_order()` only checks `amount > 0`. Enforce `MIN_ORDER_AMOUNT` and add a `MAX_ORDER_AMOUNT` constant (100_000 XLM in stroops) to prevent excessively large orders. Validate both in `place_order()`.

**Acceptance Criteria:**
- Constants defined and enforced in `constants.rs`
- `place_order()` validates against both limits
- Tests cover: below minimum, above maximum, within range
- Error variant `InvalidAmount` is used for both cases

---

### 7. Implement SDK event subscription for order status changes
**Complexity:** Medium  
**Files:** `sdk/src/client.ts`  
**Description:** Add a method `watchOrderStatus(orderId: string, callback: (status: OrderStatus) => void)` to the SDK client that polls the contract and calls the callback when the order status changes. Use the `get_order` method for polling.

**Acceptance Criteria:**
- Method added to `CropSupplyClient`
- Polls at a configurable interval (default 5 seconds)
- Calls callback with new status when it changes
- Returns a cleanup function to stop polling
- TypeScript types are correct

---

### 8. Add contract progress bar component to frontend
**Complexity:** Medium  
**Files:** `frontend/src/components/`  
**Description:** Create a reusable `ProgressBar` component that shows the funding progress of a contract (funded vs. target). Include percentage text, color coding (red < 25%, yellow < 50%, green >= 50%), and accessibility labels.

**Acceptance Criteria:**
- Component is reusable and takes `funded`, `target` props
- Color coding works as specified
- Accessible (has `aria-label` and `role="progressbar"`)
- Used in `ContractCard` component

---

### 9. Add pagination to `get_contract_orders`
**Complexity:** Medium  
**Files:** `contracts/src/lib.rs`, `contracts/src/test.rs`  
**Description:** The current `get_contract_orders` returns all orders for a contract. For contracts with many orders, this could exceed Soroban's compute limits. Add a paginated version: `get_contract_orders_paginated(contract_id, page: u32, page_size: u32) -> Vec<u64>`.

**Acceptance Criteria:**
- New function added
- Returns the correct slice of order IDs
- Tests cover: first page, last page, empty page, page beyond range
- `MAX_PAGE_SIZE` constant defined and enforced

---

## High Issues (200 points)

### 10. Implement multi-signature contract withdrawal
**Complexity:** High  
**Files:** `contracts/src/lib.rs`, `contracts/src/types.rs`, `contracts/src/error.rs`, `contracts/src/test.rs`  
**Description:** Add support for multi-signature contract owner approval. A contract can be configured with a list of authorized signers (addresses). When a contract reaches its target, funds can only be withdrawn if a threshold number of signers approve. Add:
- `configure_contract_signers(farmer, contract_id, signers: Vec<Address>, threshold: u32)`
- `approve_withdrawal(farmer, contract_id)` 
- `withdraw_funds(farmer, contract_id, amount)` — requires threshold approvals

**Acceptance Criteria:**
- Signers and threshold stored per contract
- Withdrawal requires threshold approvals from unique signers
- Each signer can only approve once per withdrawal
- Tests cover: insufficient approvals, duplicate approval, threshold met, threshold not met, unauthorized signer
- Events emitted for all actions

---

### 11. Add order refund automation for expired contracts
**Complexity:** High  
**Files:** `contracts/src/lib.rs`, `contracts/src/types.rs`  
**Description:** Currently buyers must manually call `request_refund`. Add a `process_expired_contract_refunds(contract_id)` function that automatically processes all eligible refunds for orders on an expired contract. This requires iterating over all contract orders and refunding those in Pending or Shipped status.

**Acceptance Criteria:**
- Function processes all eligible orders in one call
- Respects `MAX_BATCH_SIZE` to stay within compute limits
- Returns the number of refunds processed
- Emits a batch refund event
- Tests cover: partial processing, full processing, no eligible orders, contract not expired

---

### 12. Implement frontend order flow with Stellar wallet integration
**Complexity:** High  
**Files:** `frontend/src/`  
**Description:** Implement a complete order flow that:
1. Connects to a Stellar wallet (Freighter or xBull)
2. Signs and submits a Soroban contract invocation to place an order
3. Shows transaction status (pending, success, failed)
4. Updates the UI in real-time

Requires integrating the SDK client with the frontend and the wallet adapter.

**Acceptance Criteria:**
- User can connect a Stellar wallet
- User can enter order amount and submit
- Transaction is signed and submitted to Soroban RPC
- UI shows loading/success/error states
- Order appears in the contract's order list after confirmation

---

### 13. Add contract upgradeability pattern
**Complexity:** High  
**Files:** `contracts/src/lib.rs`, `contracts/src/types.rs`  
**Description:** Implement an upgradeability pattern where the contract can be upgraded to a new WASM hash by the admin. Add:
- `upgrade(env, admin, new_wasm_hash: Bytes)` — admin only
- `get_wasm_hash(env)` — returns current WASM hash
- `set_admin(env, admin, new_admin: Address)` — transfer admin rights

**Acceptance Criteria:**
- Admin can upgrade contract to new WASM hash
- Non-admin callers are rejected
- Admin transfer works correctly
- Events emitted for all admin actions
- Tests cover all scenarios

---

## Wave Submission Notes

### For Contributors
1. Comment on the issue before starting work
2. Fork the repository and create a branch from `main`
3. Follow the code style guidelines in CONTRIBUTING.md
4. Ensure all tests pass before opening a PR
5. Reference the issue number in your PR description (e.g., `Closes #5`)

### For Maintainers
1. Review applications within 24 hours during the Wave
2. Assign issues promptly to qualified contributors
3. Ensure PRs are merged before the Wave ends
4. Use the Compliment window to recognize outstanding contributions
