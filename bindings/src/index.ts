import { Buffer } from "buffer";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type { u64, i128, Option } from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}

export type TaskStatus =
  | { tag: "Created"; values: void }
  | { tag: "Assigned"; values: void }
  | { tag: "InProgress"; values: void }
  | { tag: "Completed"; values: void }
  | { tag: "Approved"; values: void }
  | { tag: "FundsReleased"; values: void }
  | { tag: "Expired"; values: void }
  | { tag: "Cancelled"; values: void };

export interface Task {
  assignee: Option<string>;
  assignee_approved: boolean;
  completed_at: Option<u64>;
  created_at: u64;
  creator: string;
  creator_approved: boolean;
  deadline: u64;
  description: string;
  funding_amount: i128;
  github_link: Option<string>;
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
  initialize: (
    { token, deployer }: { token: string; deployer: string },
    options?: {
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
    },
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a create_task transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Create a new task with funding
   *
   * # Arguments
   * * `creator` - Address of the task creator
   * * `title` - Task title
   * * `description` - Detailed description of the task
   * * `github_link` - Optional GitHub repository link
   * * `funding_amount` - Amount to fund the task (in stroops)
   * * `deadline` - Unix timestamp for the task deadline
   * * `assignee` - Address of the assigned user
   *
   * # Returns
   * The ID of the newly created task
   */
  create_task: (
    {
      creator,
      title,
      description,
      github_link,
      funding_amount,
      deadline,
      assignee,
    }: {
      creator: string;
      title: string;
      description: string;
      github_link: Option<string>;
      funding_amount: i128;
      deadline: u64;
      assignee: string;
    },
    options?: {
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
    },
  ) => Promise<AssembledTransaction<u64>>;

  /**
   * Construct and simulate a complete_task transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Mark a task as complete by the assignee
   *
   * # Arguments
   * * `assignee` - Address of the assignee
   * * `task_id` - ID of the task to complete
   */
  complete_task: (
    { assignee, task_id }: { assignee: string; task_id: u64 },
    options?: {
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
    },
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a start_task transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Update task status to InProgress
   *
   * # Arguments
   * * `assignee` - Address of the assignee
   * * `task_id` - ID of the task to start
   */
  start_task: (
    { assignee, task_id }: { assignee: string; task_id: u64 },
    options?: {
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
    },
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a release_funds transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Release funds to the assignee after creator approval
   *
   * # Arguments
   * * `creator` - Address of the task creator
   * * `task_id` - ID of the task to release funds for
   */
  release_funds: (
    { creator, task_id }: { creator: string; task_id: u64 },
    options?: {
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
    },
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a cancel_task transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Cancel a task and refund the creator
   *
   * # Arguments
   * * `creator` - Address of the task creator
   * * `task_id` - ID of the task to cancel
   */
  cancel_task: (
    { creator, task_id }: { creator: string; task_id: u64 },
    options?: {
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
    },
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a mark_expired transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Handle expired tasks - mark as expired
   *
   * # Arguments
   * * `task_id` - ID of the expired task
   */
  mark_expired: (
    { task_id }: { task_id: u64 },
    options?: {
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
    },
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a reclaim_expired_funds transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Reclaim funds from expired task
   *
   * # Arguments
   * * `creator` - Address of the task creator
   * * `task_id` - ID of the expired task
   */
  reclaim_expired_funds: (
    { creator, task_id }: { creator: string; task_id: u64 },
    options?: {
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
    },
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a withdraw_platform_fees transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Withdraw accumulated platform fees (only deployer can call)
   *
   * # Arguments
   * * `deployer` - Address of the contract deployer
   */
  withdraw_platform_fees: (
    { deployer }: { deployer: string },
    options?: {
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
    },
  ) => Promise<AssembledTransaction<null>>;

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
  }) => Promise<AssembledTransaction<i128>>;

  /**
   * Construct and simulate a reassign_task transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Reassign an expired task to a new assignee
   *
   * # Arguments
   * * `creator` - Address of the task creator
   * * `task_id` - ID of the task to reassign
   * * `new_assignee` - Address of the new assignee
   */
  reassign_task: (
    {
      creator,
      task_id,
      new_assignee,
    }: { creator: string; task_id: u64; new_assignee: string },
    options?: {
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
    },
  ) => Promise<AssembledTransaction<null>>;

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
  get_task: (
    { task_id }: { task_id: u64 },
    options?: {
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
    },
  ) => Promise<AssembledTransaction<Task>>;

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
  get_user_tasks: (
    { user }: { user: string },
    options?: {
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
    },
  ) => Promise<AssembledTransaction<Array<u64>>>;

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
  get_assigned_tasks: (
    { user }: { user: string },
    options?: {
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
    },
  ) => Promise<AssembledTransaction<Array<u64>>>;

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
  }) => Promise<AssembledTransaction<u64>>;
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
      },
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options);
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([
        "AAAAAgAAAAAAAAAAAAAAClRhc2tTdGF0dXMAAAAAAAgAAAAAAAAAAAAAAAdDcmVhdGVkAAAAAAAAAAAAAAAACEFzc2lnbmVkAAAAAAAAAAAAAAAKSW5Qcm9ncmVzcwAAAAAAAAAAAAAAAAAJQ29tcGxldGVkAAAAAAAAAAAAAAAAAAAIQXBwcm92ZWQAAAAAAAAAAAAAAA1GdW5kc1JlbGVhc2VkAAAAAAAAAAAAAAAAAAAHRXhwaXJlZAAAAAAAAAAAAAAAAAlDYW5jZWxsZWQAAAA=",
        "AAAAAQAAAAAAAAAAAAAABFRhc2sAAAANAAAAAAAAAAhhc3NpZ25lZQAAA+gAAAATAAAAAAAAABFhc3NpZ25lZV9hcHByb3ZlZAAAAAAAAAEAAAAAAAAADGNvbXBsZXRlZF9hdAAAA+gAAAAGAAAAAAAAAApjcmVhdGVkX2F0AAAAAAAGAAAAAAAAAAdjcmVhdG9yAAAAABMAAAAAAAAAEGNyZWF0b3JfYXBwcm92ZWQAAAABAAAAAAAAAAhkZWFkbGluZQAAAAYAAAAAAAAAC2Rlc2NyaXB0aW9uAAAAABAAAAAAAAAADmZ1bmRpbmdfYW1vdW50AAAAAAALAAAAAAAAAAtnaXRodWJfbGluawAAAAPoAAAAEAAAAAAAAAACaWQAAAAAAAYAAAAAAAAABnN0YXR1cwAAAAAH0AAAAApUYXNrU3RhdHVzAAAAAAAAAAAABXRpdGxlAAAAAAAAEA==",
        "AAAAAAAAAL1Jbml0aWFsaXplIHRoZSBjb250cmFjdCB3aXRoIHRva2VuIGFkZHJlc3MKCiMgQXJndW1lbnRzCiogYHRva2VuYCAtIEFkZHJlc3Mgb2YgdGhlIHRva2VuIGNvbnRyYWN0IGZvciBwYXltZW50cwoqIGBkZXBsb3llcmAgLSBBZGRyZXNzIG9mIHRoZSBjb250cmFjdCBkZXBsb3llciB3aG8gd2lsbCByZWNlaXZlIHBsYXRmb3JtIGZlZXMAAAAAAAAKaW5pdGlhbGl6ZQAAAAAAAgAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAAAAAAhkZXBsb3llcgAAABMAAAAA",
        "AAAAAAAAAZdDcmVhdGUgYSBuZXcgdGFzayB3aXRoIGZ1bmRpbmcKCiMgQXJndW1lbnRzCiogYGNyZWF0b3JgIC0gQWRkcmVzcyBvZiB0aGUgdGFzayBjcmVhdG9yCiogYHRpdGxlYCAtIFRhc2sgdGl0bGUKKiBgZGVzY3JpcHRpb25gIC0gRGV0YWlsZWQgZGVzY3JpcHRpb24gb2YgdGhlIHRhc2sKKiBgZ2l0aHViX2xpbmtgIC0gT3B0aW9uYWwgR2l0SHViIHJlcG9zaXRvcnkgbGluawoqIGBmdW5kaW5nX2Ftb3VudGAgLSBBbW91bnQgdG8gZnVuZCB0aGUgdGFzayAoaW4gc3Ryb29wcykKKiBgZGVhZGxpbmVgIC0gVW5peCB0aW1lc3RhbXAgZm9yIHRoZSB0YXNrIGRlYWRsaW5lCiogYGFzc2lnbmVlYCAtIEFkZHJlc3Mgb2YgdGhlIGFzc2lnbmVkIHVzZXIKCiMgUmV0dXJucwpUaGUgSUQgb2YgdGhlIG5ld2x5IGNyZWF0ZWQgdGFzawAAAAALY3JlYXRlX3Rhc2sAAAAABwAAAAAAAAAHY3JlYXRvcgAAAAATAAAAAAAAAAV0aXRsZQAAAAAAABAAAAAAAAAAC2Rlc2NyaXB0aW9uAAAAABAAAAAAAAAAC2dpdGh1Yl9saW5rAAAAA+gAAAAQAAAAAAAAAA5mdW5kaW5nX2Ftb3VudAAAAAAACwAAAAAAAAAIZGVhZGxpbmUAAAAGAAAAAAAAAAhhc3NpZ25lZQAAABMAAAABAAAABg==",
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
        "AAAAAAAAABlHZXQgdG90YWwgbnVtYmVyIG9mIHRhc2tzAAAAAAAADmdldF90YXNrX2NvdW50AAAAAAAAAAAAAQAAAAY=",
      ]),
      options,
    );
  }
  public readonly fromJSON = {
    initialize: this.txFromJSON<null>,
    create_task: this.txFromJSON<u64>,
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
    get_user_tasks: this.txFromJSON<Array<u64>>,
    get_assigned_tasks: this.txFromJSON<Array<u64>>,
    get_task_count: this.txFromJSON<u64>,
  };
}
