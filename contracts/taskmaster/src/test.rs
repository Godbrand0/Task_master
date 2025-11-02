#![cfg(test)]
extern crate std;

use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, Env, String as SorobanString,
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

    client.initialize(&token_client.address);

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
    client.initialize(&token_client.address);

    // Verify task counter is set to 1
    assert_eq!(client.get_task_count(), 0);
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

    client.initialize(&token_client.address);
    // Should panic on second initialization
    client.initialize(&token_client.address);
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

    // Complete the task
    client.complete_task(&assignee, &task_id);

    // Release funds
    client.release_funds(&creator, &task_id);

    let task = client.get_task(&task_id);
    assert_eq!(task.status, TaskStatus::FundsReleased);
    assert!(task.creator_approved);

    // Verify assignee received the funds
    assert_eq!(token_client.balance(&assignee), funding_amount);
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

    // Verify funds were transferred
    assert_eq!(token_client.balance(&assignee), funding_amount);
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