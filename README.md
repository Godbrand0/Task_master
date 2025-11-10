# Taskify — community Bounty Board on Stellar

Taskify is a community bounty board on Stellar (Soroban) built with scaffold stellar for seamless integration. It lets creators fund tasks, assign contributors, track progress, and release funds when work is completed, all on-stellar.

## What it solves

- Fragmented bounty workflows and manual payouts
- Low trust in off-chain "done" states
- Lack of transparent platform fees and auditability

## What you get in return

- On-chain settlement for completed work
- Transparent 3% platform fee and fee withdrawal for deployer
- A clean React dashboard for creating, tracking, and approving tasks

## Feature highlights

- Wallet connection and username registration
- Dashboard with stats and quick actions
- Create tasks with funding and deadlines
- Apply, assign, start, complete, approve, and release funds
- Expiration and fund reclaim for overdue tasks
- Optimistic UI updates (e.g., applicants count)

## Getting started

### Prerequisites

- Rust and Cargo
- Node.js 22+ and npm
- Stellar Scaffold CLI and Soroban environment

### Setup

- Clone this repository
- Copy environment variables: `cp .env.example .env`
- Set `PUBLIC_STELLAR_RPC_URL` to your RPC endpoint (default points to testnet)
- Set `PUBLIC_DEFAULT_DEPLOYER_ADDRESS` to the public key that will receive platform fees

### Install and run

- `npm install`
- `npm run dev`

This will concurrently watch contract changes and start the Vite dev server. Open the printed URL in a browser.

### Funding test accounts

- If running on testnet, use the Friendbot button in the header after connecting a wallet

## App walkthrough

### 1) Create a username

- Connect your wallet using the header button
- If you have no profile, you will see a modal prompting registration
- Choose a permanent username and submit; this calls `register_user` on-chain

### 2) Viewing the dashboard

- Overview tab shows total tasks, created by you, assigned to you, and completed counts
- Quick actions to create a task or jump to filtered task lists
- Stats auto-refresh on load and when your address changes

### 3) Creating tasks

- Open Create Task tab
- Provide title, description, optional GitHub link, funding amount, and deadline (unix timestamp)
- Submit to `create_task`; a 3% platform fee is tracked by the contract
- The task appears in lists and on the Overview stats

### 4) Applying for tasks

- Open Tasks tab and choose "All" or "Created by You"
- If you are not the creator and a task is in Created state, click Apply
- After signing, an alert confirms; the applicants counter increments immediately without reloading

### 5) Assigning a task

- As the creator, choose an applicant and click Assign Task
- The task moves to Assigned state

### 6) Starting and completing work

- Assignee clicks Start Task (Assigned -> InProgress)
- When done, click Complete Task (InProgress -> Completed)

### 7) Approving and releasing funds

- Creator reviews and clicks Approve & Release Funds (Completed -> Approved -> FundsReleased)
- Funds are released to the assignee; the platform fee remains withdrawable by deployer
- Note: Expired banner will not show once a task is Completed, Approved, or FundsReleased

### 8) Expiration and reclaim

- If a task passes its deadline without completion, it may be marked Expired
- Creator can reclaim expired funds

### 9) Cancellation and reassignment

- Creator can cancel active work (Assigned/InProgress) when necessary
- Creator can reassign an Expired task to a new assignee

## Task states and transitions

- Created: Task posted and funded, open to applications
- Assigned: Creator assigns task to a contributor
- InProgress: Assignee has started work
- Completed: Assignee marks work complete
- Approved: Creator has approved completion
- FundsReleased: Funds transferred to assignee
- Expired: Deadline passed without valid completion
- Cancelled: Task cancelled, funds returned to creator

## What appears where

- Task cards show title, funding, creator, assignee or applicants count, time remaining, and actions scoped to role and state
- Task details page shows the full description, repository link, timestamps, and action buttons
- Dashboard overview shows counts and total funding for your created tasks

## Example use cases

- Open-source project bounties: pay contributors for issues or features
- Internal team payouts: transparent and auditable settlement
- Hackathon tracks: milestone-driven payouts
- Community tasks: empower contributors with on-chain recognition and payment

## Development notes

- The React app is built with Vite and TypeScript
- Contract client is generated under `src/contracts/src` and wrapped by a service in `src/services/taskmaster.ts`
- Tailwind v4 is used via "@tailwindcss/postcss"; core CSS entry imports `src/index.css`

## Key files

- Frontend entry: `src/main.tsx`
- App shell and routes: `src/App.tsx`
- Dashboard page: `src/pages/taskmaster/Dashboard.tsx`
- Task details page: `src/pages/taskmaster/TaskDetails.tsx`
- Task list and cards: `src/components/taskmaster/TaskList.tsx`, `src/components/taskmaster/TaskCard.tsx`
- Contract service: `src/services/taskmaster.ts`
- Wallet provider and hooks: `src/providers/WalletProvider.tsx`, `src/hooks/useWallet.ts`

## Environment configuration

- `PUBLIC_STELLAR_RPC_URL`: RPC endpoint (defaults to testnet)
- `PUBLIC_DEFAULT_DEPLOYER_ADDRESS`: address that withdraws platform fees
- `NETWORK_PASSPHRASE`: set via utilities in `src/util/contract.ts`

## Troubleshooting

- If CSS fails to build with PostCSS, ensure "@tailwindcss/postcss" and "tailwindcss" v4 are installed and that `postcss.config.mjs` includes "@tailwindcss/postcss"
- Husky pre-commit hooks enforce lint; you can bypass with "--no-verify" but fix lints before CI
- Dev-mode strict effects may cause double fetch; the dashboard guards against overlapping fetches

## License

- MIT (see `LICENSE`)
