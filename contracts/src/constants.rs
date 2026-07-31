use soroban_sdk::{symbol_short, Symbol};

/// Storage key for the admin address.
pub const ADMIN_KEY: Symbol = symbol_short!("ADMIN");

/// Storage key for the next contract ID counter.
pub const NEXT_CONTRACT_ID_KEY: Symbol = symbol_short!("NEXT_CID");

/// Storage key for the next order ID counter.
pub const NEXT_ORDER_ID_KEY: Symbol = symbol_short!("NEXT_OID");

/// Maximum length for contract titles (in bytes).
pub const MAX_TITLE_LENGTH: u32 = 200;

/// Maximum length for contract descriptions (in bytes).
pub const MAX_DESCRIPTION_LENGTH: u32 = 1000;

/// Minimum order amount in stroops (0.0000001 XLM).
pub const MIN_ORDER_AMOUNT: i128 = 1;

/// Maximum contract target in stroops (10_000_000 XLM).
pub const MAX_CONTRACT_TARGET: i128 = 100_000_000_000_000;
