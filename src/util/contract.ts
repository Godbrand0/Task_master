/**
 * Shortens a contract ID string by keeping the first `prefixLength` characters,
 * an ellipsis, then the last `suffixLength` characters.
 * If ID is shorter than or equal to `prefixLength + suffixLength`, returns it unchanged.
 */
export function shortenContractId(
  id: string,
  prefixLength = 5,
  suffixLength = 4,
): string {
  if (id.length <= prefixLength + suffixLength) {
    return id;
  }
  const start = id.slice(0, prefixLength);
  const end = id.slice(-suffixLength);
  return `${start}…${end}`;
}

// TaskMaster Contract Configuration
export const TASKMASTER_CONTRACT_ID =
  "CD4BSP46PSOL7PDO4DTPXD3YVK4XDSR5J332T4RLR7AKLGYOMODX7JIK";
export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";

// Task Status enum matching the contract
export enum TaskStatus {
  Created = 0,
  Assigned = 1,
  InProgress = 2,
  Completed = 3,
  Approved = 4,
  FundsReleased = 5,
  Expired = 6,
  Cancelled = 7,
}

// Task interface matching the contract struct
export interface Task {
  id: number;
  title: string;
  description: string;
  github_link?: string;
  funding_amount: bigint;
  deadline: number;
  creator: string;
  assignee?: string;
  status: TaskStatus;
  created_at: number;
  completed_at?: number;
  creator_approved: boolean;
  assignee_approved: boolean;
}

// Helper function to convert status number to readable string
export function getTaskStatusString(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.Created:
      return "Created";
    case TaskStatus.Assigned:
      return "Assigned";
    case TaskStatus.InProgress:
      return "In Progress";
    case TaskStatus.Completed:
      return "Completed";
    case TaskStatus.Approved:
      return "Approved";
    case TaskStatus.FundsReleased:
      return "Funds Released";
    case TaskStatus.Expired:
      return "Expired";
    case TaskStatus.Cancelled:
      return "Cancelled";
    default:
      return "Unknown";
  }
}

// Helper function to check if task is expired
export function isTaskExpired(deadline: number): boolean {
  return Date.now() / 1000 > deadline;
}

// Helper function to format timestamp
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

// Helper function to format funding amount (from stroops to XLM)
export function formatFundingAmount(amount: bigint): string {
  const xlm = Number(amount) / 10000000; // Convert from stroops to XLM
  return `${xlm.toFixed(7)} XLM`;
}
