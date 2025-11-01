# TaskMaster Technical Architecture

## Overview

TaskMaster is a decentralized task management platform built on the Stellar blockchain, leveraging the Scaffold Stellar framework for rapid development. This document provides detailed technical specifications for implementation.

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Stellar        │    │  Smart Contract │
│   (React/TS)    │◄──►│  Wallet Kit     │◄──►│  (Rust/WASM)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vite Dev      │    │  Stellar        │    │  Stellar        │
│   Server        │    │  Horizon API    │    │  Soroban        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Smart Contract Design

### Core Data Structures

```rust
// Task structure with all necessary fields
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

// Task status enumeration
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

// Contract state structure
pub struct TaskMasterContract {
    pub tasks: Map<u64, Task>,              // Task storage
    pub user_tasks: Map<Address, Vec<u64>>, // User to task IDs mapping
    pub assigned_tasks: Map<Address, Vec<u64>>, // Assignee to task IDs mapping
    pub task_counter: u64,                  // Auto-incrementing task ID
}
```

### Key Functions

```rust
// Task creation and funding
pub fn create_task(
    env: Env,
    title: String,
    description: String,
    github_link: Option<String>,
    funding_amount: i128,
    deadline: u64,
    assignee: Address,
) -> u64;

// Task completion by assignee
pub fn complete_task(env: Env, task_id: u64);

// Fund release by creator
pub fn release_funds(env: Env, task_id: u64);

// Task cancellation with refund
pub fn cancel_task(env: Env, task_id: u64);

// Handle expired tasks
pub fn handle_expired_task(env: Env, task_id: u64, reassign: bool);

// Reassign expired task
pub fn reassign_task(env: Env, task_id: u64, new_assignee: Address);

// Get task details
pub fn get_task(env: Env, task_id: u64) -> Task;

// Get user's created tasks
pub fn get_user_tasks(env: Env, user: Address) -> Vec<u64>;

// Get tasks assigned to user
pub fn get_assigned_tasks(env: Env, user: Address) -> Vec<u64>;
```

### Access Control

```rust
// Modifier to check if caller is task creator
fn require_creator(env: &Env, task: &Task) {
    require!(
        task.creator == env.invoker(),
        "Only task creator can perform this action"
    );
}

// Modifier to check if caller is task assignee
fn require_assignee(env: &Env, task: &Task) {
    require!(
        task.assignee.map_or(false, |a| a == env.invoker()),
        "Only task assignee can perform this action"
    );
}

// Modifier to check if task is in valid state
fn require_valid_state(task: &Task, valid_states: &[TaskStatus]) {
    require!(
        valid_states.contains(&task.status),
        "Task is not in valid state for this operation"
    );
}
```

## Frontend Architecture

### Component Structure

```
src/
├── components/
│   ├── common/
│   │   ├── Button.tsx           # Reusable button component
│   │   ├── Input.tsx            # Reusable input field
│   │   ├── Modal.tsx            # Modal dialog component
│   │   └── Loading.tsx          # Loading spinner
│   ├── task/
│   │   ├── TaskCard.tsx         # Task display card
│   │   ├── TaskForm.tsx         # Task creation/editing form
│   │   ├── TaskList.tsx         # List of tasks
│   │   ├── TaskDetails.tsx      # Detailed task view
│   │   └── TaskStatus.tsx       # Status indicator component
│   ├── wallet/
│   │   ├── WalletConnect.tsx    # Wallet connection button
│   │   ├── WalletInfo.tsx       # Wallet information display
│   │   └── TransactionSign.tsx  # Transaction signing interface
│   └── layout/
│       ├── Header.tsx           # Application header
│       ├── Sidebar.tsx          # Navigation sidebar
│       └── Footer.tsx           # Application footer
├── pages/
│   ├── Home.tsx                 # Landing page
│   ├── Dashboard.tsx            # Main dashboard
│   ├── CreateTask.tsx           # Task creation page
│   ├── MyTasks.tsx              # User's created tasks
│   ├── AssignedTasks.tsx        # Tasks assigned to user
│   └── TaskDetails.tsx          # Individual task page
├── hooks/
│   ├── useStellar.ts            # Stellar wallet and contract interactions
│   ├── useTasks.ts              # Task management operations
│   ├── useAuth.ts               # Authentication state management
│   └── useNotifications.ts      # Notification system
├── services/
│   ├── stellarService.ts        # Stellar-specific operations
│   ├── taskService.ts           # Task CRUD operations
│   ├── contractService.ts       # Smart contract interactions
│   └── transactionService.ts    # Transaction handling
├── store/
│   ├── index.ts                 # Redux store configuration
│   ├── authSlice.ts             # Authentication state
│   ├── taskSlice.ts             # Task state management
│   └── uiSlice.ts               # UI state management
├── utils/
│   ├── constants.ts             # Application constants
│   ├── helpers.ts               # Utility functions
│   ├── formatters.ts            # Data formatting functions
│   └── validators.ts            # Form validation functions
└── styles/
    ├── globals.css              # Global styles
    ├── variables.css            # CSS variables
    └── components/              # Component-specific styles
```

### State Management

Using Redux Toolkit for state management:

```typescript
// Auth slice
interface AuthState {
  isConnected: boolean;
  address: string | null;
  balance: string;
  isLoading: boolean;
  error: string | null;
}

// Task slice
interface TaskState {
  tasks: Task[];
  userTasks: Task[];
  assignedTasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  error: string | null;
}

// UI slice
interface UIState {
  theme: 'light' | 'dark';
  notifications: Notification[];
  modals: {
    createTask: boolean;
    taskDetails: boolean;
    walletConnect: boolean;
  };
}
```

### Stellar Integration

```typescript
// Stellar Wallet Kit integration
import { WalletKit } from '@stellar/wallet-kit';

const walletKit = new WalletKit({
  wallets: [
    { name: 'freighter', type: 'freighter' },
    { name: 'albedo', type: 'albedo' },
    { name: 'xbull', type: 'xbull' },
  ],
  network: process.env.VITE_STELLAR_NETWORK === 'testnet' ? 'TESTNET' : 'PUBLIC',
});

// Contract interaction service
export class ContractService {
  private contractId: string;
  private server: Server;

  constructor(contractId: string, horizonUrl: string) {
    this.contractId = contractId;
    this.server = new Server(horizonUrl);
  }

  async createTask(params: CreateTaskParams): Promise<Transaction> {
    const account = await walletKit.getAddress();
    const contract = new Contract(this.contractId);
    
    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(contract.call(
        "create_task",
        ...Object.values(params)
      ))
      .setTimeout(30)
      .build();

    return walletKit.signTransaction(transaction);
  }

  async completeTask(taskId: number): Promise<Transaction> {
    const account = await walletKit.getAddress();
    const contract = new Contract(this.contractId);
    
    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(contract.call("complete_task", taskId))
      .setTimeout(30)
      .build();

    return walletKit.signTransaction(transaction);
  }

  async releaseFunds(taskId: number): Promise<Transaction> {
    const account = await walletKit.getAddress();
    const contract = new Contract(this.contractId);
    
    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(contract.call("release_funds", taskId))
      .setTimeout(30)
      .build();

    return walletKit.signTransaction(transaction);
  }
}
```

## Data Flow

### Task Creation Flow

1. User fills task creation form
2. Frontend validates form data
3. User connects wallet (if not already connected)
4. Frontend creates transaction with task parameters
5. User signs transaction with wallet
6. Transaction is submitted to Stellar network
7. Smart contract validates and stores task
8. Frontend updates UI with new task status

### Task Completion Flow

1. Assignee views assigned tasks
2. Assignee clicks "Complete Task" button
3. Frontend creates completion transaction
4. Assignee signs transaction with wallet
5. Smart contract updates task status to "Completed"
6. Creator receives notification of task completion
7. Creator reviews task and clicks "Release Funds"
8. Creator signs release transaction
9. Smart contract transfers funds to assignee
10. Task status updated to "FundsReleased"

## Security Considerations

### Smart Contract Security

1. **Access Control**: Strict modifiers for creator/assignee permissions
2. **State Validation**: Proper state transitions for all operations
3. **Fund Safety**: Escrow mechanism with dual-signature requirement
4. **Input Validation**: Comprehensive parameter validation
5. **Reentrancy Protection**: Guard against reentrancy attacks

### Frontend Security

1. **Input Sanitization**: Clean all user inputs
2. **Transaction Validation**: Verify transaction details before signing
3. **Secure Storage**: Use secure storage for sensitive data
4. **HTTPS**: Enforce secure connections
5. **CSP**: Implement Content Security Policy

## Performance Optimization

### Smart Contract Optimization

1. **Efficient Storage**: Optimize data structures for gas efficiency
2. **Batch Operations**: Support for multiple operations in single transaction
3. **Event Logging**: Efficient event emission for off-chain tracking
4. **Lazy Loading**: Load data only when needed

### Frontend Optimization

1. **Code Splitting**: Implement route-based code splitting
2. **Caching**: Cache frequently accessed data
3. **Lazy Loading**: Load components and data on demand
4. **Optimistic Updates**: Update UI before transaction confirmation
5. **Pagination**: Implement pagination for large task lists

## Testing Strategy

### Smart Contract Testing

```rust
// Unit tests for contract functions
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_task() {
        let env = Env::default();
        let contract_id = env.register_contract(None, TaskMasterContract);
        let client = TaskMasterContractClient::new(&env, &contract_id);
        
        // Test task creation
        let task_id = client.create_task(
            &"Test Task".into_val(&env),
            &"Test Description".into_val(&env),
            &None.into_val(&env),
            &1000000.into_val(&env), // 0.1 XLM in stroops
            &(env.ledger().timestamp() + 86400).into_val(&env), // 1 day from now
            &Address::generate(&env),
        );
        
        // Verify task was created
        let task = client.get_task(&task_id);
        assert_eq!(task.title, "Test Task");
        assert_eq!(task.status, TaskStatus::Created);
    }
}
```

### Frontend Testing

```typescript
// Component tests with React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskForm } from './TaskForm';

describe('TaskForm', () => {
  test('renders form fields correctly', () => {
    render(<TaskForm onSubmit={jest.fn()} />);
    
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('GitHub Link')).toBeInTheDocument();
    expect(screen.getByLabelText('Funding Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Deadline')).toBeInTheDocument();
    expect(screen.getByLabelText('Assignee Address')).toBeInTheDocument();
  });

  test('validates form fields', async () => {
    const mockOnSubmit = jest.fn();
    render(<TaskForm onSubmit={mockOnSubmit} />);
    
    // Submit without filling required fields
    fireEvent.click(screen.getByText('Create Task'));
    
    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
```

## Deployment Strategy

### Smart Contract Deployment

1. **Development**: Deploy to Stellar Testnet
2. **Staging**: Deploy to Testnet with production-like data
3. **Production**: Deploy to Stellar Mainnet after thorough testing

### Frontend Deployment

1. **Development**: Local development server
2. **Staging**: Deploy to Vercel/Netlify with testnet configuration
3. **Production**: Deploy to Vercel/Netlify with mainnet configuration

## Monitoring and Analytics

### Blockchain Monitoring

1. **Transaction Tracking**: Monitor all contract transactions
2. **Event Analysis**: Track task lifecycle events
3. **Performance Metrics**: Monitor gas usage and transaction times
4. **Error Tracking**: Identify and analyze failed transactions

### Frontend Monitoring

1. **User Analytics**: Track user interactions and flows
2. **Performance Monitoring**: Monitor page load times and interactions
3. **Error Tracking**: Capture and analyze frontend errors
4. **A/B Testing**: Test UI variations for optimal user experience