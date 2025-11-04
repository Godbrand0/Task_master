//! TaskMaster Smart Contract
//!
//! A decentralized task management smart contract built on the Stellar blockchain.
//! Enables users to create tasks, fund them with cryptocurrency, assign them to other users,
//! and securely release payments upon task completion.

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, Env, Map, String, Symbol, Vec,
};

// Task status enumeration
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum TaskStatus {
    Created,       // Task created and funded
    Assigned,      // Task assigned to user
    InProgress,    // Assignee working on task
    Completed,     // Assignee marked as complete
    Approved,      // Creator approved completion
    FundsReleased, // Payment released to assignee
    Expired,       // Task passed deadline
    Cancelled,     // Task cancelled by creator
}

// Task structure with all necessary fields
#[contracttype]
#[derive(Clone)]
pub struct Task {
    pub id: u64,                    // Unique identifier
    pub title: String,              // Task title
    pub description: String,        // Detailed description
    pub github_link: String,        // GitHub repository link (can be empty string)
    pub funding_amount: i128,       // Amount funded in stroops
    pub deadline: u64,              // Unix timestamp
    pub creator: Address,           // Creator's address
    pub assignee: Option<Address>,  // Assigned user's address
    pub status: TaskStatus,         // Current status
    pub created_at: u64,            // Creation timestamp
    pub completed_at: Option<u64>,  // Completion timestamp
    pub creator_approved: bool,     // Creator's approval flag
    pub assignee_approved: bool,    // Assignee's completion flag
}

// Storage keys for contract state
const TASKS: Symbol = symbol_short!("TASKS");
const USER_TASKS: Symbol = symbol_short!("USR_TSKS");
const ASSIGNED_TASKS: Symbol = symbol_short!("ASG_TSKS");
const TASK_COUNTER: Symbol = symbol_short!("TSK_CNTR");
const TOKEN: Symbol = symbol_short!("TOKEN");
const DEPLOYER: Symbol = symbol_short!("DEPLOYER");
const PLATFORM_FEES: Symbol = symbol_short!("PLT_FEES");

// Platform fee percentage (3% = 3/100)
const PLATFORM_FEE_PERCENTAGE: u32 = 3;

// Contract implementation
#[contract]
pub struct TaskMaster;

#[contractimpl]
impl TaskMaster {
    /// Initialize the contract with token address
    ///
    /// # Arguments
    /// * `token` - Address of the token contract for payments
    /// * `deployer` - Address of the contract deployer who will receive platform fees
    pub fn initialize(env: Env, token: Address, deployer: Address) {
        // Check if already initialized
        if env.storage().instance().has(&TASK_COUNTER) {
            panic!("Contract already initialized");
        }

        // Initialize task counter to 1
        env.storage().instance().set(&TASK_COUNTER, &1u64);
        
        // Store token address
        env.storage().instance().set(&TOKEN, &token);
        
        // Store deployer address
        env.storage().instance().set(&DEPLOYER, &deployer);
        
        // Initialize platform fees accumulator to 0
        env.storage().instance().set(&PLATFORM_FEES, &0i128);
    }

    /// Create a new task with funding
    ///
    /// # Arguments
    /// * `creator` - Address of the task creator
    /// * `title` - Task title
    /// * `description` - Detailed description of the task
    /// * `github_link` - GitHub repository link (can be empty string)
    /// * `funding_amount` - Amount to fund the task (in stroops)
    /// * `deadline` - Unix timestamp for the task deadline
    /// * `assignee` - Address of the assigned user
    ///
    /// # Returns
    /// The ID of the newly created task
    pub fn create_task(
        env: Env,
        creator: Address,
        title: String,
        description: String,
        github_link: String,
        funding_amount: i128,
        deadline: u64,
        assignee: Address,
    ) -> u64 {
        // Validate inputs
        Self::validate_task_creation(&env, &title, &description, funding_amount, deadline);

        // Require authorization from creator
        creator.require_auth();

        // Get current task ID and increment counter
        let task_id = env
            .storage()
            .instance()
            .get(&TASK_COUNTER)
            .unwrap_or(1u64);
        env.storage()
            .instance()
            .set(&TASK_COUNTER, &(task_id + 1));

        let current_time = env.ledger().timestamp();

        // Transfer funds from creator to contract
        let token_address: Address = env
            .storage()
            .instance()
            .get(&TOKEN)
            .expect("Token not initialized");
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&creator, &token_address, &funding_amount);

        // Create new task
        let task = Task {
            id: task_id,
            title,
            description,
            github_link,
            funding_amount,
            deadline,
            creator: creator.clone(),
            assignee: Some(assignee.clone()),
            status: TaskStatus::Assigned,
            created_at: current_time,
            completed_at: None,
            creator_approved: false,
            assignee_approved: false,
        };

        // Store task
        let mut tasks: Map<u64, Task> = env
            .storage()
            .instance()
            .get(&TASKS)
            .unwrap_or(Map::new(&env));
        tasks.set(task_id, task.clone());
        env.storage().instance().set(&TASKS, &tasks);

        // Update user tasks mapping
        let mut user_tasks: Map<Address, Vec<u64>> = env
            .storage()
            .instance()
            .get(&USER_TASKS)
            .unwrap_or(Map::new(&env));
        let mut creator_tasks = user_tasks
            .get(creator.clone())
            .unwrap_or(Vec::new(&env));
        creator_tasks.push_back(task_id);
        user_tasks.set(creator.clone(), creator_tasks);
        env.storage().instance().set(&USER_TASKS, &user_tasks);

        // Update assigned tasks mapping
        let mut assigned_tasks: Map<Address, Vec<u64>> = env
            .storage()
            .instance()
            .get(&ASSIGNED_TASKS)
            .unwrap_or(Map::new(&env));
        let mut assignee_tasks = assigned_tasks
            .get(assignee.clone())
            .unwrap_or(Vec::new(&env));
        assignee_tasks.push_back(task_id);
        assigned_tasks.set(assignee.clone(), assignee_tasks);
        env.storage().instance().set(&ASSIGNED_TASKS, &assigned_tasks);

        task_id
    }

    /// Mark a task as complete by the assignee
    ///
    /// # Arguments
    /// * `assignee` - Address of the assignee
    /// * `task_id` - ID of the task to complete
    pub fn complete_task(env: Env, assignee: Address, task_id: u64) {
        assignee.require_auth();

        let mut tasks: Map<u64, Task> = env
            .storage()
            .instance()
            .get(&TASKS)
            .unwrap_or(Map::new(&env));
        let mut task = tasks
            .get(task_id)
            .unwrap_or_else(|| panic!("Task not found"));

        // Check if caller is the assignee
        Self::require_assignee(&assignee, &task);

        // Check if task is in valid state for completion
        Self::require_valid_state(
            &task,
            &[
                TaskStatus::Assigned,
                TaskStatus::InProgress,
            ],
        );

        // Check if task is not expired
        if env.ledger().timestamp() > task.deadline {
            panic!("Task has expired");
        }

        // Update task status and completion timestamp
        task.status = TaskStatus::Completed;
        task.assignee_approved = true;
        task.completed_at = Some(env.ledger().timestamp());

        // Store updated task
        tasks.set(task_id, task);
        env.storage().instance().set(&TASKS, &tasks);
    }

    /// Update task status to InProgress
    ///
    /// # Arguments
    /// * `assignee` - Address of the assignee
    /// * `task_id` - ID of the task to start
    pub fn start_task(env: Env, assignee: Address, task_id: u64) {
        assignee.require_auth();

        let mut tasks: Map<u64, Task> = env
            .storage()
            .instance()
            .get(&TASKS)
            .unwrap_or(Map::new(&env));
        let mut task = tasks
            .get(task_id)
            .unwrap_or_else(|| panic!("Task not found"));

        // Check if caller is the assignee
        Self::require_assignee(&assignee, &task);

        // Check if task is in Assigned state
        Self::require_valid_state(&task, &[TaskStatus::Assigned]);

        // Update task status
        task.status = TaskStatus::InProgress;

        // Store updated task
        tasks.set(task_id, task);
        env.storage().instance().set(&TASKS, &tasks);
    }

    /// Release funds to the assignee after creator approval
    ///
    /// # Arguments
    /// * `creator` - Address of the task creator
    /// * `task_id` - ID of the task to release funds for
    pub fn release_funds(env: Env, creator: Address, task_id: u64) {
        creator.require_auth();

        let mut tasks: Map<u64, Task> = env
            .storage()
            .instance()
            .get(&TASKS)
            .unwrap_or(Map::new(&env));
        let mut task = tasks
            .get(task_id)
            .unwrap_or_else(|| panic!("Task not found"));

        // Check if caller is the creator
        Self::require_creator(&creator, &task);

        // Check if task is in valid state for fund release
        Self::require_valid_state(&task, &[TaskStatus::Completed]);

        // Check if assignee has marked task as complete
        if !task.assignee_approved {
            panic!("Task must be marked complete by assignee");
        }

        let assignee = task
            .assignee
            .clone()
            .expect("Task must have an assignee");

        // Calculate platform fee (3% of funding amount)
        let platform_fee = task.funding_amount * PLATFORM_FEE_PERCENTAGE as i128 / 100i128;
        let assignee_amount = task.funding_amount - platform_fee;

        // Update platform fees accumulator
        let mut accumulated_fees: i128 = env
            .storage()
            .instance()
            .get(&PLATFORM_FEES)
            .unwrap_or(0i128);
        accumulated_fees += platform_fee;
        env.storage().instance().set(&PLATFORM_FEES, &accumulated_fees);

        // Update task status
        task.status = TaskStatus::FundsReleased;
        task.creator_approved = true;

        // Store updated task before transfer
        tasks.set(task_id, task.clone());
        env.storage().instance().set(&TASKS, &tasks);

        // Get token client
        let token_address: Address = env
            .storage()
            .instance()
            .get(&TOKEN)
            .expect("Token not initialized");
        let token_client = token::Client::new(&env, &token_address);

        // Transfer funds to assignee (after platform fee deduction)
        token_client.transfer(
            &env.current_contract_address(),
            &assignee,
            &assignee_amount,
        );
    }

    /// Cancel a task and refund the creator
    ///
    /// # Arguments
    /// * `creator` - Address of the task creator
    /// * `task_id` - ID of the task to cancel
    pub fn cancel_task(env: Env, creator: Address, task_id: u64) {
        creator.require_auth();

        let mut tasks: Map<u64, Task> = env
            .storage()
            .instance()
            .get(&TASKS)
            .unwrap_or(Map::new(&env));
        let mut task = tasks
            .get(task_id)
            .unwrap_or_else(|| panic!("Task not found"));

        // Check if caller is the creator
        Self::require_creator(&creator, &task);

        // Check if task is in valid state for cancellation
        Self::require_valid_state(
            &task,
            &[TaskStatus::Assigned, TaskStatus::InProgress],
        );

        // Update task status
        task.status = TaskStatus::Cancelled;

        // Store updated task before refund
        tasks.set(task_id, task.clone());
        env.storage().instance().set(&TASKS, &tasks);

        // Refund creator
        let token_address: Address = env
            .storage()
            .instance()
            .get(&TOKEN)
            .expect("Token not initialized");
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(
            &env.current_contract_address(),
            &creator,
            &task.funding_amount,
        );
    }

    /// Handle expired tasks - mark as expired
    ///
    /// # Arguments
    /// * `task_id` - ID of the expired task
    pub fn mark_expired(env: Env, task_id: u64) {
        let mut tasks: Map<u64, Task> = env
            .storage()
            .instance()
            .get(&TASKS)
            .unwrap_or(Map::new(&env));
        let mut task = tasks
            .get(task_id)
            .unwrap_or_else(|| panic!("Task not found"));

        // Check if task is actually expired
        if env.ledger().timestamp() <= task.deadline {
            panic!("Task is not expired");
        }

        // Check if task is in valid state for expiration handling
        Self::require_valid_state(
            &task,
            &[
                TaskStatus::Assigned,
                TaskStatus::InProgress,
            ],
        );

        // Mark as expired
        task.status = TaskStatus::Expired;

        // Store updated task
        tasks.set(task_id, task);
        env.storage().instance().set(&TASKS, &tasks);
    }

    /// Reclaim funds from expired task
    ///
    /// # Arguments
    /// * `creator` - Address of the task creator
    /// * `task_id` - ID of the expired task
    pub fn reclaim_expired_funds(env: Env, creator: Address, task_id: u64) {
        creator.require_auth();

        let mut tasks: Map<u64, Task> = env
            .storage()
            .instance()
            .get(&TASKS)
            .unwrap_or(Map::new(&env));
        let mut task = tasks
            .get(task_id)
            .unwrap_or_else(|| panic!("Task not found"));

        // Check if caller is the creator
        Self::require_creator(&creator, &task);

        // Check if task is expired
        if task.status != TaskStatus::Expired {
            panic!("Task must be expired to reclaim funds");
        }

        // Update task status to cancelled
        task.status = TaskStatus::Cancelled;

        // Store updated task
        tasks.set(task_id, task.clone());
        env.storage().instance().set(&TASKS, &tasks);

        // Refund creator
        let token_address: Address = env
            .storage()
            .instance()
            .get(&TOKEN)
            .expect("Token not initialized");
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(
            &env.current_contract_address(),
            &creator,
            &task.funding_amount,
        );
    }

    /// Withdraw accumulated platform fees (only deployer can call)
    ///
    /// # Arguments
    /// * `deployer` - Address of the contract deployer
    pub fn withdraw_platform_fees(env: Env, deployer: Address) {
        deployer.require_auth();

        // Verify caller is the deployer
        let stored_deployer: Address = env
            .storage()
            .instance()
            .get(&DEPLOYER)
            .expect("Deployer not initialized");
        
        if stored_deployer != deployer {
            panic!("Only deployer can withdraw platform fees");
        }

        // Get accumulated fees
        let accumulated_fees: i128 = env
            .storage()
            .instance()
            .get(&PLATFORM_FEES)
            .unwrap_or(0i128);

        if accumulated_fees <= 0 {
            panic!("No platform fees to withdraw");
        }

        // Reset platform fees accumulator
        env.storage().instance().set(&PLATFORM_FEES, &0i128);

        // Transfer fees to deployer
        let token_address: Address = env
            .storage()
            .instance()
            .get(&TOKEN)
            .expect("Token not initialized");
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(
            &env.current_contract_address(),
            &deployer,
            &accumulated_fees,
        );
    }

    /// Get current accumulated platform fees
    ///
    /// # Returns
    /// The total amount of accumulated platform fees
    pub fn get_platform_fees(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&PLATFORM_FEES)
            .unwrap_or(0i128)
    }

    /// Reassign an expired task to a new assignee
    ///
    /// # Arguments
    /// * `creator` - Address of the task creator
    /// * `task_id` - ID of the task to reassign
    /// * `new_assignee` - Address of the new assignee
    pub fn reassign_task(env: Env, creator: Address, task_id: u64, new_assignee: Address) {
        creator.require_auth();

        let mut tasks: Map<u64, Task> = env
            .storage()
            .instance()
            .get(&TASKS)
            .unwrap_or(Map::new(&env));
        let mut task = tasks
            .get(task_id)
            .unwrap_or_else(|| panic!("Task not found"));

        // Check if caller is the creator
        Self::require_creator(&creator, &task);

        // Check if task is expired
        if task.status != TaskStatus::Expired {
            panic!("Task must be expired to reassign");
        }

        // Update assignee and reset status
        let old_assignee = task
            .assignee
            .clone()
            .expect("Task must have an assignee");
        task.assignee = Some(new_assignee.clone());
        task.status = TaskStatus::Assigned;
        task.assignee_approved = false;
        task.creator_approved = false;
        task.completed_at = None;

        // Store updated task
        tasks.set(task_id, task);
        env.storage().instance().set(&TASKS, &tasks);

        // Update assigned tasks mapping
        let mut assigned_tasks: Map<Address, Vec<u64>> = env
            .storage()
            .instance()
            .get(&ASSIGNED_TASKS)
            .unwrap_or(Map::new(&env));

        // Remove from old assignee's tasks
        if let Some(mut old_tasks) = assigned_tasks.get(old_assignee.clone()) {
            if let Some(index) = old_tasks.iter().position(|id| id == task_id) {
                old_tasks.remove(index as u32);
                assigned_tasks.set(old_assignee.clone(), old_tasks);
            }
        }

        // Add to new assignee's tasks
        let mut new_tasks = assigned_tasks
            .get(new_assignee.clone())
            .unwrap_or(Vec::new(&env));
        new_tasks.push_back(task_id);
        assigned_tasks.set(new_assignee.clone(), new_tasks);

        env.storage().instance().set(&ASSIGNED_TASKS, &assigned_tasks);
    }

    /// Get task details by ID
    ///
    /// # Arguments
    /// * `task_id` - ID of the task to retrieve
    ///
    /// # Returns
    /// The task details
    pub fn get_task(env: Env, task_id: u64) -> Task {
        let tasks: Map<u64, Task> = env
            .storage()
            .instance()
            .get(&TASKS)
            .unwrap_or(Map::new(&env));
        tasks
            .get(task_id)
            .unwrap_or_else(|| panic!("Task not found"))
    }

    /// Get all tasks created by a user
    ///
    /// # Arguments
    /// * `user` - Address of the user
    ///
    /// # Returns
    /// Vector of task IDs created by the user
    pub fn get_user_tasks(env: Env, user: Address) -> Vec<u64> {
        let user_tasks: Map<Address, Vec<u64>> = env
            .storage()
            .instance()
            .get(&USER_TASKS)
            .unwrap_or(Map::new(&env));
        user_tasks.get(user).unwrap_or(Vec::new(&env))
    }

    /// Get all tasks assigned to a user
    ///
    /// # Arguments
    /// * `user` - Address of the user
    ///
    /// # Returns
    /// Vector of task IDs assigned to the user
    pub fn get_assigned_tasks(env: Env, user: Address) -> Vec<u64> {
        let assigned_tasks: Map<Address, Vec<u64>> = env
            .storage()
            .instance()
            .get(&ASSIGNED_TASKS)
            .unwrap_or(Map::new(&env));
        assigned_tasks.get(user).unwrap_or(Vec::new(&env))
    }

    /// Get total number of tasks
    pub fn get_task_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&TASK_COUNTER)
            .unwrap_or(1u64)
            - 1
    }

    // Helper functions

    /// Validate task creation parameters
    fn validate_task_creation(
        env: &Env,
        title: &String,
        description: &String,
        funding_amount: i128,
        deadline: u64,
    ) {
        if title.len() == 0 {
            panic!("Title cannot be empty");
        }
        if description.len() == 0 {
            panic!("Description cannot be empty");
        }
        if funding_amount <= 0 {
            panic!("Funding amount must be positive");
        }
        if deadline <= env.ledger().timestamp() {
            panic!("Deadline must be in the future");
        }
    }

    /// Check if caller is task creator
    fn require_creator(creator: &Address, task: &Task) {
        if task.creator != *creator {
            panic!("Only task creator can perform this action");
        }
    }

    /// Check if caller is task assignee
    fn require_assignee(assignee: &Address, task: &Task) {
        match &task.assignee {
            Some(addr) if *addr == *assignee => {},
            _ => panic!("Only task assignee can perform this action"),
        }
    }

    /// Check if task is in valid state
    fn require_valid_state(task: &Task, valid_states: &[TaskStatus]) {
        if !valid_states.contains(&task.status) {
            panic!("Task is not in valid state for this operation");
        }
    }
}

