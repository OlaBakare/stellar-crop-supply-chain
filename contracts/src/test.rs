#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as AddressTestTrait, Ledger},
    Address, Env, String, Symbol,
};
use crate::{
    ContractStatus, ContractError, CropSupplyContract, CropSupplyContractClient, OrderStatus,
};

struct Harness<'a> {
    admin: Address,
    client: CropSupplyContractClient<'a>,
}

fn setup(env: &Env) -> Harness<'_> {
    env.ledger().with_mut(|l| {
        l.timestamp = 1_700_000_000;
    });
    let admin = Address::generate(env);
    env.mock_all_auths();
    let contract_id = env.register_contract(None, CropSupplyContract);
    let client = CropSupplyContractClient::new(env, &contract_id);
    client.initialize(&admin);
    Harness { admin, client }
}

fn create_test_contract(env: &Env, h: &Harness, target: i128) -> u64 {
    h.client.create_contract(
        &h.admin,
        &String::from_str(env, "Test Contract"),
        &String::from_str(env, "Test"),
        &target,
        &(env.ledger().timestamp() + 86400),
    )
}

fn place_test_order(env: &Env, h: &Harness, buyer: &Address, contract_id: u64, amount: i128) -> u64 {
    h.client.place_order(buyer, &contract_id, &amount)
}

#[test]
fn test_initialize() {
    let env = Env::default();
    let h = setup(&env);

    // Contract should be initialized with admin
    assert_eq!(h.client.get_admin(), h.admin);

    // Double initialization should fail
    let result = h.client.try_initialize(&h.admin);
    assert!(result.is_err());
}

#[test]
fn test_version() {
    let env = Env::default();
    let h = setup(&env);
    assert_eq!(h.client.version(), 1);
}

#[test]
fn test_get_metadata() {
    let env = Env::default();
    let h = setup(&env);
    let metadata = h.client.get_metadata();
    assert_eq!(
        metadata.get(Symbol::new(&env, "name")),
        Some(String::from_str(&env, "StellarCropSupply"))
    );
}

#[test]
fn test_create_contract() {
    let env = Env::default();
    let h = setup(&env);

    let title = String::from_str(&env, "Organic Wheat Contract");
    let description = String::from_str(&env, "Purchase agreement for 500 kg of organic wheat.");
    let target = 1_000_000_000; // 100 XLM
    let deadline = env.ledger().timestamp() + 86400; // 1 day from now

    let contract_id = h
        .client
        .create_contract(&h.admin, &title, &description, &target, &deadline);
    assert_eq!(contract_id, 1);

    let contract = h.client.get_contract(&contract_id);
    assert_eq!(contract.id, contract_id);
    assert_eq!(contract.farmer, h.admin);
    assert_eq!(contract.title, title);
    assert_eq!(contract.description, description);
    assert_eq!(contract.target_amount, target);
    assert_eq!(contract.funded_amount, 0);
    assert_eq!(contract.deadline, deadline);
    assert_eq!(contract.status, ContractStatus::Active);
    assert_eq!(contract.order_count, 0);
}

#[test]
#[should_panic(expected = "Error(Contract, #7)")]
fn test_create_contract_invalid_amount() {
    let env = Env::default();
    let h = setup(&env);
    let title = String::from_str(&env, "Test");
    let description = String::from_str(&env, "Test");
    let deadline = env.ledger().timestamp() + 86400;
    h.client
        .create_contract(&h.admin, &title, &description, &0, &deadline);
}

#[test]
#[should_panic(expected = "Error(Contract, #8)")]
fn test_create_contract_invalid_deadline() {
    let env = Env::default();
    let h = setup(&env);
    let title = String::from_str(&env, "Test");
    let description = String::from_str(&env, "Test");
    let past_deadline = env.ledger().timestamp() - 1;
    h.client
        .create_contract(&h.admin, &title, &description, &1_000_000, &past_deadline);
}

#[test]
#[should_panic(expected = "Error(Contract, #9)")]
fn test_create_contract_title_too_long() {
    let env = Env::default();
    let h = setup(&env);
    let long_title = String::from_str(&env, &"x".repeat(201));
    let description = String::from_str(&env, "Test");
    let deadline = env.ledger().timestamp() + 86400;
    h.client
        .create_contract(&h.admin, &long_title, &description, &1_000_000, &deadline);
}

#[test]
#[should_panic(expected = "Error(Contract, #10)")]
fn test_create_contract_description_too_long() {
    let env = Env::default();
    let h = setup(&env);
    let title = String::from_str(&env, "Test");
    let long_desc = String::from_str(&env, &"x".repeat(1001));
    let deadline = env.ledger().timestamp() + 86400;
    h.client
        .create_contract(&h.admin, &title, &long_desc, &1_000_000, &deadline);
}

#[test]
fn test_get_farmer_contracts() {
    let env = Env::default();
    let h = setup(&env);

    let title = String::from_str(&env, "Crop Contract 1");
    let desc = String::from_str(&env, "Description");
    let deadline = env.ledger().timestamp() + 86400;

    let id1 = h
        .client
        .create_contract(&h.admin, &title, &desc, &1_000_000, &deadline);
    let id2 = h
        .client
        .create_contract(&h.admin, &title, &desc, &2_000_000, &deadline);

    let contracts = h.client.get_farmer_contracts(&h.admin);
    assert_eq!(contracts.len(), 2);
    assert!(contracts.contains(id1));
    assert!(contracts.contains(id2));
}

#[test]
fn test_update_contract_status() {
    let env = Env::default();
    let h = setup(&env);
    let contract_id = create_test_contract(&env, &h, 1_000_000);

    // Active -> Completed
    h.client
        .update_contract_status(&h.admin, &contract_id, &ContractStatus::Completed);

    let contract = h.client.get_contract(&contract_id);
    assert_eq!(contract.status, ContractStatus::Completed);
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")]
fn test_update_contract_status_unauthorized() {
    let env = Env::default();
    let h = setup(&env);
    let unauthorized = Address::generate(&env);
    let contract_id = create_test_contract(&env, &h, 1_000_000);
    h.client
        .update_contract_status(&unauthorized, &contract_id, &ContractStatus::Completed);
}

#[test]
#[should_panic(expected = "Error(Contract, #11)")]
fn test_update_contract_status_invalid_transition() {
    let env = Env::default();
    let h = setup(&env);
    let contract_id = create_test_contract(&env, &h, 1_000_000);

    // Active -> Completed
    h.client
        .update_contract_status(&h.admin, &contract_id, &ContractStatus::Completed);

    // Completed -> Cancelled should fail
    h.client
        .update_contract_status(&h.admin, &contract_id, &ContractStatus::Cancelled);
}

#[test]
fn test_place_order() {
    let env = Env::default();
    let h = setup(&env);

    let title = String::from_str(&env, "Fresh Maize");
    let desc = String::from_str(&env, "From Green Valley Farm");
    let deadline = env.ledger().timestamp() + 86400;

    let contract_id = h
        .client
        .create_contract(&h.admin, &title, &desc, &10_000_000, &deadline);

    let buyer = Address::generate(&env);
    let order_id = place_test_order(&env, &h, &buyer, contract_id, 5_000_000);
    assert_eq!(order_id, 1);

    let order = h.client.get_order(&order_id);
    assert_eq!(order.id, order_id);
    assert_eq!(order.contract_id, contract_id);
    assert_eq!(order.buyer, buyer);
    assert_eq!(order.amount, 5_000_000);
    assert_eq!(order.status, OrderStatus::Pending);
    assert!(order.delivered_at.is_none());
    assert!(order.refunded_at.is_none());

    // Check contract funded amount updated
    let contract = h.client.get_contract(&contract_id);
    assert_eq!(contract.funded_amount, 5_000_000);
    assert_eq!(contract.order_count, 1);
}

#[test]
#[should_panic(expected = "Error(Contract, #7)")]
fn test_place_order_invalid_amount() {
    let env = Env::default();
    let h = setup(&env);
    let contract_id = create_test_contract(&env, &h, 10_000_000);
    let buyer = Address::generate(&env);
    place_test_order(&env, &h, &buyer, contract_id, 0);
}

#[test]
#[should_panic(expected = "Error(Contract, #3)")]
fn test_place_order_on_nonexistent_contract() {
    let env = Env::default();
    let h = setup(&env);
    let buyer = Address::generate(&env);
    place_test_order(&env, &h, &buyer, 999, 1_000_000);
}

#[test]
#[should_panic(expected = "Error(Contract, #5)")]
fn test_place_order_on_inactive_contract() {
    let env = Env::default();
    let h = setup(&env);
    let contract_id = create_test_contract(&env, &h, 10_000_000);

    // Complete the contract
    h.client
        .update_contract_status(&h.admin, &contract_id, &ContractStatus::Completed);

    let buyer = Address::generate(&env);
    place_test_order(&env, &h, &buyer, contract_id, 1_000_000);
}

#[test]
#[should_panic(expected = "Error(Contract, #6)")]
fn test_place_order_on_expired_contract() {
    let env = Env::default();
    let h = setup(&env);

    let deadline = env.ledger().timestamp() + 10; // expires soon
    let contract_id = h.client.create_contract(
        &h.admin,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "Test"),
        &10_000_000,
        &deadline,
    );

    // Advance time past deadline
    env.ledger().with_mut(|l| {
        l.timestamp += 20;
    });

    let buyer = Address::generate(&env);
    place_test_order(&env, &h, &buyer, contract_id, 1_000_000);
}

#[test]
fn test_get_contract_orders() {
    let env = Env::default();
    let h = setup(&env);
    let contract_id = create_test_contract(&env, &h, 10_000_000);

    let buyer1 = Address::generate(&env);
    let buyer2 = Address::generate(&env);

    let order_id1 = place_test_order(&env, &h, &buyer1, contract_id, 1_000_000);
    let order_id2 = place_test_order(&env, &h, &buyer2, contract_id, 2_000_000);

    let orders = h.client.get_contract_orders(&contract_id);
    assert_eq!(orders.len(), 2);
    assert!(orders.contains(order_id1));
    assert!(orders.contains(order_id2));
}

#[test]
fn test_get_buyer_orders() {
    let env = Env::default();
    let h = setup(&env);
    let contract_id = create_test_contract(&env, &h, 10_000_000);

    let buyer = Address::generate(&env);
    let order_id1 = place_test_order(&env, &h, &buyer, contract_id, 1_000_000);

    // Create a second contract for the same buyer
    let contract_id2 = create_test_contract(&env, &h, 10_000_000);
    let order_id2 = place_test_order(&env, &h, &buyer, contract_id2, 2_000_000);

    let orders = h.client.get_buyer_orders(&buyer);
    assert_eq!(orders.len(), 2);
    assert!(orders.contains(order_id1));
    assert!(orders.contains(order_id2));
}

#[test]
fn test_mark_shipped() {
    let env = Env::default();
    let h = setup(&env);
    let contract_id = create_test_contract(&env, &h, 10_000_000);

    let buyer = Address::generate(&env);
    let order_id = place_test_order(&env, &h, &buyer, contract_id, 5_000_000);

    // Farmer marks as shipped
    h.client.mark_shipped(&h.admin, &order_id);

    let order = h.client.get_order(&order_id);
    assert_eq!(order.status, OrderStatus::Shipped);
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")]
fn test_mark_shipped_unauthorized() {
    let env = Env::default();
    let h = setup(&env);
    let unauthorized = Address::generate(&env);
    let contract_id = create_test_contract(&env, &h, 10_000_000);

    let buyer = Address::generate(&env);
    let order_id = place_test_order(&env, &h, &buyer, contract_id, 5_000_000);
    h.client.mark_shipped(&unauthorized, &order_id);
}

#[test]
#[should_panic(expected = "Error(Contract, #11)")]
fn test_mark_shipped_invalid_transition() {
    let env = Env::default();
    let h = setup(&env);
    let contract_id = create_test_contract(&env, &h, 10_000_000);

    let buyer = Address::generate(&env);
    let order_id = place_test_order(&env, &h, &buyer, contract_id, 5_000_000);

    // Mark as shipped
    h.client.mark_shipped(&h.admin, &order_id);

    // Try to mark as shipped again (should fail)
    h.client.mark_shipped(&h.admin, &order_id);
}

#[test]
fn test_mark_delivered() {
    let env = Env::default();
    let h = setup(&env);
    let contract_id = create_test_contract(&env, &h, 10_000_000);

    let buyer = Address::generate(&env);
    let order_id = place_test_order(&env, &h, &buyer, contract_id, 5_000_000);

    h.client.mark_shipped(&h.admin, &order_id);
    h.client.mark_delivered(&h.admin, &order_id);

    let order = h.client.get_order(&order_id);
    assert_eq!(order.status, OrderStatus::Delivered);
    assert!(order.delivered_at.is_some());
}

#[test]
#[should_panic(expected = "Error(Contract, #11)")]
fn test_mark_delivered_invalid_transition() {
    let env = Env::default();
    let h = setup(&env);
    let contract_id = create_test_contract(&env, &h, 10_000_000);

    let buyer = Address::generate(&env);
    let order_id = place_test_order(&env, &h, &buyer, contract_id, 5_000_000);

    // Try to mark as delivered without first marking as shipped
    h.client.mark_delivered(&h.admin, &order_id);
}

#[test]
fn test_request_refund_pending_order() {
    let env = Env::default();
    let h = setup(&env);

    let deadline = env.ledger().timestamp() + 10;
    let contract_id = h.client.create_contract(
        &h.admin,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "Test"),
        &10_000_000,
        &deadline,
    );

    let buyer = Address::generate(&env);
    let order_id = place_test_order(&env, &h, &buyer, contract_id, 5_000_000);

    // Advance past deadline
    env.ledger().with_mut(|l| {
        l.timestamp += 20;
    });

    h.client.request_refund(&buyer, &order_id);

    let order = h.client.get_order(&order_id);
    assert_eq!(order.status, OrderStatus::Refunded);
    assert!(order.refunded_at.is_some());
}

#[test]
fn test_request_refund_shipped_order() {
    let env = Env::default();
    let h = setup(&env);

    let deadline = env.ledger().timestamp() + 10;
    let contract_id = h.client.create_contract(
        &h.admin,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "Test"),
        &10_000_000,
        &deadline,
    );

    let buyer = Address::generate(&env);
    let order_id = place_test_order(&env, &h, &buyer, contract_id, 5_000_000);

    // Farmer marks as shipped
    h.client.mark_shipped(&h.admin, &order_id);

    // Advance past deadline
    env.ledger().with_mut(|l| {
        l.timestamp += 20;
    });

    h.client.request_refund(&buyer, &order_id);

    let order = h.client.get_order(&order_id);
    assert_eq!(order.status, OrderStatus::Refunded);
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")]
fn test_request_refund_unauthorized() {
    let env = Env::default();
    let h = setup(&env);

    let deadline = env.ledger().timestamp() + 10;
    let contract_id = h.client.create_contract(
        &h.admin,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "Test"),
        &10_000_000,
        &deadline,
    );

    let buyer = Address::generate(&env);
    let order_id = place_test_order(&env, &h, &buyer, contract_id, 5_000_000);

    let unauthorized = Address::generate(&env);

    // Advance past deadline
    env.ledger().with_mut(|l| {
        l.timestamp += 20;
    });

    h.client.request_refund(&unauthorized, &order_id);
}

#[test]
#[should_panic(expected = "Error(Contract, #12)")]
fn test_request_refund_invalid_state() {
    let env = Env::default();
    let h = setup(&env);
    let contract_id = create_test_contract(&env, &h, 10_000_000);

    let buyer = Address::generate(&env);
    let order_id = place_test_order(&env, &h, &buyer, contract_id, 5_000_000);

    // Cannot refund while contract is still active and deadline hasn't passed
    h.client.request_refund(&buyer, &order_id);
}

#[test]
#[should_panic(expected = "Error(Contract, #12)")]
fn test_request_refund_delivered_order() {
    let env = Env::default();
    let h = setup(&env);
    let contract_id = create_test_contract(&env, &h, 10_000_000);

    let buyer = Address::generate(&env);
    let order_id = place_test_order(&env, &h, &buyer, contract_id, 5_000_000);

    // Full lifecycle: pending -> shipped -> delivered
    h.client.mark_shipped(&h.admin, &order_id);
    h.client.mark_delivered(&h.admin, &order_id);

    // Advance past deadline
    env.ledger().with_mut(|l| {
        l.timestamp += 86400;
    });

    // Cannot refund a delivered order
    h.client.request_refund(&buyer, &order_id);
}

#[test]
#[should_panic(expected = "Error(Contract, #3)")]
fn test_get_nonexistent_contract() {
    let env = Env::default();
    let h = setup(&env);
    h.client.get_contract(&999);
}

#[test]
#[should_panic(expected = "Error(Contract, #4)")]
fn test_get_nonexistent_order() {
    let env = Env::default();
    let h = setup(&env);
    h.client.get_order(&999);
}

#[test]
#[should_panic(expected = "Error(Contract, #13)")]
fn test_get_not_initialized() {
    let env = Env::default();
    let contract_id = env.register_contract(None, CropSupplyContract);
    let client = CropSupplyContractClient::new(&env, &contract_id);
    client.get_admin();
}

#[test]
fn test_contract_cancel_lifecycle() {
    let env = Env::default();
    let h = setup(&env);
    let contract_id = create_test_contract(&env, &h, 10_000_000);

    // Active -> Cancelled
    h.client
        .update_contract_status(&h.admin, &contract_id, &ContractStatus::Cancelled);
    let contract = h.client.get_contract(&contract_id);
    assert_eq!(contract.status, ContractStatus::Cancelled);

    // Cancelled -> Active (reactivate)
    h.client
        .update_contract_status(&h.admin, &contract_id, &ContractStatus::Active);
    let contract = h.client.get_contract(&contract_id);
    assert_eq!(contract.status, ContractStatus::Active);

    // Active -> Completed
    h.client
        .update_contract_status(&h.admin, &contract_id, &ContractStatus::Completed);
    let contract = h.client.get_contract(&contract_id);
    assert_eq!(contract.status, ContractStatus::Completed);
}

#[test]
fn test_place_order_on_cancelled_contract_then_reactivate() {
    let env = Env::default();
    let h = setup(&env);
    let contract_id = create_test_contract(&env, &h, 10_000_000);

    // Cancel the contract
    h.client
        .update_contract_status(&h.admin, &contract_id, &ContractStatus::Cancelled);

    // Order should fail
    let buyer = Address::generate(&env);
    let result = h.client.try_place_order(&buyer, &contract_id, &1_000_000);
    assert!(result.is_err());

    // Reactivate the contract
    h.client
        .update_contract_status(&h.admin, &contract_id, &ContractStatus::Active);

    // Order should succeed now
    let order_id = h.client.place_order(&buyer, &contract_id, &1_000_000);
    assert_eq!(order_id, 1);
}
