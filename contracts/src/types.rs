use soroban_sdk::{contracttype, Address, String};

/// Storage keys for the contract.
#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub enum DataKey {
    Contract(u64),
    Order(u64),
    FarmerContracts(Address),
    ContractOrders(u64),
    BuyerOrders(Address),
}

/// Status of a crop supply contract.
#[contracttype]
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub enum ContractStatus {
    Active,
    Completed,
    Cancelled,
}

/// Status of an individual crop order.
#[contracttype]
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub enum OrderStatus {
    Pending,
    Shipped,
    Delivered,
    Refunded,
}

/// A crop supply contract created by a farmer or farming cooperative.
#[contracttype]
#[derive(Clone, Debug)]
pub struct CropContract {
    pub id: u64,
    pub farmer: Address,
    pub title: String,
    pub description: String,
    pub target_amount: i128,
    pub funded_amount: i128,
    pub deadline: u64,
    pub created_at: u64,
    pub status: ContractStatus,
    pub order_count: u32,
}

/// A single crop order placed against a supply contract.
#[contracttype]
#[derive(Clone, Debug)]
pub struct Order {
    pub id: u64,
    pub contract_id: u64,
    pub buyer: Address,
    pub amount: i128,
    pub ordered_at: u64,
    pub status: OrderStatus,
    pub delivered_at: Option<u64>,
    pub refunded_at: Option<u64>,
}

/// Event emitted when a crop contract is created.
#[contracttype]
#[derive(Clone, Debug)]
pub struct ContractCreatedEvent {
    pub contract_id: u64,
    pub farmer: Address,
    pub target_amount: i128,
    pub deadline: u64,
    pub created_at: u64,
}

/// Event emitted when a crop contract status changes.
#[contracttype]
#[derive(Clone, Debug)]
pub struct ContractStatusChangeEvent {
    pub contract_id: u64,
    pub old_status: ContractStatus,
    pub new_status: ContractStatus,
    pub changed_by: Address,
    pub timestamp: u64,
}

/// Event emitted when a crop order is placed.
#[contracttype]
#[derive(Clone, Debug)]
pub struct OrderCreatedEvent {
    pub order_id: u64,
    pub contract_id: u64,
    pub buyer: Address,
    pub amount: i128,
    pub ordered_at: u64,
}

/// Event emitted when a crop order status changes.
#[contracttype]
#[derive(Clone, Debug)]
pub struct OrderStatusChangeEvent {
    pub order_id: u64,
    pub old_status: OrderStatus,
    pub new_status: OrderStatus,
    pub changed_by: Address,
    pub timestamp: u64,
}

/// Event emitted when a crop order is refunded.
#[contracttype]
#[derive(Clone, Debug)]
pub struct OrderRefundedEvent {
    pub order_id: u64,
    pub buyer: Address,
    pub amount: i128,
    pub old_status: OrderStatus,
    pub refunded_at: u64,
}
