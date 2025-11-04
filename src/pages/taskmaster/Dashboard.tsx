import React, { useState } from "react";
import { Card, Heading, Text, Button } from "@stellar/design-system";
import { useWallet } from "../../hooks/useWallet";
import TaskCreationForm from "../../components/taskmaster/TaskCreationForm";
import TaskList from "../../components/taskmaster/TaskList";
import TaskDetails from "./TaskDetails";
import { taskMasterService } from "../../services/taskmaster";
import { useParams } from "react-router-dom";

const Dashboard: React.FC = () => {
  const { address, signTransaction } = useWallet();
  const { taskId } = useParams<{ taskId?: string }>();
  const [activeTab, setActiveTab] = useState<"tasks" | "create">("tasks");
  const [taskFilter, setTaskFilter] = useState<"all" | "created" | "assigned">("all");
  const [platformFees, setPlatformFees] = useState<bigint>(0n);
  const [loadingFees, setLoadingFees] = useState(false);

  const loadPlatformFees = async () => {
    if (!address) return;
    
    try {
      setLoadingFees(true);
      
      // Debug logging
      console.log("Loading platform fees...");
      console.log("Contract ID:", taskMasterService.contractId);
      console.log("Client options:", {
        rpcUrl: taskMasterService.client.options.rpcUrl,
        networkPassphrase: taskMasterService.client.options.networkPassphrase,
        contractId: taskMasterService.client.options.contractId
      });
      
      const fees = await taskMasterService.getPlatformFees();
      console.log("Platform fees loaded:", fees.toString());
      setPlatformFees(fees);
    } catch (error) {
      console.error("Error loading platform fees:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
    } finally {
      setLoadingFees(false);
    }
  };

  const initializeContract = async () => {
    if (!address) return;
    
    try {
      console.log("Initializing contract with address:", address);
      
      // Configure client with wallet credentials
      taskMasterService.configureWallet(address, signTransaction);
      
      // First check if contract is already initialized by getting task count
      try {
        await taskMasterService.getTaskCount();
        console.log("Contract is already initialized");
        return;
      } catch (error) {
        // If we can't get task count, contract might not be initialized
        console.log("Contract might not be initialized, attempting initialization...");
      }
      
      // Initialize the contract with native token and deployer address
      await taskMasterService.initialize();
      
      console.log("Contract initialized successfully");
    } catch (error) {
      console.error("Error initializing contract:", error);
      // Check if it's already initialized
      if (error instanceof Error && error.message.includes("AlreadyExists")) {
        console.log("Contract already initialized");
      } else {
        console.error("Contract initialization failed:", error);
      }
    }
  };

  const handleTaskCreated = () => {
    // Switch to tasks tab to show the newly created task
    setActiveTab("tasks");
    setTaskFilter("created");
    // In a real app, you might want to refresh the task list
    window.location.reload();
  };

  const handleWithdrawFees = async () => {
    if (!address) return;
    
    try {
      // Configure client with wallet credentials
      taskMasterService.configureWallet(address, signTransaction);
      
      const tx = await taskMasterService.withdrawPlatformFees(address);
      
      const { result } = await tx.signAndSend();
      
      if (result) {
        alert("Platform fees withdrawn successfully!");
        loadPlatformFees(); // Refresh the fees display
      }
    } catch (error) {
      console.error("Error withdrawing platform fees:", error);
      alert("Failed to withdraw platform fees. Please try again.");
    }
  };

  React.useEffect(() => {
    if (address) {
      // First initialize the contract, then load platform fees
      initializeContract().then(() => {
        loadPlatformFees();
      });
    }
  }, [address]);

  if (!address) {
    return (
      <Card>
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <Heading as="h2" size="lg">TaskMaster Dashboard</Heading>
          <Text as="p" size="md" style={{ marginTop: "1rem" }}>
            Please connect your wallet to access the TaskMaster dashboard.
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <Card>
        <div style={{ padding: "1.5rem" }}>
          <Heading as="h1" size="xl">TaskMaster Dashboard</Heading>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: "1rem", 
            marginTop: "1.5rem" 
          }}>
            <div style={{ textAlign: "center" }}>
              <Text as="p" size="sm">Platform Fees</Text>
              <Text as="p" size="lg" style={{ fontWeight: "bold" }}>
                {loadingFees ? "Loading..." : (Number(platformFees) / 10000000).toFixed(7)} XLM
              </Text>
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={handleWithdrawFees}
                disabled={loadingFees || platformFees === 0n}
                style={{ marginTop: "0.5rem" }}
              >
                Withdraw Fees
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div style={{ borderBottom: "1px solid #e0e0e0", marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "0" }}>
          <Button
            variant={activeTab === "tasks" ? "primary" : "tertiary"}
            onClick={() => setActiveTab("tasks")}
            size="md"
            style={{ borderRadius: "0.5rem 0.5rem 0 0" }}
          >
            Tasks
          </Button>
          <Button
            variant={activeTab === "create" ? "primary" : "tertiary"}
            onClick={() => setActiveTab("create")}
            size="md"
            style={{ borderRadius: "0.5rem 0.5rem 0 0" }}
          >
            Create Task
          </Button>
        </div>
      </div>

      {activeTab === "tasks" && !taskId && (
        <div>
          <div style={{ marginBottom: "1rem" }}>
            <Text as="span" size="sm">Show:</Text>
            <Button
              size="sm"
              variant={taskFilter === "all" ? "primary" : "tertiary"}
              onClick={() => setTaskFilter("all")}
              style={{ marginLeft: "0.5rem" }}
            >
              All Tasks
            </Button>
            <Button
              size="sm"
              variant={taskFilter === "created" ? "primary" : "tertiary"}
              onClick={() => setTaskFilter("created")}
              style={{ marginLeft: "0.5rem" }}
            >
              Created
            </Button>
            <Button
              size="sm"
              variant={taskFilter === "assigned" ? "primary" : "tertiary"}
              onClick={() => setTaskFilter("assigned")}
              style={{ marginLeft: "0.5rem" }}
            >
              Assigned
            </Button>
          </div>
          
          <TaskList filter={taskFilter} />
        </div>
      )}

      {activeTab === "create" && !taskId && (
        <div style={{ marginTop: "1rem" }}>
          <TaskCreationForm onTaskCreated={handleTaskCreated} />
        </div>
      )}

      {taskId && (
        <div style={{ marginTop: "1rem" }}>
          <TaskDetails />
        </div>
      )}
    </div>
  );
};

export default Dashboard;