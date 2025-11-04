import {} from "@stellar/stellar-sdk";
import {
  Client,
  Task as ContractTask,
  TaskStatus as ContractTaskStatus,
} from "bindings";
import {
  TASKMASTER_CONTRACT_ID,
  NATIVE_TOKEN_CONTRACT_ID,
  NETWORK_PASSPHRASE,
  Task,
  TaskStatus,
} from "../util/contract";

export class TaskMasterService {
  public contractId: string;
  public client: Client;

  constructor() {
    this.contractId = TASKMASTER_CONTRACT_ID;
    this.client = new Client({
      contractId: this.contractId,
      networkPassphrase: NETWORK_PASSPHRASE,
      rpcUrl: import.meta.env.PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org:443",
    });
    
    console.log("TaskMasterService initialized with:", {
      contractId: this.contractId,
      networkPassphrase: NETWORK_PASSPHRASE,
      rpcUrl: import.meta.env.PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org:443"
    });
  }

  // Helper method to configure client with wallet credentials
  configureWallet(publicKey: string, signTransaction: any) {
    this.client.options.publicKey = publicKey;
    this.client.options.signTransaction = signTransaction;
    console.log("Client configured with wallet:", {
      publicKey,
      hasSignTransaction: !!signTransaction
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
      github_link: contractTask.github_link || "",  // Ensure it's always a string
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
  async initialize(tokenAddress?: string, deployerAddress?: string) {
    // Use default values if not provided
    const tokenAddr = tokenAddress || NATIVE_TOKEN_CONTRACT_ID;
    const deployerAddr = deployerAddress || (await this.getDefaultDeployer());
    
    const result = await this.client.initialize({
      token: tokenAddr,
      deployer: deployerAddr,
    });

    return result;
  }

  // Helper method to get default deployer address
  private async getDefaultDeployer(): Promise<string> {
    // In a real implementation, this might get the connected wallet's public key
    // For now, return a default value or throw an error if not configured
    const defaultDeployer = import.meta.env.PUBLIC_DEFAULT_DEPLOYER_ADDRESS;
    if (!defaultDeployer) {
      throw new Error("No deployer address provided and no default configured");
    }
    return defaultDeployer;
  }

  // Create a new task
  async createTask(
    title: string,
    description: string,
    githubLink: string,
    fundingAmount: bigint,
    deadline: number,
    assignee: string,
    creator: string,
  ) {
    console.log("Creating task with params:", {
      creator,
      title,
      description,
      githubLink,
      fundingAmount: fundingAmount.toString(),
      deadline,
      assignee
    });
    
    const result = await this.client.create_task({
      creator: creator,
      title: title,
      description: description,
      github_link: githubLink,
      funding_amount: fundingAmount,
      deadline: BigInt(deadline),
      assignee: assignee,
    });

    console.log("create_task result:", result);
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
      
      // Handle type parsing errors for github_link field
      if (error instanceof Error && error.message.includes("ScSpecType scSpecTypeOption was not string or symbol")) {
        console.warn("Type parsing error for github_link field. Attempting to extract from error message.");
        
        // Try to extract all task data from the error object
        try {
          const errorStr = error.message;
          
          // Extract github_link
          const githubMatch = errorStr.match(/"data": \[([\d,\s]+)\]/);
          let githubLink = "";
          if (githubMatch) {
            const bytes = githubMatch[1].split(',').map(Number);
            githubLink = Buffer.from(bytes).toString('utf8');
            console.log("Extracted github_link from error:", githubLink);
          }
          
          // Try to extract other task data from the error message
          // The error message contains the full task data in a structured format
          // We'll use a more comprehensive regex to extract all fields
          const taskDataMatch = errorStr.match(/\{[^}]+\}/);
          if (taskDataMatch) {
            try {
              // Parse the task data from the error message
              const taskDataStr = taskDataMatch[0];
              const taskData = JSON.parse(taskDataStr);
              
              // Convert to our Task interface
              return {
                id: Number(taskData.id),
                title: taskData.title,
                description: taskData.description,
                github_link: githubLink || taskData.github_link || "",
                funding_amount: BigInt(taskData.funding_amount),
                deadline: Number(taskData.deadline),
                creator: taskData.creator,
                assignee: taskData.assignee || undefined,
                status: this.convertTaskStatus(taskData.status),
                created_at: Number(taskData.created_at),
                completed_at: taskData.completed_at
                  ? Number(taskData.completed_at)
                  : undefined,
                creator_approved: taskData.creator_approved,
                assignee_approved: taskData.assignee_approved,
              };
            } catch (parseError) {
              console.error("Failed to parse task data from error:", parseError);
            }
          }
          
          // Try to extract funding amount from the error message
          const fundingMatch = errorStr.match(/"funding_amount":\s*"([^"]+)"/);
          let fundingAmount = 0n;
          if (fundingMatch) {
            fundingAmount = BigInt(fundingMatch[1]);
            console.log("Extracted funding_amount from error:", fundingAmount.toString());
          }
          
          // Try to extract other fields from the error message
          const titleMatch = errorStr.match(/"title":\s*"([^"]+)"/);
          const descriptionMatch = errorStr.match(/"description":\s*"([^"]+)"/);
          const creatorMatch = errorStr.match(/"creator":\s*"([^"]+)"/);
          const assigneeMatch = errorStr.match(/"assignee":\s*"([^"]+)"/);
          const deadlineMatch = errorStr.match(/"deadline":\s*([^"]+)"/);
          const createdMatch = errorStr.match(/"created_at":\s*([^"]+)"/);
          const statusMatch = errorStr.match(/"status":\s*\{[^}]+\}/);
          
          // Extract status tag
          let statusTag = "Created";
          if (statusMatch) {
            const statusStr = statusMatch[0];
            const tagMatch = statusStr.match(/"tag":\s*"([^"]+)"/);
            if (tagMatch) {
              statusTag = tagMatch[1];
            }
          }
          
          // If we can't get the data from the error, create a minimal task object
          return {
            id: taskId,
            title: titleMatch ? titleMatch[1] : "Task " + taskId,
            description: descriptionMatch ? descriptionMatch[1] : "Unable to load description",
            github_link: githubLink,
            funding_amount: fundingAmount,
            deadline: deadlineMatch ? Number(deadlineMatch[1]) : 0,
            creator: creatorMatch ? creatorMatch[1] : "",
            assignee: assigneeMatch ? assigneeMatch[1] : undefined,
            status: this.convertTaskStatus({ tag: statusTag as any, values: undefined }),
            created_at: createdMatch ? Number(createdMatch[1]) : 0,
            completed_at: undefined,
            creator_approved: false,
            assignee_approved: false,
          };
        } catch (extractError) {
          console.error("Failed to extract task data from error:", extractError);
          
          // Final fallback: return a minimal task object
          return {
            id: taskId,
            title: "Task " + taskId,
            description: "Unable to load description",
            github_link: "",
            funding_amount: 0n,
            deadline: 0,
            creator: "",
            assignee: undefined,
            status: TaskStatus.Created,
            created_at: 0,
            completed_at: undefined,
            creator_approved: false,
            assignee_approved: false,
          };
        }
      }
      
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
      console.log("Calling get_platform_fees on contract:", this.contractId);
      
      // First check if contract is accessible by checking task count
      try {
        const taskCount = await this.getTaskCount();
        console.log("Contract is accessible, task count:", taskCount);
      } catch (countError) {
        console.error("Contract is not accessible:", countError);
        throw new Error("Contract is not accessible. Please check if the contract is deployed and the contract ID is correct.");
      }
      
      const result = await this.client.get_platform_fees();
      console.log("get_platform_fees result:", result);

      if (result.result) {
        return BigInt(result.result);
      }

      return 0n;
    } catch (error) {
      console.error("Error fetching platform fees:", error);
      console.error("Contract details:", {
        contractId: this.contractId,
        networkPassphrase: this.client.options.networkPassphrase,
        rpcUrl: this.client.options.rpcUrl
      });
      
      // Check if contract is initialized
      if (error instanceof Error && error.message.includes("MissingValue")) {
        console.warn("Contract may not be initialized. Attempting to check contract state...");
        try {
          const taskCount = await this.getTaskCount();
          console.log("Contract is accessible, task count:", taskCount);
          
          // Try to check if contract has been initialized by checking if we can read other storage
          console.log("Attempting to check if contract is initialized...");
          // We can't directly check storage, but we can infer from the error
          throw new Error("Contract exists but may not be properly initialized. The PLATFORM_FEES storage key might not be set.");
        } catch (initError) {
          console.error("Contract appears to not be initialized:", initError);
          throw new Error("Contract is not properly initialized. Please deploy and initialize the contract first.");
        }
      }
      
      if (error instanceof Error && error.message.includes("non-existent contract function")) {
        console.error("Function does not exist in contract:", error);
        console.warn("The deployed contract appears to be an older version without get_platform_fees function. Returning default value.");
        // Return default value instead of throwing an error
        return 0n;
      }
      
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
