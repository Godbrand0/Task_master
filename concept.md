# TaskMaster: Decentralized Task Management on Stellar

TaskMaster is a decentralized task management application built on the Stellar blockchain that enables users to create tasks, fund them with cryptocurrency, assign them to other users, and securely release payments upon task completion.

## 🌟 Features

- **Task Creation**: Create detailed tasks with descriptions, GitHub links, and deadlines
- **Funding Mechanism**: Fund tasks with cryptocurrency (e.g., $5) held in escrow
- **Assignment System**: Assign tasks to users using their Stellar addresses
- **Dual-Signature Release**: Two-signature system for secure fund release
- **Task Dashboard**: View created tasks and assigned tasks separately
- **Completion Tracking**: Mark tasks as complete with wallet signature
- **Refund System**: Cancel tasks and receive refunds
- **Expiration Handling**: Automatic handling of expired tasks with reassignment or refund options

## 🏗️ Architecture

### Smart Contract Layer

The TaskMaster smart contract manages all on-chain operations:

```rust
// Core data structures
struct Task {
    uint256 id;              // Unique identifier
    string title;            // Task title
    string description;      // Detailed description
    string githubLink;       // Optional GitHub repository link
    uint256 funding;         // Amount funded (in lumens)
    uint256 deadline;        // Unix timestamp for deadline
    address creator;         // Address of the task creator
    address assignee;        // Address of assigned user
    bool isCompleted;        // Completion status
    bool fundsReleased;      // Fund release status
    uint256 createdAt;       // Creation timestamp
    uint256 completedAt;     // Completion timestamp
    bool creatorApproved;    // Creator's approval flag
    bool assigneeApproved;   // Assignee's completion flag
}
```

### Frontend Architecture

The frontend is built with modern TypeScript + React using Vite:

```
src/
├── components/           # Reusable UI components
│   ├── TaskCard.tsx     # Task display component
│   ├── TaskForm.tsx     # Task creation form
│   └── WalletConnect.tsx # Stellar wallet connection
├── pages/               # Application pages
│   ├── Dashboard.tsx    # Main dashboard
│   ├── MyTasks.tsx      # User's created tasks
│   └── AssignedTasks.tsx # Tasks assigned to user
├── hooks/               # Custom React hooks
│   ├── useStellar.ts    # Stellar blockchain interactions
│   └── useTasks.ts      # Task management logic
├── services/            # API and blockchain services
│   ├── stellarService.ts # Stellar-specific operations
│   └── taskService.ts   # Task management operations
└── utils/               # Utility functions
    └── constants.ts      # Application constants
```

## 🚀 Tech Stack

### Blockchain Layer
- **Stellar**: Fast, low-cost blockchain for transactions
- **Rust**: Smart contract language compiled to WebAssembly
- **Stellar Wallet Kit**: Wallet integration for user authentication

### Frontend Layer
- **React**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and development server
- **CSS Modules**: Scoped styling approach

### Development Tools
- **Scaffold Stellar**: Framework for rapid dApp development
- **ESLint**: Code linting
- **Prettier**: Code formatting

## 📋 User Flow

### Task Creator Flow
1. Connect Stellar wallet
2. Navigate to "Create Task" page
3. Fill task details:
   - Task title
   - Detailed description
   - GitHub repository link (optional)
   - Deadline date and time
   - Funding amount (e.g., $5 equivalent in lumens)
   - Assignee's Stellar address
4. Sign transaction to create and fund the task
5. Monitor task progress in "My Tasks" dashboard
6. Review completed task and release funds

### Task Assignee Flow
1. Connect Stellar wallet
2. View assigned tasks in "Assigned Tasks" page
3. Work on the assigned task
4. Mark task as complete when finished
5. Sign transaction to confirm completion
6. Wait for creator's approval and fund release

### Task Lifecycle
1. **Created**: Task is created and funded by the creator
2. **Assigned**: Task is assigned to a specific user
3. **In Progress**: Assignee is working on the task
4. **Completed**: Assignee marks task as complete (first signature)
5. **Approved**: Creator reviews and approves completion (second signature)
6. **Funds Released**: Payment is released to assignee
7. **Expired**: Task passes deadline without completion
8. **Cancelled**: Creator cancels task and receives refund

## 🔐 Security Features

### Dual-Signature System
- **Assignee Signature**: Confirms task completion
- **Creator Signature**: Confirms satisfaction with work
- Both signatures required for fund release

### Escrow Mechanism
- Funds are locked in smart contract until both parties approve
- Prevents premature fund release
- Ensures fair compensation for completed work

### Deadline Management
- Automatic expiration handling
- Refund or reassignment options for expired tasks
- Clear timestamp tracking for all operations

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Stellar wallet (Freighter, Albedo, etc.)

### Local Development
```bash
# Clone the repository
git clone https://github.com/your-username/TaskMaster.git
cd TaskMaster

# Install dependencies
npm install

# Start the development server
npm run dev

# Deploy smart contract to testnet
npm run deploy:contract
```

### Environment Configuration
Create a `.env` file in the root directory:
```
VITE_STELLAR_NETWORK="testnet"
VITE_CONTRACT_ADDRESS="your_contract_address"
VITE_STELLAR_HORIZON_URL="https://horizon-testnet.stellar.org"
```

## 📱 Key Components

### Task Creation Form
- Title input field
- Description textarea
- GitHub link input (optional)
- Date and time picker for deadline
- Funding amount input
- Assignee address input
- Submit button with wallet signing

### Task Dashboard
- List of created tasks with status indicators
- Filtering and sorting options
- Quick actions (view, cancel, refund)
- Fund release buttons for completed tasks

### Assigned Tasks Page
- List of tasks assigned to current user
- Task details and deadlines
- Completion confirmation buttons
- Progress tracking

### Wallet Integration
- Stellar Wallet Kit integration
- Multi-wallet support
- Transaction signing interface
- Balance display

## 🎯 Hackathon Requirements

This project fulfills all Scaffold Stellar hackathon requirements:

1. **Deployed Smart Contract**: Rust-based contract compiled to WebAssembly
2. **Front End**: Modern TypeScript + React interface built with Vite
3. **Stellar Wallet Kit Integration**: Seamless wallet connection and transaction signing

## 🔮 Future Enhancements

- **Task Categories**: Organize tasks by type or project
- **Reputation System**: Build trust scores for reliable task completion
- **Dispute Resolution**: Mediation system for task disagreements
- **Recurring Tasks**: Support for repeated task creation
- **Team Management**: Create and manage task teams
- **Analytics Dashboard**: Track task completion rates and earnings
- **Mobile App**: Native mobile application for on-the-go task management

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📞 Support

For support, please contact us at support@taskmaster.io or create an issue in our GitHub repository.