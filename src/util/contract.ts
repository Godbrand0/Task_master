/**
 * Shortens a contract ID string by keeping the first `prefixLength` characters,
 * an ellipsis, then the last `suffixLength` characters.
 * If the ID is shorter than or equal to `prefixLength + suffixLength`, returns it unchanged.
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

// Contract constants
export const TASKMASTER_CONTRACT_ID = import.meta.env.PUBLIC_TASKMASTER_CONTRACT_ID || 'CCERJXGUU6KOUQ5JTHFEEVSALW4BIUY54SV3JUWJJIDFRYKOTHE77ICZ';
export const NATIVE_TOKEN_CONTRACT_ID = import.meta.env.PUBLIC_NATIVE_TOKEN_CONTRACT_ID || 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
export const NETWORK_PASSPHRASE = import.meta.env.PUBLIC_STELLAR_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015';
export const rpcUrl = import.meta.env.PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org:443";
export const labPrefix = () => "https://laboratory.stellar.org";

// Task interfaces
export interface Task {
  id: number;
  title: string;
  description: string;
  github_link: string;  // Now a required field (can be empty string)
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

export enum TaskStatus {
  Created = 'Created',
  Assigned = 'Assigned',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Approved = 'Approved',
  FundsReleased = 'FundsReleased',
  Expired = 'Expired',
  Cancelled = 'Cancelled',
}
