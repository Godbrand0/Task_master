import {} from "@stellar/stellar-sdk";
import {
  Client,
  Task as ContractTask,
  TaskStatus as ContractTaskStatus,
} from "bindings";
import {
  TASKMASTER_CONTRACT_ID,
  NETWORK_PASSPHRASE,
  Task,
  TaskStatus,
} from "../util/contract";

export class TaskMasterService {
  private contractId: string;
  private client: Client;

  constructor() {
    this.contractId = TASKMASTER_CONTRACT_ID;
    this.client = new Client({
      contractId: this.contractId,
      networkPassphrase: NETWORK_PASSPHRASE,
      rpcUrl: "https://soroban-testnet.stellar.org",
    });
  }

  // Helper function to convert contract TaskStatus to our TaskStatus enum
  private convertTaskStatus(status: ContractTaskStatus): TaskStatus {
    switch (status.tag) {
      case "Created":
        return TaskStatus.Created;
      case "Assigned":
        return TaskStatus.Assigned;
      case "InProgress":
        return TaskStatus.InProgress;
      case "Completed":
        return TaskStatus.Completed;
      case "Approved":
        return TaskStatus.Approved;
      case "FundsReleased":
        return TaskStatus.FundsReleased;
      case "Expired":
        return TaskStatus.Expired;
      case "Cancelled":
        return TaskStatus.Cancelled;
      default:
        return TaskStatus.Created;
    }
  }

  // Helper function to convert contract Task to our Task interface
  private convertTask(contractTask: ContractTask): Task {
    return {
      id: Number(contractTask.id),
      title: contractTask.title,
      description: contractTask.description,
      github_link: contractTask.github_link,
      funding_amount: BigInt(contractTask.funding_amount),
      deadline: Number(contractTask.deadline),
      creator: contractTask.creator,
      assignee: contractTask.assignee,
      status: this.convertTaskStatus(contractTask.status),
      created_at: Number(contractTask.created_at),
      completed_at: contractTask.completed_at
        ? Number(contractTask.completed_at)
        : undefined,
      creator_approved: contractTask.creator_approved,
      assignee_approved: contractTask.assignee_approved,
    };
  }

  // Initialize contract with token address and deployer
  async initialize(tokenAddress: string, deployerAddress: string) {
    const result = await this.client.initialize({
      token: tokenAddress,
      deployer: deployerAddress,
    });

    return result;
  }

  // Create a new task
  async createTask(
    title: string,
    description: string,
    githubLink: string | null,
    fundingAmount: bigint,
    deadline: number,
    assignee: string,
    creator: string,
  ) {
    const result = await this.client.create_task({
      creator: creator,
      title: title,
      description: description,
      github_link: githubLink || undefined,
      funding_amount: fundingAmount,
      deadline: BigInt(deadline),
      assignee: assignee,
    });

    return result;
  }

  // Start a task
  async startTask(taskId: number, assignee: string) {
    const result = await this.client.start_task({
      assignee: assignee,
      task_id: BigInt(taskId),
    });

    return result;
  }

  // Complete a task
  async completeTask(taskId: number, assignee: string) {
    const result = await this.client.complete_task({
      assignee: assignee,
      task_id: BigInt(taskId),
    });

    return result;
  }

  // Release funds
  async releaseFunds(taskId: number, creator: string) {
    const result = await this.client.release_funds({
      creator: creator,
      task_id: BigInt(taskId),
    });

    return result;
  }

  // Cancel a task
  async cancelTask(taskId: number, creator: string) {
    const result = await this.client.cancel_task({
      creator: creator,
      task_id: BigInt(taskId),
    });

    return result;
  }

  // Mark task as expired
  async markExpired(taskId: number) {
    const result = await this.client.mark_expired({
      task_id: BigInt(taskId),
    });

    return result;
  }

  // Reclaim expired funds
  async reclaimExpiredFunds(taskId: number, creator: string) {
    const result = await this.client.reclaim_expired_funds({
      creator: creator,
      task_id: BigInt(taskId),
    });

    return result;
  }

  // Reassign task
  async reassignTask(taskId: number, creator: string, newAssignee: string) {
    const result = await this.client.reassign_task({
      creator: creator,
      task_id: BigInt(taskId),
      new_assignee: newAssignee,
    });

    return result;
  }

  // Get task details
  async getTask(taskId: number): Promise<Task | null> {
    try {
      const result = await this.client.get_task({
        task_id: BigInt(taskId),
      });

      if (result.result) {
        return this.convertTask(result.result);
      }

      return null;
    } catch (error) {
      console.error("Error fetching task:", error);
      return null;
    }
  }

  // Get user tasks
  async getUserTasks(userAddress: string): Promise<number[]> {
    try {
      const result = await this.client.get_user_tasks({
        user: userAddress,
      });

      if (result.result) {
        return result.result.map((id) => Number(id));
      }

      return [];
    } catch (error) {
      console.error("Error fetching user tasks:", error);
      return [];
    }
  }

  // Get assigned tasks
  async getAssignedTasks(userAddress: string): Promise<number[]> {
    try {
      const result = await this.client.get_assigned_tasks({
        user: userAddress,
      });

      if (result.result) {
        return result.result.map((id) => Number(id));
      }

      return [];
    } catch (error) {
      console.error("Error fetching assigned tasks:", error);
      return [];
    }
  }

  // Get task count
  async getTaskCount(): Promise<number> {
    try {
      const result = await this.client.get_task_count();

      if (result.result) {
        return Number(result.result);
      }

      return 0;
    } catch (error) {
      console.error("Error fetching task count:", error);
      return 0;
    }
  }

  // Get platform fees
  async getPlatformFees(): Promise<bigint> {
    try {
      const result = await this.client.get_platform_fees();

      if (result.result) {
        return BigInt(result.result);
      }

      return 0n;
    } catch (error) {
      console.error("Error fetching platform fees:", error);
      return 0n;
    }
  }

  // Withdraw platform fees
  async withdrawPlatformFees(publicKey: string) {
    const result = await this.client.withdraw_platform_fees({
      deployer: publicKey,
    });

    return result;
  }

  // Calculate platform fee (3% of amount)
  calculatePlatformFee(amount: bigint): bigint {
    return (amount * 3n) / 100n;
  }

  // Calculate amount after platform fee deduction
  calculateAmountAfterFee(amount: bigint): bigint {
    const fee = this.calculatePlatformFee(amount);
    return amount - fee;
  }
}

// Export singleton instance
export const taskMasterService = new TaskMasterService();
