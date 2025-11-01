# TaskMaster Development Guide

This guide provides detailed instructions for setting up the development environment, understanding the codebase, and contributing to the TaskMaster project.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git
- Stellar wallet (Freighter, Albedo, or XBull)
- Rust (for smart contract development)
- Soroban CLI (Stellar's smart contract platform)

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/TaskMaster.git
cd TaskMaster
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install contract dependencies (if separate)
cd contract
cargo build
cd ..
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Stellar Configuration
VITE_STELLAR_NETWORK="testnet"
VITE_STELLAR_HORIZON_URL="https://horizon-testnet.stellar.org"
VITE_STELLAR_FUTURENET_URL="https://horizon-futurenet.stellar.org"

# Contract Configuration
VITE_CONTRACT_ADDRESS="your_deployed_contract_address"

# Application Configuration
VITE_APP_NAME="TaskMaster"
VITE_APP_VERSION="1.0.0"
```

### 4. Stellar Wallet Setup

1. Install Freighter browser extension
2. Create or import your wallet
3. Switch to Testnet network
4. Fund your testnet account using the Stellar faucet

## Project Structure

```
TaskMaster/
├── README.md                 # Project overview
├── ARCHITECTURE.md           # Technical architecture
├── DEVELOPMENT.md            # Development guide (this file)
├── CONTRIBUTING.md           # Contribution guidelines
├── LICENSE                   # Project license
├── .env.example              # Environment variables template
├── .gitignore               # Git ignore rules
├── package.json             # Frontend dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite build configuration
├── contract/                # Smart contract directory
│   ├── src/                 # Contract source code
│   ├── Cargo.toml           # Rust dependencies
│   └── .soroban/            # Soroban configuration
├── src/                     # Frontend source code
│   ├── components/          # React components
│   ├── pages/               # Application pages
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API and blockchain services
│   ├── store/               # State management
│   ├── utils/               # Utility functions
│   ├── styles/              # CSS and styling
│   ├── App.tsx              # Main application component
│   └── main.tsx             # Application entry point
├── public/                  # Static assets
└── tests/                   # Test files
```

## Development Workflow

### 1. Start Development Server

```bash
# Start frontend development server
npm run dev

# In a separate terminal, start contract watch mode (if applicable)
cd contract
cargo watch -x build
```

### 2. Smart Contract Development

#### Building the Contract

```bash
cd contract
cargo build --target wasm32-unknown-unknown --release
```

#### Deploying to Testnet

```bash
# Install Soroban CLI if not already installed
npm install -g @stellar/soroban-cli

# Deploy contract
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/taskmaster.wasm \
  --source testnet_account \
  --network testnet

# Note the deployed contract address and update your .env file
```

#### Testing the Contract

```bash
cd contract
cargo test
```

### 3. Frontend Development

#### Component Development

When creating new components:

1. Create component file in appropriate directory
2. Follow TypeScript best practices
3. Include proper prop types
4. Add component documentation

```typescript
// Example component structure
import React from 'react';
import { Task } from '../types/task';

interface TaskCardProps {
  task: Task;
  onComplete: (taskId: number) => void;
  onReleaseFunds: (taskId: number) => void;
}

/**
 * TaskCard component displays task information and provides actions
 * @param task - Task object to display
 * @param onComplete - Callback for task completion
 * @param onReleaseFunds - Callback for fund release
 */
export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onComplete, 
  onReleaseFunds 
}) => {
  return (
    <div className="task-card">
      {/* Component implementation */}
    </div>
  );
};
```

#### State Management

Using Redux Toolkit for state management:

```typescript
// Example slice definition
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Task } from '../types/task';
import { taskService } from '../services/taskService';

// Async thunk for fetching tasks
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (userAddress: string) => {
    return await taskService.getUserTasks(userAddress);
  }
);

// Task slice
const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    tasks: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    addTask: (state, action: PayloadAction<Task>) => {
      state.tasks.push(action.payload);
    },
    updateTask: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch tasks';
      });
  },
});

export const { addTask, updateTask } = taskSlice.actions;
export default taskSlice.reducer;
```

#### Stellar Integration

```typescript
// Stellar service example
import { WalletKit } from '@stellar/wallet-kit';
import { Server, TransactionBuilder, Networks, BASE_FEE } from 'stellar-sdk';

export class StellarService {
  private walletKit: WalletKit;
  private server: Server;
  private contractAddress: string;

  constructor(contractAddress: string, horizonUrl: string) {
    this.walletKit = new WalletKit({
      wallets: [
        { name: 'freighter', type: 'freighter' },
        { name: 'albedo', type: 'albedo' },
      ],
      network: 'TESTNET',
    });
    this.server = new Server(horizonUrl);
    this.contractAddress = contractAddress;
  }

  async connectWallet(): Promise<string> {
    const address = await this.walletKit.getAddress();
    return address;
  }

  async disconnectWallet(): Promise<void> {
    await this.walletKit.disconnect();
  }

  async getBalance(): Promise<string> {
    const address = await this.walletKit.getAddress();
    const account = await this.server.loadAccount(address);
    const balance = account.balances.find(b => b.asset_type === 'native');
    return balance ? balance.balance : '0';
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    return await this.walletKit.signTransaction(transaction);
  }
}
```

## Testing

### Frontend Testing

#### Unit Tests

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

#### Component Testing Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { TaskForm } from './TaskForm';

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('TaskForm', () => {
  test('renders form fields correctly', () => {
    renderWithProvider(<TaskForm onSubmit={jest.fn()} />);
    
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  test('submits form with valid data', async () => {
    const mockOnSubmit = jest.fn();
    renderWithProvider(<TaskForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Test Task' }
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Test Description' }
    });
    
    fireEvent.click(screen.getByText('Create Task'));
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      title: 'Test Task',
      description: 'Test Description',
    });
  });
});
```

### Smart Contract Testing

```bash
cd contract
cargo test
```

#### Contract Test Example

```rust
#[cfg(test)]
mod tests {
    use soroban_sdk::{Env, Address};
    use crate::{TaskMasterContract, TaskMasterContractClient};

    #[test]
    fn test_task_creation() {
        let env = Env::default();
        let contract_id = env.register_contract(None, TaskMasterContract);
        let client = TaskMasterContractClient::new(&env, &contract_id);
        
        let creator = Address::generate(&env);
        let assignee = Address::generate(&env);
        
        let task_id = client.create_task(
            &"Test Task".into_val(&env),
            &"Test Description".into_val(&env),
            &None.into_val(&env),
            &1000000.into_val(&env),
            &(env.ledger().timestamp() + 86400).into_val(&env),
            &assignee,
        );
        
        let task = client.get_task(&task_id);
        assert_eq!(task.title, "Test Task");
        assert_eq!(task.creator, creator);
        assert_eq!(task.assignee, Some(assignee));
    }
}
```

## Code Style and Guidelines

### TypeScript/React Guidelines

1. **Use TypeScript for all new code**
2. **Follow functional component patterns**
3. **Use hooks for state and side effects**
4. **Implement proper error boundaries**
5. **Add JSDoc comments for all public functions**
6. **Use CSS Modules for component styling**

### Rust Guidelines

1. **Follow Rust naming conventions**
2. **Use `rustfmt` for code formatting**
3. **Implement comprehensive error handling**
4. **Add documentation comments for all public functions**
5. **Write unit tests for all functions**

### Git Workflow

1. **Create feature branches from main**
2. **Use descriptive commit messages**
3. **Create pull requests for all changes**
4. **Ensure all tests pass before merging**
5. **Update documentation as needed**

## Common Issues and Solutions

### Wallet Connection Issues

**Problem**: Wallet connection fails
**Solution**: 
1. Check if wallet is installed and unlocked
2. Verify network configuration (testnet/mainnet)
3. Ensure wallet permissions are granted

### Contract Deployment Issues

**Problem**: Contract deployment fails
**Solution**:
1. Check if account has sufficient balance
2. Verify contract code compiles without errors
3. Ensure Soroban CLI is properly configured

### Transaction Signing Issues

**Problem**: Transaction signing fails
**Solution**:
1. Check if wallet is connected
2. Verify transaction parameters
3. Ensure user approves the transaction in wallet

## Performance Optimization

### Frontend Optimization

1. **Implement code splitting**
2. **Use React.memo for expensive components**
3. **Implement virtual scrolling for large lists**
4. **Optimize bundle size with tree shaking**

### Smart Contract Optimization

1. **Minimize storage operations**
2. **Use efficient data structures**
3. **Implement batch operations where possible**
4. **Optimize gas usage**

## Deployment

### Frontend Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Or deploy to Netlify
npm run deploy
```

### Smart Contract Deployment

```bash
# Deploy to testnet
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/taskmaster.wasm \
  --source testnet_account \
  --network testnet

# Deploy to mainnet (after thorough testing)
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/taskmaster.wasm \
  --source mainnet_account \
  --network mainnet
```

## Resources

- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Documentation](https://soroban.stellar.org/)
- [React Documentation](https://reactjs.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [Vite Documentation](https://vitejs.dev/)

## Getting Help

If you encounter issues or have questions:

1. Check the [Issues](https://github.com/your-username/TaskMaster/issues) page
2. Create a new issue with detailed information
3. Join our Discord community
4. Check the [FAQ](FAQ.md) for common questions