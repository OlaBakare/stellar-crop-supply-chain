#![no_std]
#![allow(deprecated)]

use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Map, String, Symbol, Vec};

pub mod constants;
pub mod error;
pub mod types;

pub use constants::*;
pub use error::ContractError;
pub use types::*;

#[cfg(test)]
mod test;

#[contract]
pub struct CropSupplyContract;

#[contractimpl]
impl CropSupplyContract {
    /// Initialize the contract with an admin address.
    ///
    /// # Arguments
    /// * `admin` - The address that will have administrative privileges.
    ///
    /// # Errors
    /// Returns `ContractError::AlreadyInitialized` if the contract has already been initialized.
    pub fn initialize(env: Env, admin: Address) -> Result<(), ContractError> {
        if env.storage().instance().has(&ADMIN_KEY) {
            return Err(ContractError::AlreadyInitialized);
        }
        env.storage().instance().set(&ADMIN_KEY, &admin);
        env.events().publish(
            (symbol_short!("init"), symbol_short!("v1")),
            (admin.clone(), env.ledger().timestamp()),
        );
        Ok(())
    }

    /// Get the contract version.
    pub fn version(_env: Env) -> u32 {
        1
    }

    /// Get the contract metadata.
    pub fn get_metadata(env: Env) -> Map<Symbol, String> {
        let mut metadata = Map::new(&env);
        metadata.set(
            symbol_short!("name"),
            String::from_str(&env, "StellarCropSupply"),
        );
        metadata.set(symbol_short!("version"), String::from_str(&env, "1.0.0"));
        metadata.set(
            symbol_short!("features"),
            String::from_str(&env, "contracts,orders,tracking,refunds"),
        );
        metadata
    }

    // ── Contract Management ───────────────────────────────────────────────────

    /// Create a new crop supply contract.
    ///
    /// # Arguments
    /// * `farmer` - The address that owns and manages this contract.
    /// * `title` - A human-readable title for the contract (max 200 chars).
    /// * `description` - A detailed description (max 1000 chars).
    /// * `target_amount` - The funding goal in stroops (1 XLM = 10_000_000 stroops).
    /// * `deadline` - Unix timestamp by which the contract must reach its goal.
    ///
    /// # Returns
    /// The unique contract ID.
    ///
    /// # Errors
    /// * `ContractError::Unauthorized` — caller is not the contract farmer.
    /// * `ContractError::InvalidAmount` — target_amount is zero.
    /// * `ContractError::InvalidDeadline` — deadline is in the past.
    /// * `ContractError::TitleTooLong` — title exceeds 200 characters.
    /// * `ContractError::DescriptionTooLong` — description exceeds 1000 characters.
    pub fn create_contract(
        env: Env,
        farmer: Address,
        title: String,
        description: String,
        target_amount: i128,
        deadline: u64,
    ) -> Result<u64, ContractError> {
        farmer.require_auth();

        if target_amount <= 0 {
            return Err(ContractError::InvalidAmount);
        }

        let current_time = env.ledger().timestamp();
        if deadline <= current_time {
            return Err(ContractError::InvalidDeadline);
        }

        if title.len() > MAX_TITLE_LENGTH {
            return Err(ContractError::TitleTooLong);
        }

        if description.len() > MAX_DESCRIPTION_LENGTH {
            return Err(ContractError::DescriptionTooLong);
        }

        let contract_id = Self::next_contract_id(&env);

        let contract = CropContract {
            id: contract_id,
            farmer: farmer.clone(),
            title,
            description,
            target_amount,
            funded_amount: 0,
            deadline,
            created_at: current_time,
            status: ContractStatus::Active,
            order_count: 0,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Contract(contract_id), &contract);

        // Index contract by farmer
        let farmer_contracts_key = DataKey::FarmerContracts(farmer.clone());
        let mut farmer_contracts: Vec<u64> = env
            .storage()
            .persistent()
            .get(&farmer_contracts_key)
            .unwrap_or(Vec::new(&env));
        farmer_contracts.push_back(contract_id);
        env.storage()
            .persistent()
            .set(&farmer_contracts_key, &farmer_contracts);

        env.events().publish(
            (
                symbol_short!("contract"),
                symbol_short!("created"),
                symbol_short!("v1"),
            ),
            ContractCreatedEvent {
                contract_id,
                farmer: farmer.clone(),
                target_amount,
                deadline,
                created_at: current_time,
            },
        );

        Ok(contract_id)
    }

    /// Get crop contract details by ID.
    pub fn get_contract(env: Env, contract_id: u64) -> Result<CropContract, ContractError> {
        env.storage()
            .persistent()
            .get(&DataKey::Contract(contract_id))
            .ok_or(ContractError::ContractNotFound)
    }

    /// Get the list of contract IDs owned by a farmer.
    pub fn get_farmer_contracts(env: Env, farmer: Address) -> Vec<u64> {
        let key = DataKey::FarmerContracts(farmer);
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or(Vec::new(&env))
    }

    /// Update contract status (farmer only).
    ///
    /// # Arguments
    /// * `farmer` - Must be the contract farmer.
    /// * `contract_id` - The contract to update.
    /// * `status` - The new status.
    ///
    /// # Errors
    /// * `ContractError::Unauthorized` — caller is not the contract farmer.
    /// * `ContractError::ContractNotFound` — contract does not exist.
    /// * `ContractError::InvalidTransition` — status transition is not allowed.
    pub fn update_contract_status(
        env: Env,
        farmer: Address,
        contract_id: u64,
        status: ContractStatus,
    ) -> Result<(), ContractError> {
        farmer.require_auth();

        let mut contract: CropContract = env
            .storage()
            .persistent()
            .get(&DataKey::Contract(contract_id))
            .ok_or(ContractError::ContractNotFound)?;

        if contract.farmer != farmer {
            return Err(ContractError::Unauthorized);
        }

        if !is_valid_contract_transition(contract.status, status) {
            return Err(ContractError::InvalidTransition);
        }

        let old_status = contract.status;
        contract.status = status;

        env.storage()
            .persistent()
            .set(&DataKey::Contract(contract_id), &contract);

        env.events().publish(
            (
                symbol_short!("contract"),
                symbol_short!("updated"),
                symbol_short!("v1"),
            ),
            ContractStatusChangeEvent {
                contract_id,
                old_status,
                new_status: status,
                changed_by: farmer,
                timestamp: env.ledger().timestamp(),
            },
        );

        Ok(())
    }

    // ── Orders ─────────────────────────────────────────────────────────────────

    /// Place a crop order against a contract.
    ///
    /// # Arguments
    /// * `buyer` - The address placing the order.
    /// * `contract_id` - The contract to order from.
    /// * `amount` - The amount in stroops.
    ///
    /// # Returns
    /// The unique order ID.
    ///
    /// # Errors
    /// * `ContractError::Unauthorized` — caller is not the buyer.
    /// * `ContractError::ContractNotFound` — contract does not exist.
    /// * `ContractError::ContractNotActive` — contract is not accepting orders.
    /// * `ContractError::InvalidAmount` — amount is zero or negative.
    pub fn place_order(
        env: Env,
        buyer: Address,
        contract_id: u64,
        amount: i128,
    ) -> Result<u64, ContractError> {
        buyer.require_auth();

        if amount <= 0 {
            return Err(ContractError::InvalidAmount);
        }

        let mut contract: CropContract = env
            .storage()
            .persistent()
            .get(&DataKey::Contract(contract_id))
            .ok_or(ContractError::ContractNotFound)?;

        if contract.status != ContractStatus::Active {
            return Err(ContractError::ContractNotActive);
        }

        let current_time = env.ledger().timestamp();
        if current_time > contract.deadline {
            return Err(ContractError::ContractExpired);
        }

        let order_id = Self::next_order_id(&env);

        let order = Order {
            id: order_id,
            contract_id,
            buyer: buyer.clone(),
            amount,
            ordered_at: current_time,
            status: OrderStatus::Pending,
            delivered_at: None,
            refunded_at: None,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Order(order_id), &order);

        // Update contract funded amount and order count
        contract.funded_amount += amount;
        contract.order_count += 1;
        env.storage()
            .persistent()
            .set(&DataKey::Contract(contract_id), &contract);

        // Index order by contract
        let contract_orders_key = DataKey::ContractOrders(contract_id);
        let mut contract_orders: Vec<u64> = env
            .storage()
            .persistent()
            .get(&contract_orders_key)
            .unwrap_or(Vec::new(&env));
        contract_orders.push_back(order_id);
        env.storage()
            .persistent()
            .set(&contract_orders_key, &contract_orders);

        // Index order by buyer
        let buyer_orders_key = DataKey::BuyerOrders(buyer.clone());
        let mut buyer_orders: Vec<u64> = env
            .storage()
            .persistent()
            .get(&buyer_orders_key)
            .unwrap_or(Vec::new(&env));
        buyer_orders.push_back(order_id);
        env.storage()
            .persistent()
            .set(&buyer_orders_key, &buyer_orders);

        env.events().publish(
            (
                symbol_short!("order"),
                symbol_short!("created"),
                symbol_short!("v1"),
            ),
            OrderCreatedEvent {
                order_id,
                contract_id,
                buyer: buyer.clone(),
                amount,
                ordered_at: current_time,
            },
        );

        Ok(order_id)
    }

    /// Get order details by ID.
    pub fn get_order(env: Env, order_id: u64) -> Result<Order, ContractError> {
        env.storage()
            .persistent()
            .get(&DataKey::Order(order_id))
            .ok_or(ContractError::OrderNotFound)
    }

    /// Get all order IDs for a contract.
    pub fn get_contract_orders(env: Env, contract_id: u64) -> Vec<u64> {
        let key = DataKey::ContractOrders(contract_id);
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or(Vec::new(&env))
    }

    /// Get all order IDs from a buyer.
    pub fn get_buyer_orders(env: Env, buyer: Address) -> Vec<u64> {
        let key = DataKey::BuyerOrders(buyer);
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or(Vec::new(&env))
    }

    // ── Order Status Management ────────────────────────────────────────────────

    /// Mark an order as shipped (contract farmer only).
    ///
    /// # Errors
    /// * `ContractError::Unauthorized` — caller is not the contract farmer.
    /// * `ContractError::OrderNotFound` — order does not exist.
    /// * `ContractError::InvalidTransition` — order is not in Pending status.
    pub fn mark_shipped(env: Env, farmer: Address, order_id: u64) -> Result<(), ContractError> {
        farmer.require_auth();

        let mut order: Order = env
            .storage()
            .persistent()
            .get(&DataKey::Order(order_id))
            .ok_or(ContractError::OrderNotFound)?;

        let contract: CropContract = env
            .storage()
            .persistent()
            .get(&DataKey::Contract(order.contract_id))
            .ok_or(ContractError::ContractNotFound)?;

        if contract.farmer != farmer {
            return Err(ContractError::Unauthorized);
        }

        if order.status != OrderStatus::Pending {
            return Err(ContractError::InvalidTransition);
        }

        let old_status = order.status;
        order.status = OrderStatus::Shipped;

        env.storage()
            .persistent()
            .set(&DataKey::Order(order_id), &order);

        env.events().publish(
            (
                symbol_short!("order"),
                symbol_short!("status"),
                symbol_short!("v1"),
            ),
            OrderStatusChangeEvent {
                order_id,
                old_status,
                new_status: OrderStatus::Shipped,
                changed_by: farmer,
                timestamp: env.ledger().timestamp(),
            },
        );

        Ok(())
    }

    /// Mark an order as delivered (contract farmer only).
    ///
    /// # Errors
    /// * `ContractError::Unauthorized` — caller is not the contract farmer.
    /// * `ContractError::OrderNotFound` — order does not exist.
    /// * `ContractError::InvalidTransition` — order is not in Shipped status.
    pub fn mark_delivered(env: Env, farmer: Address, order_id: u64) -> Result<(), ContractError> {
        farmer.require_auth();

        let mut order: Order = env
            .storage()
            .persistent()
            .get(&DataKey::Order(order_id))
            .ok_or(ContractError::OrderNotFound)?;

        let contract: CropContract = env
            .storage()
            .persistent()
            .get(&DataKey::Contract(order.contract_id))
            .ok_or(ContractError::ContractNotFound)?;

        if contract.farmer != farmer {
            return Err(ContractError::Unauthorized);
        }

        if order.status != OrderStatus::Shipped {
            return Err(ContractError::InvalidTransition);
        }

        let old_status = order.status;
        let current_time = env.ledger().timestamp();
        order.status = OrderStatus::Delivered;
        order.delivered_at = Some(current_time);

        env.storage()
            .persistent()
            .set(&DataKey::Order(order_id), &order);

        env.events().publish(
            (
                symbol_short!("order"),
                symbol_short!("status"),
                symbol_short!("v1"),
            ),
            OrderStatusChangeEvent {
                order_id,
                old_status,
                new_status: OrderStatus::Delivered,
                changed_by: farmer,
                timestamp: current_time,
            },
        );

        Ok(())
    }

    /// Request a refund for an order that was not delivered (buyer only).
    ///
    /// An order is eligible for refund if it is still in Pending or Shipped status
    /// and the contract deadline has passed or the contract has been cancelled.
    ///
    /// # Errors
    /// * `ContractError::Unauthorized` — caller is not the buyer.
    /// * `ContractError::OrderNotFound` — order does not exist.
    /// * `ContractError::InvalidRefundState` — order is not eligible for refund.
    pub fn request_refund(env: Env, buyer: Address, order_id: u64) -> Result<(), ContractError> {
        buyer.require_auth();

        let mut order: Order = env
            .storage()
            .persistent()
            .get(&DataKey::Order(order_id))
            .ok_or(ContractError::OrderNotFound)?;

        if order.buyer != buyer {
            return Err(ContractError::Unauthorized);
        }

        if order.status != OrderStatus::Pending && order.status != OrderStatus::Shipped {
            return Err(ContractError::InvalidRefundState);
        }

        let contract: CropContract = env
            .storage()
            .persistent()
            .get(&DataKey::Contract(order.contract_id))
            .ok_or(ContractError::ContractNotFound)?;

        let current_time = env.ledger().timestamp();
        let contract_expired = current_time > contract.deadline;
        let contract_cancelled = contract.status == ContractStatus::Cancelled;

        if !contract_expired && !contract_cancelled {
            return Err(ContractError::InvalidRefundState);
        }

        let old_status = order.status;
        order.status = OrderStatus::Refunded;
        order.refunded_at = Some(current_time);

        env.storage()
            .persistent()
            .set(&DataKey::Order(order_id), &order);

        env.events().publish(
            (
                symbol_short!("order"),
                symbol_short!("refunded"),
                symbol_short!("v1"),
            ),
            OrderRefundedEvent {
                order_id,
                buyer: buyer.clone(),
                amount: order.amount,
                old_status,
                refunded_at: current_time,
            },
        );

        Ok(())
    }

    // ── Admin ──────────────────────────────────────────────────────────────────

    /// Get the contract admin.
    pub fn get_admin(env: Env) -> Result<Address, ContractError> {
        env.storage()
            .instance()
            .get(&ADMIN_KEY)
            .ok_or(ContractError::NotInitialized)
    }

    // ── Internal helpers ───────────────────────────────────────────────────────

    fn next_contract_id(env: &Env) -> u64 {
        let current: u64 = env
            .storage()
            .instance()
            .get(&NEXT_CONTRACT_ID_KEY)
            .unwrap_or(0);
        let next = current + 1;
        env.storage().instance().set(&NEXT_CONTRACT_ID_KEY, &next);
        next
    }

    fn next_order_id(env: &Env) -> u64 {
        let current: u64 = env
            .storage()
            .instance()
            .get(&NEXT_ORDER_ID_KEY)
            .unwrap_or(0);
        let next = current + 1;
        env.storage().instance().set(&NEXT_ORDER_ID_KEY, &next);
        next
    }
}

fn is_valid_contract_transition(current: ContractStatus, new: ContractStatus) -> bool {
    match (current, new) {
        (ContractStatus::Active, ContractStatus::Completed) => true,
        (ContractStatus::Active, ContractStatus::Cancelled) => true,
        (ContractStatus::Completed, ContractStatus::Cancelled) => false,
        (ContractStatus::Cancelled, ContractStatus::Active) => true,
        (ContractStatus::Cancelled, ContractStatus::Completed) => true,
        (a, b) if a == b => true,
        _ => false,
    }
}
