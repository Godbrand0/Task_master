import { Buffer } from "buffer";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Spec as ContractSpec,
} from '@stellar/stellar-sdk/contract';
import type {
  u64,
  i128,
  Option,
} from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk'
export * as contract from '@stellar/stellar-sdk/contract'
export * as rpc from '@stellar/stellar-sdk/rpc'

if (typeof window !== 'undefined') {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CCUSVPOGVKXGS6WMRWLGE2TXU4JQJLRDYJL5WMYHMINQP3X3NR22NOHJ",
  }
} as const

export type TaskStatus = {tag: "Created", values: void} | {tag: "Assigned", values: void} | {tag: "InProgress", values: void} | {tag: "Completed", values: void} | {tag: "Approved", values: void} | {tag: "FundsReleased", values: void} | {tag: "Expired", values: void} | {tag: "Cancelled", values: void};


export interface UserProfile {
  address: string;
  created_at: u64;
  username: string;
}


export interface TaskApplication {
  applicant: string;
  applied_at: u64;
  message: string;
  username: string;
}


export interface Task {
  applications: TaskApplication[];
  assignee: Option<string>;
  assignee_approved: boolean;
  completed_at: Option<u64>;
  created_at: u64;
  creator: string;
  creator_approved: boolean;
  deadline: u64;
  description: string;
  funding_amount: i128;
  github_link: string;
  id: u64;
  status: TaskStatus;
  title: string;
}

export interface Client {
  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initialize the contract with token address
   * 
   * # Arguments
   * * `token` - Address of the token contract for payments
   * * `deployer` - Address of the contract deployer who will receive platform fees
   */
  initialize: ({token, deployer}: {token: string, deployer: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a register_user transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Register a user profile with a permanent username
   * 
   * # Arguments
   * * `user` - Address of the user
   * * `username` - Permanent username for the user
   */
  register_user: ({user, username}: {user: string, username: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_user_profile transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get user profile by address
   * 
   * # Arguments
   * * `user` - Address of the user
   * 
   * # Returns
   * The user profile if exists
   */
  get_user_profile: ({user}: {user: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Option<UserProfile>>>

  /**
   * Construct and simulate a apply_for_task transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Apply for a task
   * 
   * # Arguments
   * * `applicant` - Address of the applicant
   * * `task_id` - ID of the task to apply for
   * * `message` - Optional application message
   */
  apply_for_task: ({applicant, task_id, message}: {applicant: string, task_id: u64, message: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_task_applications transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get all applications for a task
   * 
   * # Arguments
   * * `task_id` - ID of the task
   * 
   * # Returns
   * Vector of all applications for the task
   */
  get_task_applications: ({task_id}: {task_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<TaskApplication[]>>

  /**
   * Construct and simulate a assign_to_applicant transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Assign a task to an applicant
   * 
   * # Arguments
   * * `creator` - Address of the task creator
   * * `task_id` - ID of the task
   * * `applicant` - Address of the applicant to assign
   */
  assign_to_applicant: ({creator, task_id, applicant}: {creator: string, task_id: u64, applicant: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a create_task transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Create a new task with funding (without assigning)
   * 
   * # Arguments
   * * `creator` - Address of the task creator
   * * `title` - Task title
   * * `description` - Detailed description of the task
   * * `github_link` - GitHub repository link (can be empty string)
   * * `funding_amount` - Amount to fund the task (in stroops)
   * * `deadline` - Unix timestamp for the task deadline
   * 
   * # Returns
   * The ID of the newly created task
   */
  create_task: ({creator, title, description, github_link, funding_amount, deadline}: {creator: string, title: string, description: string, github_link: string, funding_amount: i128, deadline: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a assign_task transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Assign a task to a user (only if not already assigned)
   * 
   * # Arguments
   * * `creator` - Address of the task creator
   * * `task_id` - ID of the task to assign
   * * `assignee` - Address of the user to assign the task to
   */
  assign_task: ({creator, task_id, assignee}: {creator: string, task_id: u64, assignee: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a complete_task transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Mark a task as complete by the assignee
   * 
   * # Arguments
   * * `assignee` - Address of the assignee
   * * `task_id` - ID of the task to complete
   */
  complete_task: ({assignee, task_id}: {assignee: string, task_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a start_task transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Update task status to InProgress
   * 
   * # Arguments
   * * `assignee` - Address of the assignee
   * * `task_id` - ID of the task to start
   */
  start_task: ({assignee, task_id}: {assignee: string, task_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a release_funds transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Release funds to the assignee after creator approval
   * 
   * # Arguments
   * * `creator` - Address of the task creator
   * * `task_id` - ID of the task to release funds for
   */
  release_funds: ({creator, task_id}: {creator: string, task_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a cancel_task transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Cancel a task and refund the creator
   * 
   * # Arguments
   * * `creator` - Address of the task creator
   * * `task_id` - ID of the task to cancel
   */
  cancel_task: ({creator, task_id}: {creator: string, task_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a mark_expired transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Handle expired tasks - mark as expired
   * 
   * # Arguments
   * * `task_id` - ID of the expired task
   */
  mark_expired: ({task_id}: {task_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a reclaim_expired_funds transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Reclaim funds from expired task
   * 
   * # Arguments
   * * `creator` - Address of the task creator
   * * `task_id` - ID of the expired task
   */
  reclaim_expired_funds: ({creator, task_id}: {creator: string, task_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a withdraw_platform_fees transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Withdraw accumulated platform fees (only deployer can call)
   * 
   * # Arguments
   * * `deployer` - Address of the contract deployer
   */
  withdraw_platform_fees: ({deployer}: {deployer: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_platform_fees transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get current accumulated platform fees
   * 
   * # Returns
   * The total amount of accumulated platform fees
   */
  get_platform_fees: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a reassign_task transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Reassign an expired task to a new assignee
   * 
   * # Arguments
   * * `creator` - Address of the task creator
   * * `task_id` - ID of the task to reassign
   * * `new_assignee` - Address of the new assignee
   */
  reassign_task: ({creator, task_id, new_assignee}: {creator: string, task_id: u64, new_assignee: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_task transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get task details by ID
   * 
   * # Arguments
   * * `task_id` - ID of the task to retrieve
   * 
   * # Returns
   * The task details
   */
  get_task: ({task_id}: {task_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Task>>

  /**
   * Construct and simulate a get_user_tasks transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get all tasks created by a user
   * 
   * # Arguments
   * * `user` - Address of the user
   * 
   * # Returns
   * Vector of task IDs created by the user
   */
  get_user_tasks: ({user}: {user: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u64[]>>

  /**
   * Construct and simulate a get_assigned_tasks transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get all tasks assigned to a user
   * 
   * # Arguments
   * * `user` - Address of the user
   * 
   * # Returns
   * Vector of task IDs assigned to the user
   */
  get_assigned_tasks: ({user}: {user: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u64[]>>

  /**
   * Construct and simulate a get_task_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get total number of tasks
   */
  get_task_count: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u64>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAgAAAAAAAAAAAAAAClRhc2tTdGF0dXMAAAAAAAgAAAAAAAAAAAAAAAdDcmVhdGVkAAAAAAAAAAAAAAAACEFzc2lnbmVkAAAAAAAAAAAAAAAKSW5Qcm9ncmVzcwAAAAAAAAAAAAAAAAAJQ29tcGxldGVkAAAAAAAAAAAAAAAAAAAIQXBwcm92ZWQAAAAAAAAAAAAAAA1GdW5kc1JlbGVhc2VkAAAAAAAAAAAAAAAAAAAHRXhwaXJlZAAAAAAAAAAAAAAAAAlDYW5jZWxsZWQAAAA=",
        "AAAAAQAAAAAAAAAAAAAAC1VzZXJQcm9maWxlAAAAAAMAAAAAAAAAB2FkZHJlc3MAAAAAEwAAAAAAAAAKY3JlYXRlZF9hdAAAAAAABgAAAAAAAAAIdXNlcm5hbWUAAAAQ",
        "AAAAAQAAAAAAAAAAAAAAD1Rhc2tBcHBsaWNhdGlvbgAAAAAEAAAAAAAAAAlhcHBsaWNhbnQAAAAAAAATAAAAAAAAAAphcHBsaWVkX2F0AAAAAAAGAAAAAAAAAAdtZXNzYWdlAAAAABAAAAAAAAAACHVzZXJuYW1lAAAAEA==",
        "AAAAAQAAAAAAAAAAAAAABFRhc2sAAAAOAAAAAAAAAAxhcHBsaWNhdGlvbnMAAAPqAAAH0AAAAA9UYXNrQXBwbGljYXRpb24AAAAAAAAAAAhhc3NpZ25lZQAAA+gAAAATAAAAAAAAABFhc3NpZ25lZV9hcHByb3ZlZAAAAAAAAAEAAAAAAAAADGNvbXBsZXRlZF9hdAAAA+gAAAAGAAAAAAAAAApjcmVhdGVkX2F0AAAAAAAGAAAAAAAAAAdjcmVhdG9yAAAAABMAAAAAAAAAEGNyZWF0b3JfYXBwcm92ZWQAAAABAAAAAAAAAAhkZWFkbGluZQAAAAYAAAAAAAAAC2Rlc2NyaXB0aW9uAAAAABAAAAAAAAAADmZ1bmRpbmdfYW1vdW50AAAAAAALAAAAAAAAAAtnaXRodWJfbGluawAAAAAQAAAAAAAAAAJpZAAAAAAABgAAAAAAAAAGc3RhdHVzAAAAAAfQAAAAClRhc2tTdGF0dXMAAAAAAAAAAAAFdGl0bGUAAAAAAAAQ",
        "AAAAAAAAAL1Jbml0aWFsaXplIHRoZSBjb250cmFjdCB3aXRoIHRva2VuIGFkZHJlc3MKCiMgQXJndW1lbnRzCiogYHRva2VuYCAtIEFkZHJlc3Mgb2YgdGhlIHRva2VuIGNvbnRyYWN0IGZvciBwYXltZW50cwoqIGBkZXBsb3llcmAgLSBBZGRyZXNzIG9mIHRoZSBjb250cmFjdCBkZXBsb3llciB3aG8gd2lsbCByZWNlaXZlIHBsYXRmb3JtIGZlZXMAAAAAAAAKaW5pdGlhbGl6ZQAAAAAAAgAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAAAAAAhkZXBsb3llcgAAABMAAAAA",
        "AAAAAAAAAIxSZWdpc3RlciBhIHVzZXIgcHJvZmlsZSB3aXRoIGEgcGVybWFuZW50IHVzZXJuYW1lCgojIEFyZ3VtZW50cwoqIGB1c2VyYCAtIEFkZHJlc3Mgb2YgdGhlIHVzZXIKKiBgdXNlcm5hbWVgIC0gUGVybWFuZW50IHVzZXJuYW1lIGZvciB0aGUgdXNlcgAAAA1yZWdpc3Rlcl91c2VyAAAAAAAAAgAAAAAAAAAEdXNlcgAAABMAAAAAAAAACHVzZXJuYW1lAAAAEAAAAAA=",
        "AAAAAAAAAG1HZXQgdXNlciBwcm9maWxlIGJ5IGFkZHJlc3MKCiMgQXJndW1lbnRzCiogYHVzZXJgIC0gQWRkcmVzcyBvZiB0aGUgdXNlcgoKIyBSZXR1cm5zClRoZSB1c2VyIHByb2ZpbGUgaWYgZXhpc3RzAAAAAAAAEGdldF91c2VyX3Byb2ZpbGUAAAABAAAAAAAAAAR1c2VyAAAAEwAAAAEAAAPoAAAH0AAAAAtVc2VyUHJvZmlsZQA=",
        "AAAAAAAAAJtBcHBseSBmb3IgYSB0YXNrCgojIEFyZ3VtZW50cwoqIGBhcHBsaWNhbnRgIC0gQWRkcmVzcyBvZiB0aGUgYXBwbGljYW50CiogYHRhc2tfaWRgIC0gSUQgb2YgdGhlIHRhc2sgdG8gYXBwbHkgZm9yCiogYG1lc3NhZ2VgIC0gT3B0aW9uYWwgYXBwbGljYXRpb24gbWVzc2FnZQAAAAAOYXBwbHlfZm9yX3Rhc2sAAAAAAAMAAAAAAAAACWFwcGxpY2FudAAAAAAAABMAAAAAAAAAB3Rhc2tfaWQAAAAABgAAAAAAAAAHbWVzc2FnZQAAAAAQAAAAAA==",
        "AAAAAAAAAHxHZXQgYWxsIGFwcGxpY2F0aW9ucyBmb3IgYSB0YXNrCgojIEFyZ3VtZW50cwoqIGB0YXNrX2lkYCAtIElEIG9mIHRoZSB0YXNrCgojIFJldHVybnMKVmVjdG9yIG9mIGFsbCBhcHBsaWNhdGlvbnMgZm9yIHRoZSB0YXNrAAAAFWdldF90YXNrX2FwcGxpY2F0aW9ucwAAAAAAAAEAAAAAAAAAB3Rhc2tfaWQAAAAABgAAAAEAAAPqAAAH0AAAAA9UYXNrQXBwbGljYXRpb24A",
        "AAAAAAAAAKRBc3NpZ24gYSB0YXNrIHRvIGFuIGFwcGxpY2FudAoKIyBBcmd1bWVudHMKKiBgY3JlYXRvcmAgLSBBZGRyZXNzIG9mIHRoZSB0YXNrIGNyZWF0b3IKKiBgdGFza19pZGAgLSBJRCBvZiB0aGUgdGFzawoqIGBhcHBsaWNhbnRgIC0gQWRkcmVzcyBvZiB0aGUgYXBwbGljYW50IHRvIGFzc2lnbgAAABNhc3NpZ25fdG9fYXBwbGljYW50AAAAAAMAAAAAAAAAB2NyZWF0b3IAAAAAEwAAAAAAAAAHdGFza19pZAAAAAAGAAAAAAAAAAlhcHBsaWNhbnQAAAAAAAATAAAAAA==",
        "AAAAAAAAAYxDcmVhdGUgYSBuZXcgdGFzayB3aXRoIGZ1bmRpbmcgKHdpdGhvdXQgYXNzaWduaW5nKQoKIyBBcmd1bWVudHMKKiBgY3JlYXRvcmAgLSBBZGRyZXNzIG9mIHRoZSB0YXNrIGNyZWF0b3IKKiBgdGl0bGVgIC0gVGFzayB0aXRsZQoqIGBkZXNjcmlwdGlvbmAgLSBEZXRhaWxlZCBkZXNjcmlwdGlvbiBvZiB0aGUgdGFzawoqIGBnaXRodWJfbGlua2AgLSBHaXRIdWIgcmVwb3NpdG9yeSBsaW5rIChjYW4gYmUgZW1wdHkgc3RyaW5nKQoqIGBmdW5kaW5nX2Ftb3VudGAgLSBBbW91bnQgdG8gZnVuZCB0aGUgdGFzayAoaW4gc3Ryb29wcykKKiBgZGVhZGxpbmVgIC0gVW5peCB0aW1lc3RhbXAgZm9yIHRoZSB0YXNrIGRlYWRsaW5lCgojIFJldHVybnMKVGhlIElEIG9mIHRoZSBuZXdseSBjcmVhdGVkIHRhc2sAAAALY3JlYXRlX3Rhc2sAAAAABgAAAAAAAAAHY3JlYXRvcgAAAAATAAAAAAAAAAV0aXRsZQAAAAAAABAAAAAAAAAAC2Rlc2NyaXB0aW9uAAAAABAAAAAAAAAAC2dpdGh1Yl9saW5rAAAAABAAAAAAAAAADmZ1bmRpbmdfYW1vdW50AAAAAAALAAAAAAAAAAhkZWFkbGluZQAAAAYAAAABAAAABg==",
        "AAAAAAAAAM1Bc3NpZ24gYSB0YXNrIHRvIGEgdXNlciAob25seSBpZiBub3QgYWxyZWFkeSBhc3NpZ25lZCkKCiMgQXJndW1lbnRzCiogYGNyZWF0b3JgIC0gQWRkcmVzcyBvZiB0aGUgdGFzayBjcmVhdG9yCiogYHRhc2tfaWRgIC0gSUQgb2YgdGhlIHRhc2sgdG8gYXNzaWduCiogYGFzc2lnbmVlYCAtIEFkZHJlc3Mgb2YgdGhlIHVzZXIgdG8gYXNzaWduIHRoZSB0YXNrIHRvAAAAAAAAC2Fzc2lnbl90YXNrAAAAAAMAAAAAAAAAB2NyZWF0b3IAAAAAEwAAAAAAAAAHdGFza19pZAAAAAAGAAAAAAAAAAhhc3NpZ25lZQAAABMAAAAA",
        "AAAAAAAAAIRNYXJrIGEgdGFzayBhcyBjb21wbGV0ZSBieSB0aGUgYXNzaWduZWUKCiMgQXJndW1lbnRzCiogYGFzc2lnbmVlYCAtIEFkZHJlc3Mgb2YgdGhlIGFzc2lnbmVlCiogYHRhc2tfaWRgIC0gSUQgb2YgdGhlIHRhc2sgdG8gY29tcGxldGUAAAANY29tcGxldGVfdGFzawAAAAAAAAIAAAAAAAAACGFzc2lnbmVlAAAAEwAAAAAAAAAHdGFza19pZAAAAAAGAAAAAA==",
        "AAAAAAAAAHpVcGRhdGUgdGFzayBzdGF0dXMgdG8gSW5Qcm9ncmVzcwoKIyBBcmd1bWVudHMKKiBgYXNzaWduZWVgIC0gQWRkcmVzcyBvZiB0aGUgYXNzaWduZWUKKiBgdGFza19pZGAgLSBJRCBvZiB0aGUgdGFzayB0byBzdGFydAAAAAAACnN0YXJ0X3Rhc2sAAAAAAAIAAAAAAAAACGFzc2lnbmVlAAAAEwAAAAAAAAAHdGFza19pZAAAAAAGAAAAAA==",
        "AAAAAAAAAJ1SZWxlYXNlIGZ1bmRzIHRvIHRoZSBhc3NpZ25lZSBhZnRlciBjcmVhdG9yIGFwcHJvdmFsCgojIEFyZ3VtZW50cwoqIGBjcmVhdG9yYCAtIEFkZHJlc3Mgb2YgdGhlIHRhc2sgY3JlYXRvcgoqIGB0YXNrX2lkYCAtIElEIG9mIHRoZSB0YXNrIHRvIHJlbGVhc2UgZnVuZHMgZm9yAAAAAAAADXJlbGVhc2VfZnVuZHMAAAAAAAACAAAAAAAAAAdjcmVhdG9yAAAAABMAAAAAAAAAB3Rhc2tfaWQAAAAABgAAAAA=",
        "AAAAAAAAAIJDYW5jZWwgYSB0YXNrIGFuZCByZWZ1bmQgdGhlIGNyZWF0b3IKCiMgQXJndW1lbnRzCiogYGNyZWF0b3JgIC0gQWRkcmVzcyBvZiB0aGUgdGFzayBjcmVhdG9yCiogYHRhc2tfaWRgIC0gSUQgb2YgdGhlIHRhc2sgdG8gY2FuY2VsAAAAAAALY2FuY2VsX3Rhc2sAAAAAAgAAAAAAAAAHY3JlYXRvcgAAAAATAAAAAAAAAAd0YXNrX2lkAAAAAAYAAAAA",
        "AAAAAAAAAFhIYW5kbGUgZXhwaXJlZCB0YXNrcyAtIG1hcmsgYXMgZXhwaXJlZAoKIyBBcmd1bWVudHMKKiBgdGFza19pZGAgLSBJRCBvZiB0aGUgZXhwaXJlZCB0YXNrAAAADG1hcmtfZXhwaXJlZAAAAAEAAAAAAAAAB3Rhc2tfaWQAAAAABgAAAAA=",
        "AAAAAAAAAHtSZWNsYWltIGZ1bmRzIGZyb20gZXhwaXJlZCB0YXNrCgojIEFyZ3VtZW50cwoqIGBjcmVhdG9yYCAtIEFkZHJlc3Mgb2YgdGhlIHRhc2sgY3JlYXRvcgoqIGB0YXNrX2lkYCAtIElEIG9mIHRoZSBleHBpcmVkIHRhc2sAAAAAFXJlY2xhaW1fZXhwaXJlZF9mdW5kcwAAAAAAAAIAAAAAAAAAB2NyZWF0b3IAAAAAEwAAAAAAAAAHdGFza19pZAAAAAAGAAAAAA==",
        "AAAAAAAAAHhXaXRoZHJhdyBhY2N1bXVsYXRlZCBwbGF0Zm9ybSBmZWVzIChvbmx5IGRlcGxveWVyIGNhbiBjYWxsKQoKIyBBcmd1bWVudHMKKiBgZGVwbG95ZXJgIC0gQWRkcmVzcyBvZiB0aGUgY29udHJhY3QgZGVwbG95ZXIAAAAWd2l0aGRyYXdfcGxhdGZvcm1fZmVlcwAAAAAAAQAAAAAAAAAIZGVwbG95ZXIAAAATAAAAAA==",
        "AAAAAAAAAF5HZXQgY3VycmVudCBhY2N1bXVsYXRlZCBwbGF0Zm9ybSBmZWVzCgojIFJldHVybnMKVGhlIHRvdGFsIGFtb3VudCBvZiBhY2N1bXVsYXRlZCBwbGF0Zm9ybSBmZWVzAAAAAAARZ2V0X3BsYXRmb3JtX2ZlZXMAAAAAAAAAAAAAAQAAAAs=",
        "AAAAAAAAALlSZWFzc2lnbiBhbiBleHBpcmVkIHRhc2sgdG8gYSBuZXcgYXNzaWduZWUKCiMgQXJndW1lbnRzCiogYGNyZWF0b3JgIC0gQWRkcmVzcyBvZiB0aGUgdGFzayBjcmVhdG9yCiogYHRhc2tfaWRgIC0gSUQgb2YgdGhlIHRhc2sgdG8gcmVhc3NpZ24KKiBgbmV3X2Fzc2lnbmVlYCAtIEFkZHJlc3Mgb2YgdGhlIG5ldyBhc3NpZ25lZQAAAAAAAA1yZWFzc2lnbl90YXNrAAAAAAAAAwAAAAAAAAAHY3JlYXRvcgAAAAATAAAAAAAAAAd0YXNrX2lkAAAAAAYAAAAAAAAADG5ld19hc3NpZ25lZQAAABMAAAAA",
        "AAAAAAAAAGhHZXQgdGFzayBkZXRhaWxzIGJ5IElECgojIEFyZ3VtZW50cwoqIGB0YXNrX2lkYCAtIElEIG9mIHRoZSB0YXNrIHRvIHJldHJpZXZlCgojIFJldHVybnMKVGhlIHRhc2sgZGV0YWlscwAAAAhnZXRfdGFzawAAAAEAAAAAAAAAB3Rhc2tfaWQAAAAABgAAAAEAAAfQAAAABFRhc2s=",
        "AAAAAAAAAH1HZXQgYWxsIHRhc2tzIGNyZWF0ZWQgYnkgYSB1c2VyCgojIEFyZ3VtZW50cwoqIGB1c2VyYCAtIEFkZHJlc3Mgb2YgdGhlIHVzZXIKCiMgUmV0dXJucwpWZWN0b3Igb2YgdGFzayBJRHMgY3JlYXRlZCBieSB0aGUgdXNlcgAAAAAAAA5nZXRfdXNlcl90YXNrcwAAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAD6gAAAAY=",
        "AAAAAAAAAH9HZXQgYWxsIHRhc2tzIGFzc2lnbmVkIHRvIGEgdXNlcgoKIyBBcmd1bWVudHMKKiBgdXNlcmAgLSBBZGRyZXNzIG9mIHRoZSB1c2VyCgojIFJldHVybnMKVmVjdG9yIG9mIHRhc2sgSURzIGFzc2lnbmVkIHRvIHRoZSB1c2VyAAAAABJnZXRfYXNzaWduZWRfdGFza3MAAAAAAAEAAAAAAAAABHVzZXIAAAATAAAAAQAAA+oAAAAG",
        "AAAAAAAAABlHZXQgdG90YWwgbnVtYmVyIG9mIHRhc2tzAAAAAAAADmdldF90YXNrX2NvdW50AAAAAAAAAAAAAQAAAAY=" ]),
      options
    )
  }
  public readonly fromJSON = {
    initialize: this.txFromJSON<null>,
        register_user: this.txFromJSON<null>,
        get_user_profile: this.txFromJSON<Option<UserProfile>>,
        apply_for_task: this.txFromJSON<null>,
        get_task_applications: this.txFromJSON<TaskApplication[]>,
        assign_to_applicant: this.txFromJSON<null>,
        create_task: this.txFromJSON<u64>,
        assign_task: this.txFromJSON<null>,
        complete_task: this.txFromJSON<null>,
        start_task: this.txFromJSON<null>,
        release_funds: this.txFromJSON<null>,
        cancel_task: this.txFromJSON<null>,
        mark_expired: this.txFromJSON<null>,
        reclaim_expired_funds: this.txFromJSON<null>,
        withdraw_platform_fees: this.txFromJSON<null>,
        get_platform_fees: this.txFromJSON<i128>,
        reassign_task: this.txFromJSON<null>,
        get_task: this.txFromJSON<Task>,
        get_user_tasks: this.txFromJSON<u64[]>,
        get_assigned_tasks: this.txFromJSON<u64[]>,
        get_task_count: this.txFromJSON<u64>
  }
}