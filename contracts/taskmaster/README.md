# TaskMaster Smart Contract

A decentralized task management smart contract built on the Stellar blockchain using Soroban. TaskMaster enables users to create tasks, fund them with cryptocurrency, assign them to other users, and securely release payments upon task completion.

## Overview

TaskMaster implements a dual-signature escrow system where funds are held in smart contract until both the task assignee confirms completion and the task creator approves the work. This ensures fair compensation for completed work while protecting creators from incomplete or unsatisfactory work.

## Features

- **Task Creation**: Create detailed tasks with descriptions, GitHub links, and deadlines
- **Funding Mechanism**: Fund tasks with cryptocurrency held in escrow
- **Assignment System**: Assign tasks to users using their Stellar addresses
- **Dual-Signature Release**: Two-signature system for secure fund release
- **Task Dashboard**: View created tasks and assigned tasks separately
- **Completion Tracking**: Mark tasks as complete with wallet signature
- **Refund System**: Cancel tasks and receive refunds
- **Expiration Handling**: Automatic handling of expired tasks with reassignment or refund options

## Architecture

### Data Structures

#### Task Structure

```rust
pub struct Task {
    pub id: u64,                    // Unique identifier
    pub title: String,              // Task title
    pub description: String,        // Detailed description
    pub github_link: Option<String>, // Optional GitHub repository
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
```

#### Task Status Enumeration

```rust
pub enum TaskStatus {
    Created,        // Task created and funded
    Assigned,       // Task assigned to user
    InProgress,     // Assignee working on task
    Completed,      // Assignee marked as complete
    Approved,       // Creator approved completion
    FundsReleased,  // Payment released to assignee
    Expired,        // Task passed deadline
    Cancelled,      // Task cancelled by creator
}
```

### Storage Layout

The contract uses the following storage keys:

- `TASKS`: Map<u64, Task> - Stores all tasks by their ID
- `USER_TASKS`: Map<Address, Vec<u64>> - Maps users to their created task IDs
- `ASSIGNED_TASKS`: Map<Address, Vec<u64>> - Maps users to their assigned task IDs
- `TASK_COUNTER`: u64 - Auto-incrementing counter for unique task IDs

## Functions

### Core Functions

#### `initialize()`

Initializes the contract by setting up the task counter. Must be called once before any other operations.

#### `create_task(title, description, github_link, funding_amount, deadline, assignee)`

Creates a new task with the specified parameters and funds it with the provided amount. Returns the ID of the newly created task.

**Parameters:**

- `title`: Task title (must be non-empty)
- `description`: Detailed description (must be non-empty)
- `github_link`: Optional GitHub repository link
- `funding_amount`: Amount to fund the task in stroops (must be positive)
- `deadline`: Unix timestamp for task deadline (must be in the future)
- `assignee`: Address of the assigned user

#### `complete_task(task_id)`

Marks a task as complete by the assignee. This is the first signature required for fund release.

**Parameters:**

- `task_id`: ID of the task to complete

**Access Control:** Only the task assignee can call this function.

#### `release_funds(task_id)`

Releases funds to the assignee after creator approval. This is the second signature required for fund release.

**Parameters:**

- `task_id`: ID of the task to release funds for

**Access Control:** Only the task creator can call this function.

#### `cancel_task(task_id)`

Cancels a task and refunds the creator.

**Parameters:**

- `task_id`: ID of the task to cancel

**Access Control:** Only the task creator can call this function.

#### `handle_expired_task(task_id, reassign)`

Handles expired tasks - either marks them for reassignment or refunds the creator.

**Parameters:**

- `task_id`: ID of the expired task
- `reassign`: Whether to reassign (true) or refund (false)

#### `reassign_task(task_id, new_assignee)`

Reassigns an expired task to a new assignee.

**Parameters:**

- `task_id`: ID of the task to reassign
- `new_assignee`: Address of the new assignee

**Access Control:** Only the task creator can call this function.

### Query Functions

#### `get_task(task_id)`

Retrieves task details by ID.

**Parameters:**

- `task_id`: ID of the task to retrieve

**Returns:** The complete task structure.

#### `get_user_tasks(user)`

Retrieves all tasks created by a user.

**Parameters:**

- `user`: Address of the user

**Returns:** Vector of task IDs created by the user.

#### `get_assigned_tasks(user)`

Retrieves all tasks assigned to a user.

**Parameters:**

- `user`: Address of the user

**Returns:** Vector of task IDs assigned to the user.

## Security Features

### Access Control

The contract implements strict access control through modifier functions:

- **Creator-only operations**: `cancel_task`, `release_funds`, `reassign_task`
- **Assignee-only operations**: `complete_task`
- **State validation**: All operations validate that the task is in the correct state

### Dual-Signature System

The contract requires two signatures for fund release:

1. **Assignee Signature**: Confirms task completion via `complete_task()`
2. **Creator Signature**: Confirms satisfaction with work via `release_funds()`

This ensures:

- Assignees get paid only for completed work
- Creators only pay for satisfactory work
- No premature fund release

### Input Validation

All functions include comprehensive input validation:

- Non-empty titles and descriptions
- Positive funding amounts
- Future deadlines
- Valid task states for operations

### State Management

The contract maintains a strict state machine for task lifecycle:

1. **Created** → **Assigned** (automatic on creation)
2. **Assigned** → **InProgress** (implicit when assignee starts work)
3. **InProgress** → **Completed** (via `complete_task()`)
4. **Completed** → **FundsReleased** (via `release_funds()`)
5. Any state → **Cancelled** (via `cancel_task()`)
6. Any state → **Expired** (via `handle_expired_task()`)

## Usage Examples

### Creating a Task

```rust
let task_id = contract.create_task(
    "Build a React component",
    "Create a reusable button component with TypeScript",
    Some("https://github.com/example/project".to_string()),
    10000000, // 0.1 XLM in stroops
    current_time + 86400, // 1 day from now
    assignee_address,
);
```

### Completing a Task

```rust
// Called by assignee
contract.complete_task(task_id);
```

### Releasing Funds

```rust
// Called by creator after reviewing work
contract.release_funds(task_id);
```

### Canceling a Task

```rust
// Called by creator
contract.cancel_task(task_id);
```

## Testing

The contract includes comprehensive tests covering:

- Task creation and validation
- Task completion and fund release
- Access control and authorization
- Task cancellation and refunds
- Expiration handling and reassignment
- Task lifecycle management

Run tests with:

```bash
cargo test
```

## Deployment

### Prerequisites

- Rust toolchain with wasm32-unknown-unknown target
- Soroban CLI
- Stellar account with sufficient balance

### Build Contract

```bash
cargo build --target wasm32-unknown-unknown --release
```

### Deploy to Testnet

```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/taskmaster.wasm \
  --source your_testnet_account \
  --network testnet
```

### Initialize Contract

```bash
soroban contract invoke \
  --id CONTRACT_ID \
  --source your_testnet_account \
  --network testnet \
  -- \
  initialize
```

## Integration with Frontend

The contract is designed to work seamlessly with the TaskMaster frontend application. The frontend should:

1. Connect to user's Stellar wallet
2. Deploy and initialize the contract (if not already done)
3. Create tasks with proper funding
4. Handle transaction signing for all operations
5. Display task status and progress
6. Provide intuitive interfaces for task management

## Gas Optimization

The contract implements several gas optimization strategies:

- Efficient storage patterns with Map data structures
- Minimal storage operations per transaction
- Batch operations where possible
- Optimized data structures for common access patterns

## Future Enhancements

Potential future improvements include:

- **Task Categories**: Organize tasks by type or project
- **Reputation System**: Build trust scores for reliable task completion
- **Dispute Resolution**: Mediation system for task disagreements
- **Recurring Tasks**: Support for repeated task creation
- **Team Management**: Create and manage task teams
- **Multi-token Support**: Accept various tokens for task funding
- **Time Tracking**: Built-in time tracking for tasks
- **Milestone Payments**: Split payments for milestone-based tasks

## License

This contract is licensed under the MIT License - see the LICENSE file for details.

## Contributing

We welcome contributions! Please see the CONTRIBUTING.md file for guidelines on how to contribute to this project.

## Security

For security concerns or vulnerability reports, please see the SECURITY.md file for reporting procedures.
