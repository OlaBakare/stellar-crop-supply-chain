use soroban_sdk::contracterror;

/// Error types for the Crop Supply contract.
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    /// The contract has already been initialized.
    AlreadyInitialized = 1,
    /// The caller is not authorized to perform this action.
    Unauthorized = 2,
    /// The specified crop contract was not found.
    ContractNotFound = 3,
    /// The specified order was not found.
    OrderNotFound = 4,
    /// The crop contract is not in an active state.
    ContractNotActive = 5,
    /// The crop contract deadline has passed.
    ContractExpired = 6,
    /// The provided amount is invalid (zero or negative).
    InvalidAmount = 7,
    /// The contract deadline is invalid (in the past).
    InvalidDeadline = 8,
    /// The contract title exceeds the maximum allowed length.
    TitleTooLong = 9,
    /// The contract description exceeds the maximum allowed length.
    DescriptionTooLong = 10,
    /// The status transition is not allowed.
    InvalidTransition = 11,
    /// The order is not eligible for refund.
    InvalidRefundState = 12,
    /// The contract has not been initialized.
    NotInitialized = 13,
    /// The order amount is below the minimum allowed.
    OrderBelowMinimum = 14,
    /// The order amount exceeds the maximum allowed.
    OrderExceedsMaximum = 15,
    /// The order amount would exceed the contract funding target.
    OrderExceedsTarget = 16,
    /// The provided page size exceeds the maximum allowed.
    InvalidPageSize = 17,
    /// The requested page is out of range.
    PageOutOfRange = 18,
    /// The contract has not reached a state that allows withdrawal.
    WithdrawalNotAllowed = 19,
    /// The contract has not yet expired.
    ContractNotExpired = 20,
    /// No signers have been configured for this contract.
    NoSignersConfigured = 21,
    /// The caller is not an approved signer for this contract.
    NotApprover = 22,
}
