import {
  Client,
  Task as ContractTask,
  TaskStatus as ContractTaskStatus,
} from "../contracts/src";
import {
  TASKMASTER_CONTRACT_ID,
  NATIVE_TOKEN_CONTRACT_ID,
  NETWORK_PASSPHRASE,
  Task,
  TaskStatus,
} from "../util/contract";
import { UserProfile, TaskApplication } from "../types/user";

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
  configureWallet(
    publicKey: string,
    signTransaction?: (xdr: string, opts?: {
      networkPassphrase?: string;
      address?: string;
      path?: string;
      submit?: boolean;
      submitUrl?: string;
    }) => Promise<{
      signedTxXdr: string;
      signerAddress?: string;
    }>
  ) {
    this.client.options.publicKey = publicKey;
    
    if (!signTransaction) {
      console.error("No signTransaction function provided");
      return;
    }
    
    // Create a wrapper function that extracts the signedTxXdr from the response
    this.client.options.signTransaction = async (xdr: string, opts?: {
      networkPassphrase?: string;
      address?: string;
      path?: string;
      submit?: boolean;
      submitUrl?: string;
    }) => {
      const result = await signTransaction(xdr, opts);
      if (!result) {
        throw new Error("Sign transaction returned undefined");
      }
      return {
        signedTxXdr: result!.signedTxXdr,
        signerAddress: result!.signerAddress
      };
    };
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
    console.log("Converting contract task:", contractTask);
    
    const task = {
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
      applications: contractTask.applications || []
    };
    
    console.log("Converted task:", task);
    return task;
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

  // Register a user profile
  async registerUser(
    address: string,
    username: string,
  ) {
    console.log("Registering user with params:", {
      address,
      username
    });
    
    const tx = await this.client.register_user({
      user: address,
      username: username,
    });

    console.log("register_user transaction created:", tx);
    
    // Sign and send the transaction
    const result = await tx.signAndSend();
    
    console.log("register_user result:", result);
    return result;
  }

  // Get user profile
  async getUserProfile(address: string): Promise<UserProfile | null> {
    console.log("Getting user profile for:", address);
    
    try {
      const tx = await this.client.get_user_profile({
        user: address,
      });
      
      console.log("get_user_profile transaction:", tx);
      
      // Simulate the transaction to get the result
      const simResult = await tx.simulate();
      console.log("get_user_profile simulation result:", simResult);
      console.log("get_user_profile simulation result:", simResult);
      console.log("Simulation result keys:", Object.keys(simResult));
      console.log("Simulation result type:", typeof simResult);
      
      // Extract the actual result from simulation
      if (simResult.result) {
        const profileData = simResult.result;
        console.log("Profile data from simulation:", profileData);
        
        const profile = {
          address: profileData.address || address,
          username: profileData.username,
          created_at: Number(profileData.created_at)
        };
        
        console.log("User profile:", profile);
      
        return profile;
      }
      
      return null;
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  }

  // Apply for a task
  async applyForTask(
    taskId: number,
    applicant: string,
    message: string,
  ) {
    console.log("Applying for task with params:", {
      taskId,
      applicant,
      message
    });
    
    const tx = await this.client.apply_for_task({
      task_id: BigInt(taskId),
      applicant: applicant,
      message: message,
    });

    console.log("apply_for_task transaction created:", tx);
    
    // Sign and send the transaction
    const result = await tx.signAndSend();

    console.log("apply_for_task result:", result);
    return result;
  }

  // Get task applications
  async getTaskApplications(taskId: number): Promise<TaskApplication[]> {
    console.log("Getting applications for task:", taskId);
    
    try {
      const result = await this.client.get_task_applications({
        task_id: BigInt(taskId),
      });
      
      console.log("get_task_applications result:", result);
      
      if (result.result) {
        return result.result.map((app: { applicant: string; message: string; applied_at: bigint }) => ({
          applicant: app.applicant,
          message: app.message,
          applied_at: Number(app.applied_at)
        }));
      }
      
      return [];
    } catch (error) {
      console.error("Error getting task applications:", error);
      return [];
    }
  }

  // Assign task to applicant
  async assignToApplicant(
    taskId: number,
    creator: string,
    applicant: string,
  ) {
    console.log("Assigning task to applicant with params:", {
      taskId,
      creator,
      applicant
    });
    
    const tx = await this.client.assign_to_applicant({
      task_id: BigInt(taskId),
      creator: creator,
      applicant: applicant,
    });

    console.log("assign_to_applicant transaction created:", tx);
    
    // Sign and send the transaction
    const result = await tx.signAndSend();

    console.log("assign_to_applicant result:", result);
    return result;
  }

  // Create a new task
  async createTask(
    title: string,
    description: string,
    githubLink: string,
    fundingAmount: bigint,
    deadline: number,
    creator: string,
  ) {
    console.log("Creating task with params:", {
      creator,
      title,
      description,
      githubLink,
      fundingAmount: fundingAmount.toString(),
      deadline
    });
    
    const tx = await this.client.create_task({
      creator: creator,
      title: title,
      description: description,
      github_link: githubLink,
      funding_amount: fundingAmount,
      deadline: BigInt(deadline),
    });

    console.log("create_task transaction created:", tx);
    
    // Sign and send the transaction
    const result = await tx.signAndSend();

    console.log("create_task result:", result);
    return result;
  }

  // Assign a task to a user
  async assignTask(
    taskId: number,
    creator: string,
    assignee: string,
  ) {
    console.log("Assigning task with params:", {
      taskId,
      creator,
      assignee
    });
    
    const tx = await this.client.reassign_task({
      task_id: BigInt(taskId),
      creator: creator,
      new_assignee: assignee,
    });

    console.log("assign_task transaction created:", tx);
    
    // Sign and send the transaction
    const result = await tx.signAndSend();

    console.log("assign_task result:", result);
    return result;
  }

  // Start a task
  async startTask(taskId: number, assignee: string) {
    const tx = await this.client.start_task({
      assignee: assignee,
      task_id: BigInt(taskId),
    });

    console.log("start_task transaction created:", tx);
    
    // Sign and send the transaction
    const result = await tx.signAndSend();

    console.log("start_task result:", result);
    return result;
  }

  // Complete a task
  async completeTask(taskId: number, assignee: string) {
    const tx = await this.client.complete_task({
      assignee: assignee,
      task_id: BigInt(taskId),
    });

    console.log("complete_task transaction created:", tx);
    
    // Sign and send the transaction
    const result = await tx.signAndSend();

    console.log("complete_task result:", result);
    return result;
  }

  // Release funds
  async releaseFunds(taskId: number, creator: string) {
    const tx = await this.client.release_funds({
      creator: creator,
      task_id: BigInt(taskId),
    });

    console.log("release_funds transaction created:", tx);
    
    // Sign and send the transaction
    const result = await tx.signAndSend();

    console.log("release_funds result:", result);
    return result;
  }

  // Cancel a task
  async cancelTask(taskId: number, creator: string) {
    const tx = await this.client.cancel_task({
      creator: creator,
      task_id: BigInt(taskId),
    });

    console.log("cancel_task transaction created:", tx);
    
    // Sign and send the transaction
    const result = await tx.signAndSend();

    console.log("cancel_task result:", result);
    return result;
  }

  // Mark task as expired
  async markExpired(taskId: number) {
    const tx = await this.client.mark_expired({
      task_id: BigInt(taskId),
    });

    console.log("mark_expired transaction created:", tx);
    
    // Sign and send the transaction
    const result = await tx.signAndSend();

    console.log("mark_expired result:", result);
    return result;
  }

  // Reclaim expired funds
  async reclaimExpiredFunds(taskId: number, creator: string) {
    const tx = await this.client.reclaim_expired_funds({
      creator: creator,
      task_id: BigInt(taskId),
    });

    console.log("reclaim_expired_funds transaction created:", tx);
    
    // Sign and send the transaction
    const result = await tx.signAndSend();

    console.log("reclaim_expired_funds result:", result);
    return result;
  }

  // Reassign task
  async reassignTask(taskId: number, creator: string, newAssignee: string) {
    const tx = await this.client.reassign_task({
      creator: creator,
      task_id: BigInt(taskId),
      new_assignee: newAssignee,
    });

    console.log("reassign_task transaction created:", tx);
    
    // Sign and send the transaction
    const result = await tx.signAndSend();

    console.log("reassign_task result:", result);
    return result;
  }

  // Get task details
  async getTask(taskId: number): Promise<Task | null> {
    console.log(`Fetching task ${taskId} from contract:`, {
      contractId: this.contractId,
      networkPassphrase: this.client.options.networkPassphrase,
      rpcUrl: this.client.options.rpcUrl
    });
    
    try {
      const result = await this.client.get_task({
        task_id: BigInt(taskId),
      });

      console.log(`Raw task ${taskId} result:`, result);

      if (result.result) {
        const convertedTask = this.convertTask(result.result);
        console.log(`Converted task ${taskId}:`, convertedTask);
        return convertedTask;
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
          // We'll use individual regex patterns to extract each field
          
          // Try to extract funding amount from the error message
          // The error message format might be different, so try multiple patterns
          let fundingAmount = 0n;
          
          // Pattern 1: Standard JSON format
          let fundingMatch = errorStr.match(/"funding_amount":\s*"([^"]+)"/);
          if (!fundingMatch) {
            // Pattern 2: Number format without quotes
            fundingMatch = errorStr.match(/"funding_amount":\s*(\d+)/);
          }
          if (!fundingMatch) {
            // Pattern 3: Look for any number after funding_amount
            fundingMatch = errorStr.match(/funding_amount[^0-9]*([0-9]+)/);
          }
          
          if (fundingMatch) {
            try {
              fundingAmount = BigInt(fundingMatch[1]);
              console.log("Extracted funding_amount from error:", fundingAmount.toString());
            } catch (e) {
              console.warn("Failed to parse funding amount:", fundingMatch[1]);
            }
          }
          
          // Try to extract other fields from the error message with multiple patterns
          const extractField = (fieldName: string): string | undefined => {
            // Pattern 1: Standard JSON format with quotes
            let match = errorStr.match(new RegExp(`"${fieldName}":\\s*"([^"]+)"`));
            if (!match) {
              // Pattern 2: Number format without quotes
              match = errorStr.match(new RegExp(`"${fieldName}":\\s*([^,}\\s]+)`));
            }
            if (!match) {
              // Pattern 3: Look for field name followed by any content
              match = errorStr.match(new RegExp(`${fieldName}[^:]*:\\s*([^,}\\s]+)`));
            }
            return match ? match[1] : undefined;
          };
          
          const title = extractField("title") || `Task ${taskId}`;
          const description = extractField("description") || "Unable to load description";
          const creator = extractField("creator") || "";
          const assignee = extractField("assignee");
          const deadline = extractField("deadline");
          const created = extractField("created_at");
          
          // Extract status with special handling
          let statusTag = "Created";
          const statusMatch = errorStr.match(/"status":\s*\{[^}]*"tag":\s*"([^"]+)"/);
          if (statusMatch) {
            statusTag = statusMatch[1];
          }
          
          // Log what we found
          console.log("Extracted task data from error:", {
            title,
            description,
            creator,
            assignee,
            funding: fundingAmount.toString(),
            deadline,
            created,
            status: statusTag,
            githubLink
          });
          
          // Return the task object with extracted data
          return {
            id: taskId,
            title,
            description,
            github_link: githubLink,
            funding_amount: fundingAmount,
            deadline: deadline ? Number(deadline) : 0,
            creator,
            assignee,
            status: this.convertTaskStatus({ tag: statusTag as any, values: undefined }),
            created_at: created ? Number(created) : 0,
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
        return result.result.map((id: bigint) => Number(id));
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
        return result.result.map((id: bigint) => Number(id));
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
    const tx = await this.client.withdraw_platform_fees({
      deployer: publicKey,
    });

    console.log("withdraw_platform_fees transaction created:", tx);
    
    // Sign and send the transaction
    const result = await tx.signAndSend();

    console.log("withdraw_platform_fees result:", result);
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
