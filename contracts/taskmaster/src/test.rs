#![cfg(test)]
extern crate std;

use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, Env, String as SorobanString, Vec,
};

// Import from the contract module
use crate::contract::{TaskMaster, TaskMasterClient, TaskStatus};

// Mock token contract for testing
fn create_token_contract<'a>(e: &Env, admin: &Address) -> (token::Client<'a>, token::StellarAssetClient<'a>) {
    let contract_address = e.register_stellar_asset_contract_v2(admin.clone());
    let token_client = token::Client::new(e, &contract_address.address());
    let token_admin_client = token::StellarAssetClient::new(e, &contract_address.address());
    (token_client, token_admin_client)
}

fn create_taskmaster_client<'a>(e: &Env) -> (TaskMasterClient<'a>, token::Client<'a>, token::StellarAssetClient<'a>, Address) {
    let admin = Address::generate(e);
    let (token_client, token_admin_client) = create_token_contract(e, &admin);
    let contract_id = e.register(TaskMaster, ());
    let client = TaskMasterClient::new(e, &contract_id);

    client.initialize(&token_client.address, &admin);

    (client, token_client, token_admin_client, admin)
}

fn mint_tokens(token_admin_client: &token::StellarAssetClient, to: &Address, amount: i128) {
    token_admin_client.mint(to, &amount);
}

#[test]
fn test_initialize() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let (token_client, _) = create_token_contract(&e, &admin);
    let contract_id = e.register(TaskMaster, ());
    let client = TaskMasterClient::new(&e, &contract_id);

    // Should initialize successfully
    client.initialize(&token_client.address, &admin);

    // Verify task counter is set to 1
    assert_eq!(client.get_task_count(), 0);
    
    // Verify platform fees is initialized to 0
    assert_eq!(client.get_platform_fees(), 0);
}

#[test]
#[should_panic(expected = "Contract already initialized")]
fn test_initialize_twice_fails() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let (token_client, _) = create_token_contract(&e, &admin);
    let contract_id = e.register(TaskMaster, ());
    let client = TaskMasterClient::new(&e, &contract_id);

    client.initialize(&token_client.address, &admin);
    // Should panic on second initialization
    client.initialize(&token_client.address, &admin);
}

#[test]
fn test_create_task() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, token_client, token_admin_client, _admin) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);

    // Mint tokens to creator
    mint_tokens(&token_admin_client, &creator, 10_000_000);

    let title = SorobanString::from_str(&e, "Test Task");
    let description = SorobanString::from_str(&e, "Test Description");
    let funding_amount = 1_000_000i128;
    let deadline = e.ledger().timestamp() + 86400;

    let task_id = client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &funding_amount,
        &deadline,
        &assignee,
    );

    assert_eq!(task_id, 1);

    // Verify task details
    let task = client.get_task(&task_id);
    assert_eq!(task.id, 1);
    assert_eq!(task.title, title);
    assert_eq!(task.description, description);
    assert_eq!(task.funding_amount, funding_amount);
    assert_eq!(task.deadline, deadline);
    assert_eq!(task.status, TaskStatus::Assigned);
    assert!(!task.creator_approved);
    assert!(!task.assignee_approved);
    assert_eq!(task.assignee, Some(assignee.clone()));

    // Verify task count
    assert_eq!(client.get_task_count(), 1);

    // Verify token transfer - contract should hold the funds
    assert_eq!(
        token_client.balance(&client.address),
        funding_amount
    );
}

#[test]
fn test_create_task_with_github_link() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, _token_client, token_admin_client, _) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);

    mint_tokens(&token_admin_client, &creator, 10_000_000);

    let title = SorobanString::from_str(&e, "GitHub Task");
    let description = SorobanString::from_str(&e, "Task with GitHub link");
    let github_link = Some(SorobanString::from_str(&e, "https://github.com/example/repo"));
    let funding_amount = 2_000_000i128;
    let deadline = e.ledger().timestamp() + 86400;

    let task_id = client.create_task(
        &creator,
        &title,
        &description,
        &github_link,
        &funding_amount,
        &deadline,
        &assignee,
    );

    let task = client.get_task(&task_id);
    assert_eq!(task.github_link, github_link);
}

#[test]
#[should_panic(expected = "Title cannot be empty")]
fn test_create_task_empty_title_fails() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, _token_client, token_admin_client, _) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);

    mint_tokens(&token_admin_client, &creator, 10_000_000);

    let title = SorobanString::from_str(&e, "");
    let description = SorobanString::from_str(&e, "Test Description");

    client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &1_000_000i128,
        &(e.ledger().timestamp() + 86400),
        &assignee,
    );
}

#[test]
#[should_panic(expected = "Description cannot be empty")]
fn test_create_task_empty_description_fails() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, _token_client, token_admin_client, _) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);

    mint_tokens(&token_admin_client, &creator, 10_000_000);

    let title = SorobanString::from_str(&e, "Test Task");
    let description = SorobanString::from_str(&e, "");

    client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &1_000_000i128,
        &(e.ledger().timestamp() + 86400),
        &assignee,
    );
}

#[test]
#[should_panic(expected = "Funding amount must be positive")]
fn test_create_task_zero_funding_fails() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, _token_client, token_admin_client, _) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);

    mint_tokens(&token_admin_client, &creator, 10_000_000);

    let title = SorobanString::from_str(&e, "Test Task");
    let description = SorobanString::from_str(&e, "Test Description");

    client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &0i128,
        &(e.ledger().timestamp() + 86400),
        &assignee,
    );
}

#[test]
#[should_panic(expected = "Deadline must be in the future")]
fn test_create_task_past_deadline_fails() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, _token_client, token_admin_client, _) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);

    mint_tokens(&token_admin_client, &creator, 10_000_000);

    let title = SorobanString::from_str(&e, "Test Task");
    let description = SorobanString::from_str(&e, "Test Description");

    client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &1_000_000i128,
        &(e.ledger().timestamp().saturating_sub(86400)), // Past deadline by 1 day
        &assignee,
    );
}

#[test]
fn test_start_task() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, _token_client, token_admin_client, _) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);

    mint_tokens(&token_admin_client, &creator, 10_000_000);

    let title = SorobanString::from_str(&e, "Test Task");
    let description = SorobanString::from_str(&e, "Test Description");

    let task_id = client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &1_000_000i128,
        &(e.ledger().timestamp() + 86400),
        &assignee,
    );

    // Start the task
    client.start_task(&assignee, &task_id);

    let task = client.get_task(&task_id);
    assert_eq!(task.status, TaskStatus::InProgress);
}

#[test]
fn test_complete_task() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, _token_client, token_admin_client, _) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);

    mint_tokens(&token_admin_client, &creator, 10_000_000);

    let title = SorobanString::from_str(&e, "Test Task");
    let description = SorobanString::from_str(&e, "Test Description");

    let task_id = client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &1_000_000i128,
        &(e.ledger().timestamp() + 86400),
        &assignee,
    );

    // Start and complete the task
    client.start_task(&assignee, &task_id);
    client.complete_task(&assignee, &task_id);

    let task = client.get_task(&task_id);
    assert_eq!(task.status, TaskStatus::Completed);
    assert!(task.assignee_approved);
    assert!(task.completed_at.is_some());
}

#[test]
#[should_panic(expected = "Task is not in valid state for this operation")]
fn test_complete_task_invalid_state_fails() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, _token_client, token_admin_client, _) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);

    mint_tokens(&token_admin_client, &creator, 10_000_000);

    let title = SorobanString::from_str(&e, "Test Task");
    let description = SorobanString::from_str(&e, "Test Description");

    let task_id = client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &1_000_000i128,
        &(e.ledger().timestamp() + 86400),
        &assignee,
    );

    // Complete task twice should fail
    client.complete_task(&assignee, &task_id);
    client.complete_task(&assignee, &task_id);
}

#[test]
fn test_release_funds() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, token_client, token_admin_client, _admin) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);

    mint_tokens(&token_admin_client, &creator, 10_000_000);

    let title = SorobanString::from_str(&e, "Test Task");
    let description = SorobanString::from_str(&e, "Test Description");
    let funding_amount = 1_000_000i128;

    let task_id = client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &funding_amount,
        &(e.ledger().timestamp() + 86400),
        &assignee,
    );

    // Complete the task
    client.complete_task(&assignee, &task_id);

    // Release funds
    client.release_funds(&creator, &task_id);

    let task = client.get_task(&task_id);
    assert_eq!(task.status, TaskStatus::FundsReleased);
    assert!(task.creator_approved);

    // Calculate expected amounts (3% platform fee)
    let platform_fee = funding_amount * 3i128 / 100i128;
    let assignee_amount = funding_amount - platform_fee;

    // Verify assignee received the funds minus platform fee
    assert_eq!(token_client.balance(&assignee), assignee_amount);
    
    // Verify platform fees were accumulated
    assert_eq!(client.get_platform_fees(), platform_fee);
}

#[test]
#[should_panic(expected = "Task is not in valid state for this operation")]
fn test_release_funds_without_completion_fails() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, _token_client, token_admin_client, _) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);

    mint_tokens(&token_admin_client, &creator, 10_000_000);

    let title = SorobanString::from_str(&e, "Test Task");
    let description = SorobanString::from_str(&e, "Test Description");

    let task_id = client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &1_000_000i128,
        &(e.ledger().timestamp() + 86400),
        &assignee,
    );

    // Try to release funds without completion
    client.release_funds(&creator, &task_id);
}

#[test]
fn test_cancel_task() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, token_client, token_admin_client, _) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);

    mint_tokens(&token_admin_client, &creator, 10_000_000);

    let title = SorobanString::from_str(&e, "Test Task");
    let description = SorobanString::from_str(&e, "Test Description");
    let funding_amount = 1_000_000i128;

    let task_id = client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &funding_amount,
        &(e.ledger().timestamp() + 86400),
        &assignee,
    );

    // Cancel the task
    client.cancel_task(&creator, &task_id);

    let task = client.get_task(&task_id);
    assert_eq!(task.status, TaskStatus::Cancelled);

    // Verify creator received refund
    assert_eq!(token_client.balance(&creator), 10_000_000); // Original balance
}

#[test]
#[should_panic(expected = "Task is not in valid state for this operation")]
fn test_cancel_completed_task_fails() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, _token_client, token_admin_client, _) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);

    mint_tokens(&token_admin_client, &creator, 10_000_000);

    let title = SorobanString::from_str(&e, "Test Task");
    let description = SorobanString::from_str(&e, "Test Description");

    let task_id = client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &1_000_000i128,
        &(e.ledger().timestamp() + 86400),
        &assignee,
    );

    // Complete the task
    client.complete_task(&assignee, &task_id);

    // Try to cancel completed task
    client.cancel_task(&creator, &task_id);
}

#[test]
fn test_mark_expired() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, _token_client, token_admin_client, _) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);

    mint_tokens(&token_admin_client, &creator, 10_000_000);

    let title = SorobanString::from_str(&e, "Test Task");
    let description = SorobanString::from_str(&e, "Test Description");
    let deadline = e.ledger().timestamp() + 100;

    let task_id = client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &1_000_000i128,
        &deadline,
        &assignee,
    );

    // Advance time past deadline
    e.ledger().with_mut(|li| {
        li.timestamp = deadline + 1;
    });

    // Mark as expired
    client.mark_expired(&task_id);

    let task = client.get_task(&task_id);
    assert_eq!(task.status, TaskStatus::Expired);
}

#[test]
#[should_panic(expected = "Task is not expired")]
fn test_mark_expired_before_deadline_fails() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, _token_client, token_admin_client, _) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);

    mint_tokens(&token_admin_client, &creator, 10_000_000);

    let title = SorobanString::from_str(&e, "Test Task");
    let description = SorobanString::from_str(&e, "Test Description");

    let task_id = client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &1_000_000i128,
        &(e.ledger().timestamp() + 86400),
        &assignee,
    );

    // Try to mark as expired before deadline
    client.mark_expired(&task_id);
}

#[test]
fn test_reclaim_expired_funds() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, token_client, token_admin_client, _) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);

    mint_tokens(&token_admin_client, &creator, 10_000_000);

    let title = SorobanString::from_str(&e, "Test Task");
    let description = SorobanString::from_str(&e, "Test Description");
    let funding_amount = 1_000_000i128;
    let deadline = e.ledger().timestamp() + 100;

    let task_id = client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &funding_amount,
        &deadline,
        &assignee,
    );

    // Advance time past deadline
    e.ledger().with_mut(|li| {
        li.timestamp = deadline + 1;
    });

    // Mark as expired
    client.mark_expired(&task_id);

    // Reclaim funds
    client.reclaim_expired_funds(&creator, &task_id);

    let task = client.get_task(&task_id);
    assert_eq!(task.status, TaskStatus::Cancelled);

    // Verify creator received refund
    assert_eq!(token_client.balance(&creator), 10_000_000);
}

#[test]
fn test_reassign_task() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, _token_client, token_admin_client, _) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);
    let new_assignee = Address::generate(&e);

    mint_tokens(&token_admin_client, &creator, 10_000_000);

    let title = SorobanString::from_str(&e, "Test Task");
    let description = SorobanString::from_str(&e, "Test Description");
    let deadline = e.ledger().timestamp() + 100;

    let task_id = client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &1_000_000i128,
        &deadline,
        &assignee,
    );

    // Advance time past deadline
    e.ledger().with_mut(|li| {
        li.timestamp = deadline + 1;
    });

    // Mark as expired
    client.mark_expired(&task_id);

    // Reassign to new assignee
    client.reassign_task(&creator, &task_id, &new_assignee);

    let task = client.get_task(&task_id);
    assert_eq!(task.status, TaskStatus::Assigned);
    assert_eq!(task.assignee, Some(new_assignee.clone()));
    assert!(!task.assignee_approved);
    assert!(!task.creator_approved);
    assert_eq!(task.completed_at, None);

    // Verify new assignee has the task
    let new_assignee_tasks = client.get_assigned_tasks(&new_assignee);
    assert!(new_assignee_tasks.contains(&task_id));
}

#[test]
#[should_panic(expected = "Task must be expired to reassign")]
fn test_reassign_non_expired_task_fails() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, _token_client, token_admin_client, _) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);
    let new_assignee = Address::generate(&e);

    mint_tokens(&token_admin_client, &creator, 10_000_000);

    let title = SorobanString::from_str(&e, "Test Task");
    let description = SorobanString::from_str(&e, "Test Description");

    let task_id = client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &1_000_000i128,
        &(e.ledger().timestamp() + 86400),
        &assignee,
    );

    // Try to reassign non-expired task
    client.reassign_task(&creator, &task_id, &new_assignee);
}

#[test]
fn test_get_user_tasks() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, _token_client, token_admin_client, _) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee1 = Address::generate(&e);
    let assignee2 = Address::generate(&e);

    mint_tokens(&token_admin_client, &creator, 10_000_000);

    let title1 = SorobanString::from_str(&e, "Task 1");
    let title2 = SorobanString::from_str(&e, "Task 2");
    let description = SorobanString::from_str(&e, "Test Description");

    let task_id1 = client.create_task(
        &creator,
        &title1,
        &description,
        &None,
        &1_000_000i128,
        &(e.ledger().timestamp() + 86400),
        &assignee1,
    );

    let task_id2 = client.create_task(
        &creator,
        &title2,
        &description,
        &None,
        &2_000_000i128,
        &(e.ledger().timestamp() + 86400),
        &assignee2,
    );

    let user_tasks = client.get_user_tasks(&creator);
    assert_eq!(user_tasks.len(), 2);
    assert!(user_tasks.contains(&task_id1));
    assert!(user_tasks.contains(&task_id2));
}

#[test]
fn test_get_assigned_tasks() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, _token_client, token_admin_client, _) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);

    mint_tokens(&token_admin_client, &creator, 10_000_000);

    let title1 = SorobanString::from_str(&e, "Task 1");
    let title2 = SorobanString::from_str(&e, "Task 2");
    let description = SorobanString::from_str(&e, "Test Description");

    let task_id1 = client.create_task(
        &creator,
        &title1,
        &description,
        &None,
        &1_000_000i128,
        &(e.ledger().timestamp() + 86400),
        &assignee,
    );

    let task_id2 = client.create_task(
        &creator,
        &title2,
        &description,
        &None,
        &2_000_000i128,
        &(e.ledger().timestamp() + 86400),
        &assignee,
    );

    let assigned_tasks = client.get_assigned_tasks(&assignee);
    assert_eq!(assigned_tasks.len(), 2);
    assert!(assigned_tasks.contains(&task_id1));
    assert!(assigned_tasks.contains(&task_id2));
}

#[test]
fn test_complete_task_lifecycle() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, token_client, token_admin_client, _) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);

    mint_tokens(&token_admin_client, &creator, 10_000_000);

    let title = SorobanString::from_str(&e, "Complete Lifecycle Task");
    let description = SorobanString::from_str(&e, "Test full lifecycle");
    let github_link = Some(SorobanString::from_str(&e, "https://github.com/test/repo"));
    let funding_amount = 5_000_000i128;

    // 1. Create task
    let task_id = client.create_task(
        &creator,
        &title,
        &description,
        &github_link,
        &funding_amount,
        &(e.ledger().timestamp() + 86400),
        &assignee,
    );

    let task = client.get_task(&task_id);
    assert_eq!(task.status, TaskStatus::Assigned);

    // 2. Start task
    client.start_task(&assignee, &task_id);
    let task = client.get_task(&task_id);
    assert_eq!(task.status, TaskStatus::InProgress);

    // 3. Complete task
    client.complete_task(&assignee, &task_id);
    let task = client.get_task(&task_id);
    assert_eq!(task.status, TaskStatus::Completed);
    assert!(task.assignee_approved);
    assert!(task.completed_at.is_some());

    // 4. Release funds
    client.release_funds(&creator, &task_id);
    let task = client.get_task(&task_id);
    assert_eq!(task.status, TaskStatus::FundsReleased);
    assert!(task.creator_approved);

    // Verify funds were transferred (minus platform fee)
    let platform_fee = funding_amount * 3i128 / 100i128;
    let expected_assignee_amount = funding_amount - platform_fee;
    assert_eq!(token_client.balance(&assignee), expected_assignee_amount);
}

#[test]
#[should_panic(expected = "Task has expired")]
fn test_complete_expired_task_fails() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, _token_client, token_admin_client, _) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);

    mint_tokens(&token_admin_client, &creator, 10_000_000);

    let title = SorobanString::from_str(&e, "Test Task");
    let description = SorobanString::from_str(&e, "Test Description");
    let deadline = e.ledger().timestamp() + 100;

    let task_id = client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &1_000_000i128,
        &deadline,
        &assignee,
    );

    // Advance time past deadline
    e.ledger().with_mut(|li| {
        li.timestamp = deadline + 1;
    });

    // Try to complete expired task
    client.complete_task(&assignee, &task_id);
}

#[test]
fn test_task_count() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, _token_client, token_admin_client, _) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);

    mint_tokens(&token_admin_client, &creator, 10_000_000);

    assert_eq!(client.get_task_count(), 0);

    let title = SorobanString::from_str(&e, "Task");
    let description = SorobanString::from_str(&e, "Description");

    // Create 3 tasks
    for _ in 0..3 {
        client.create_task(
            &creator,
            &title,
            &description,
            &None,
            &1_000_000i128,
            &(e.ledger().timestamp() + 86400),
            &assignee,
        );
    }

    assert_eq!(client.get_task_count(), 3);
}

#[test]
fn test_withdraw_platform_fees() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, token_client, token_admin_client, admin) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);

    mint_tokens(&token_admin_client, &creator, 10_000_000);

    let title = SorobanString::from_str(&e, "Test Task");
    let description = SorobanString::from_str(&e, "Test Description");
    let funding_amount = 1_000_000i128;

    let task_id = client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &funding_amount,
        &(e.ledger().timestamp() + 86400),
        &assignee,
    );

    // Complete and release funds to generate platform fees
    client.complete_task(&assignee, &task_id);
    client.release_funds(&creator, &task_id);

    // Calculate expected platform fee (3%)
    let expected_platform_fee = funding_amount * 3i128 / 100i128;
    assert_eq!(client.get_platform_fees(), expected_platform_fee);

    // Withdraw platform fees
    client.withdraw_platform_fees(&admin);

    // Verify platform fees were reset to 0
    assert_eq!(client.get_platform_fees(), 0);
    
    // Verify admin received the platform fees
    assert_eq!(token_client.balance(&admin), expected_platform_fee);
}

#[test]
#[should_panic(expected = "Only deployer can withdraw platform fees")]
fn test_withdraw_platform_fees_unauthorized_fails() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, _token_client, token_admin_client, _admin) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);
    let unauthorized_user = Address::generate(&e);

    mint_tokens(&token_admin_client, &creator, 10_000_000);

    let title = SorobanString::from_str(&e, "Test Task");
    let description = SorobanString::from_str(&e, "Test Description");

    let task_id = client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &1_000_000i128,
        &(e.ledger().timestamp() + 86400),
        &assignee,
    );

    // Complete and release funds to generate platform fees
    client.complete_task(&assignee, &task_id);
    client.release_funds(&creator, &task_id);

    // Try to withdraw platform fees with unauthorized user
    client.withdraw_platform_fees(&unauthorized_user);
}

#[test]
#[should_panic(expected = "No platform fees to withdraw")]
fn test_withdraw_zero_platform_fees_fails() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, _token_client, _token_admin_client, admin) = create_taskmaster_client(&e);

    // Try to withdraw platform fees when there are none
    client.withdraw_platform_fees(&admin);
}

#[test]
fn test_multiple_tasks_platform_fees() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, token_client, token_admin_client, admin) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);

    mint_tokens(&token_admin_client, &creator, 20_000_000);

    let title = SorobanString::from_str(&e, "Test Task");
    let description = SorobanString::from_str(&e, "Test Description");

    // Create and complete two tasks with different funding amounts
    let task_id1 = client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &1_000_000i128,
        &(e.ledger().timestamp() + 86400),
        &assignee,
    );

    let task_id2 = client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &2_000_000i128,
        &(e.ledger().timestamp() + 86400),
        &assignee,
    );

    // Complete both tasks
    client.complete_task(&assignee, &task_id1);
    client.complete_task(&assignee, &task_id2);

    // Release funds for both tasks
    client.release_funds(&creator, &task_id1);
    client.release_funds(&creator, &task_id2);

    // Calculate expected platform fees (3% of total funding)
    let expected_platform_fee = (1_000_000i128 + 2_000_000i128) * 3i128 / 100i128;
    assert_eq!(client.get_platform_fees(), expected_platform_fee);

    // Withdraw platform fees
    client.withdraw_platform_fees(&admin);

    // Verify platform fees were reset to 0
    assert_eq!(client.get_platform_fees(), 0);
    
    // Verify admin received the platform fees
    assert_eq!(token_client.balance(&admin), expected_platform_fee);
}

#[test]
fn test_platform_fee_small_amount() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, token_client, token_admin_client, admin) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);

    // Test with a very small amount (100 stroops)
    let funding_amount = 100i128;
    mint_tokens(&token_admin_client, &creator, 10_000_000);

    let title = SorobanString::from_str(&e, "Small Amount Task");
    let description = SorobanString::from_str(&e, "Test with small amount");

    let task_id = client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &funding_amount,
        &(e.ledger().timestamp() + 86400),
        &assignee,
    );

    // Complete and release funds
    client.complete_task(&assignee, &task_id);
    client.release_funds(&creator, &task_id);

    // Calculate expected platform fee (3% of 100 = 3)
    let expected_platform_fee = funding_amount * 3i128 / 100i128;
    assert_eq!(client.get_platform_fees(), expected_platform_fee);
    
    // Verify assignee received the correct amount (100 - 3 = 97)
    let expected_assignee_amount = funding_amount - expected_platform_fee;
    assert_eq!(token_client.balance(&assignee), expected_assignee_amount);
    
    // Withdraw platform fees
    client.withdraw_platform_fees(&admin);
    
    // Verify admin received the platform fees
    assert_eq!(token_client.balance(&admin), expected_platform_fee);
}

#[test]
fn test_platform_fee_large_amount() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, token_client, token_admin_client, admin) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);

    // Test with a very large amount
    let funding_amount = 10_000_000_000i128; // 10 billion stroops
    mint_tokens(&token_admin_client, &creator, funding_amount);

    let title = SorobanString::from_str(&e, "Large Amount Task");
    let description = SorobanString::from_str(&e, "Test with large amount");

    let task_id = client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &funding_amount,
        &(e.ledger().timestamp() + 86400),
        &assignee,
    );

    // Complete and release funds
    client.complete_task(&assignee, &task_id);
    client.release_funds(&creator, &task_id);

    // Calculate expected platform fee (3% of 10 billion = 300 million)
    let expected_platform_fee = funding_amount * 3i128 / 100i128;
    assert_eq!(client.get_platform_fees(), expected_platform_fee);
    
    // Verify assignee received the correct amount
    let expected_assignee_amount = funding_amount - expected_platform_fee;
    assert_eq!(token_client.balance(&assignee), expected_assignee_amount);
    
    // Withdraw platform fees
    client.withdraw_platform_fees(&admin);
    
    // Verify admin received the platform fees
    assert_eq!(token_client.balance(&admin), expected_platform_fee);
}

#[test]
fn test_multiple_platform_fee_withdrawals() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, token_client, token_admin_client, admin) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);

    mint_tokens(&token_admin_client, &creator, 10_000_000);

    let title = SorobanString::from_str(&e, "Task 1");
    let description = SorobanString::from_str(&e, "First task");
    let funding_amount1 = 1_000_000i128;

    let task_id1 = client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &funding_amount1,
        &(e.ledger().timestamp() + 86400),
        &assignee,
    );

    // Complete and release funds for first task
    client.complete_task(&assignee, &task_id1);
    client.release_funds(&creator, &task_id1);

    // Calculate expected platform fee for first task (3%)
    let expected_platform_fee1 = funding_amount1 * 3i128 / 100i128;
    assert_eq!(client.get_platform_fees(), expected_platform_fee1);

    // Withdraw first batch of platform fees
    client.withdraw_platform_fees(&admin);
    assert_eq!(client.get_platform_fees(), 0);
    assert_eq!(token_client.balance(&admin), expected_platform_fee1);

    // Create a second task
    let title2 = SorobanString::from_str(&e, "Task 2");
    let description2 = SorobanString::from_str(&e, "Second task");
    let funding_amount2 = 2_000_000i128;

    let task_id2 = client.create_task(
        &creator,
        &title2,
        &description2,
        &None,
        &funding_amount2,
        &(e.ledger().timestamp() + 86400),
        &assignee,
    );

    // Complete and release funds for second task
    client.complete_task(&assignee, &task_id2);
    client.release_funds(&creator, &task_id2);

    // Calculate expected platform fee for second task (3%)
    let expected_platform_fee2 = funding_amount2 * 3i128 / 100i128;
    assert_eq!(client.get_platform_fees(), expected_platform_fee2);

    // Withdraw second batch of platform fees
    client.withdraw_platform_fees(&admin);
    assert_eq!(client.get_platform_fees(), 0);
    
    // Verify admin received both batches of platform fees
    assert_eq!(
        token_client.balance(&admin),
        expected_platform_fee1 + expected_platform_fee2
    );
}

#[test]
fn test_platform_fee_accumulation_many_tasks() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, token_client, token_admin_client, admin) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);

    // Mint enough tokens for all tasks
    let total_funding = 10_000_000i128 * 10; // 10 tasks with 10M each
    mint_tokens(&token_admin_client, &creator, total_funding);

    let title = SorobanString::from_str(&e, "Task");
    let description = SorobanString::from_str(&e, "Test task");
    let funding_amount = 10_000_000i128;
    let mut task_ids = Vec::new(&e);

    // Create 10 tasks
    for _i in 0..10 {
        let task_id = client.create_task(
            &creator,
            &title,
            &description,
            &None,
            &funding_amount,
            &(e.ledger().timestamp() + 86400),
            &assignee,
        );
        task_ids.push_back(task_id);
    }

    // Complete all tasks
    for i in 0..10 {
        client.complete_task(&assignee, &task_ids.get(i).unwrap());
    }

    // Release funds for all tasks
    for i in 0..10 {
        client.release_funds(&creator, &task_ids.get(i).unwrap());
    }

    // Calculate expected platform fees (3% of total funding)
    let total_funding_amount = funding_amount * 10i128;
    let expected_platform_fee = total_funding_amount * 3i128 / 100i128;
    assert_eq!(client.get_platform_fees(), expected_platform_fee);

    // Withdraw all platform fees at once
    client.withdraw_platform_fees(&admin);
    assert_eq!(client.get_platform_fees(), 0);
    
    // Verify admin received all platform fees
    assert_eq!(token_client.balance(&admin), expected_platform_fee);
    
    // Verify assignee received all funds minus platform fees
    let expected_assignee_amount = total_funding_amount - expected_platform_fee;
    assert_eq!(token_client.balance(&assignee), expected_assignee_amount);
}

#[test]
fn test_no_platform_fee_for_cancelled_task() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, token_client, token_admin_client, _admin) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);

    let funding_amount = 1_000_000i128;
    mint_tokens(&token_admin_client, &creator, 10_000_000);

    let title = SorobanString::from_str(&e, "Task to Cancel");
    let description = SorobanString::from_str(&e, "This task will be cancelled");

    let task_id = client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &funding_amount,
        &(e.ledger().timestamp() + 86400),
        &assignee,
    );

    // Cancel the task
    client.cancel_task(&creator, &task_id);

    // Verify no platform fees were charged
    assert_eq!(client.get_platform_fees(), 0);
    
    // Verify creator received full refund
    assert_eq!(token_client.balance(&creator), 10_000_000);
}

#[test]
fn test_no_platform_fee_for_expired_task() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, token_client, token_admin_client, _admin) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);

    let funding_amount = 1_000_000i128;
    mint_tokens(&token_admin_client, &creator, 10_000_000);

    let title = SorobanString::from_str(&e, "Task to Expire");
    let description = SorobanString::from_str(&e, "This task will expire");
    let deadline = e.ledger().timestamp() + 100;

    let task_id = client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &funding_amount,
        &deadline,
        &assignee,
    );

    // Advance time past deadline
    e.ledger().with_mut(|li| {
        li.timestamp = deadline + 1;
    });

    // Mark as expired
    client.mark_expired(&task_id);

    // Reclaim expired funds
    client.reclaim_expired_funds(&creator, &task_id);

    // Verify no platform fees were charged
    assert_eq!(client.get_platform_fees(), 0);
    
    // Verify creator received full refund
    assert_eq!(token_client.balance(&creator), 10_000_000);
}

#[test]
fn test_get_platform_fees_when_none_exist() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, _token_client, _token_admin_client, _admin) = create_taskmaster_client(&e);

    // Verify platform fees is 0 when no tasks have been completed
    assert_eq!(client.get_platform_fees(), 0);
}

#[test]
fn test_platform_fee_calculation_precision() {
    let e = Env::default();
    e.mock_all_auths();

    let (client, token_client, token_admin_client, admin) = create_taskmaster_client(&e);
    let creator = Address::generate(&e);
    let assignee = Address::generate(&e);

    // Test with amounts that might have rounding issues with 3%
    let funding_amount1 = 101i128; // 3% = 3.03, should be 3
    let funding_amount2 = 99i128;   // 3% = 2.97, should be 2
    let funding_amount3 = 333i128; // 3% = 9.99, should be 9
    
    let total_funding = funding_amount1 + funding_amount2 + funding_amount3;
    mint_tokens(&token_admin_client, &creator, total_funding + 1_000_000);

    let title = SorobanString::from_str(&e, "Precision Test Task");
    let description = SorobanString::from_str(&e, "Testing precision");

    // Create and complete first task
    let task_id1 = client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &funding_amount1,
        &(e.ledger().timestamp() + 86400),
        &assignee,
    );
    client.complete_task(&assignee, &task_id1);
    client.release_funds(&creator, &task_id1);

    // Create and complete second task
    let task_id2 = client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &funding_amount2,
        &(e.ledger().timestamp() + 86400),
        &assignee,
    );
    client.complete_task(&assignee, &task_id2);
    client.release_funds(&creator, &task_id2);

    // Create and complete third task
    let task_id3 = client.create_task(
        &creator,
        &title,
        &description,
        &None,
        &funding_amount3,
        &(e.ledger().timestamp() + 86400),
        &assignee,
    );
    client.complete_task(&assignee, &task_id3);
    client.release_funds(&creator, &task_id3);

    // Calculate expected platform fees (using integer division)
    let expected_fee1 = funding_amount1 * 3i128 / 100i128;
    let expected_fee2 = funding_amount2 * 3i128 / 100i128;
    let expected_fee3 = funding_amount3 * 3i128 / 100i128;
    let total_expected_fee = expected_fee1 + expected_fee2 + expected_fee3;

    // Verify platform fees were calculated correctly
    assert_eq!(client.get_platform_fees(), total_expected_fee);

    // Withdraw platform fees
    client.withdraw_platform_fees(&admin);
    
    // Verify admin received the correct amount
    assert_eq!(token_client.balance(&admin), total_expected_fee);
    
    // Verify assignee received the correct amounts
    let expected_assignee_amount1 = funding_amount1 - expected_fee1;
    let expected_assignee_amount2 = funding_amount2 - expected_fee2;
    let expected_assignee_amount3 = funding_amount3 - expected_fee3;
    let total_expected_assignee_amount = expected_assignee_amount1 + expected_assignee_amount2 + expected_assignee_amount3;
    
    assert_eq!(token_client.balance(&assignee), total_expected_assignee_amount);
}