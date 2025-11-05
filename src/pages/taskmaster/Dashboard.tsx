import React, { useState } from "react";
import { Card, Heading, Text, Button } from "@stellar/design-system";
import { useWallet } from "../../hooks/useWallet";
import TaskCreationForm from "../../components/taskmaster/TaskCreationForm";
import TaskList from "../../components/taskmaster/TaskList";
import TaskDetails from "./TaskDetails";
import { taskMasterService } from "../../services/taskmaster";
import { useParams, useNavigate } from "react-router-dom";

const Dashboard: React.FC = () => {
  const { address, signTransaction } = useWallet();
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId?: string }>();
  const [activeTab, setActiveTab] = useState<"tasks" | "create">("tasks");
  const [taskFilter, setTaskFilter] = useState<"all" | "created" | "assigned">(
    "all"
  );
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
        contractId: taskMasterService.client.options.contractId,
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
        console.log(
          "Contract might not be initialized, attempting initialization..."
        );
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
    // Initialize dashboard state from URL query parameters
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    const filterParam = params.get("filter");
    if (tabParam === "create") setActiveTab("create");
    if (filterParam === "created" || filterParam === "assigned")
      setTaskFilter(filterParam);
  }, []);

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
          <Heading as="h2" size="lg">
            TaskMaster Dashboard
          </Heading>
          <Text as="p" size="md" style={{ marginTop: "1rem" }}>
            Please connect your wallet to access the TaskMaster dashboard.
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <div className="container stack-6">
      <Card>
        <div style={{ padding: "var(--space-6)" }}>
          <Heading as="h1" size="xl">
            TaskMaster Dashboard
          </Heading>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "var(--space-4)",
              marginTop: "var(--space-6)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <Text as="p" size="sm">
                Platform Fees
              </Text>
              <Text as="p" size="lg" style={{ fontWeight: "bold" }}>
                {loadingFees
                  ? "Loading..."
                  : (Number(platformFees) / 10000000).toFixed(7)}{" "}
                XLM
              </Text>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleWithdrawFees}
                disabled={loadingFees || platformFees === 0n}
                style={{ marginTop: "var(--space-2)" }}
              >
                Withdraw Fees
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div
        style={{
          borderBottom:
            "1px solid color-mix(in oklab, var(--color-ink), white 88%)",
          marginBottom: "var(--space-4)",
        }}
      >
        <div style={{ display: "flex", gap: 0 }}>
          <Button
            variant={activeTab === "tasks" ? "primary" : "tertiary"}
            onClick={() => setActiveTab("tasks")}
            size="md"
            style={{ borderRadius: "var(--radius-md) var(--radius-md) 0 0" }}
          >
            Tasks
          </Button>
          <Button
            variant={activeTab === "create" ? "primary" : "tertiary"}
            onClick={() => setActiveTab("create")}
            size="md"
            style={{ borderRadius: "var(--radius-md) var(--radius-md) 0 0" }}
          >
            Create Task
          </Button>
        </div>
      </div>

      {activeTab === "tasks" && !taskId && (
        <div>
          <div
            style={{
              display: "flex",
              gap: "var(--space-2)",
              marginBottom: "var(--space-4)",
            }}
          >
            <Button
              size="sm"
              variant={taskFilter === "all" ? "primary" : "tertiary"}
              onClick={() => {
                setTaskFilter("all");
                const params = new URLSearchParams(window.location.search);
                params.delete("filter");
                navigate(
                  { pathname: "/taskmaster", search: params.toString() },
                  { replace: true }
                );
              }}
            >
              All Tasks
            </Button>
            <Button
              size="sm"
              variant={taskFilter === "created" ? "primary" : "tertiary"}
              onClick={() => {
                setTaskFilter("created");
                const params = new URLSearchParams(window.location.search);
                params.set("filter", "created");
                navigate(
                  { pathname: "/taskmaster", search: params.toString() },
                  { replace: true }
                );
              }}
            >
              Created
            </Button>
            <Button
              size="sm"
              variant={taskFilter === "assigned" ? "primary" : "tertiary"}
              onClick={() => {
                setTaskFilter("assigned");
                const params = new URLSearchParams(window.location.search);
                params.set("filter", "assigned");
                navigate(
                  { pathname: "/taskmaster", search: params.toString() },
                  { replace: true }
                );
              }}
            >
              Assigned
            </Button>
          </div>

          <TaskList filter={taskFilter} />
        </div>
      )}

      {activeTab === "create" && !taskId && (
        <div style={{ marginTop: "var(--space-4)" }}>
          <TaskCreationForm onTaskCreated={handleTaskCreated} />
        </div>
      )}

      {taskId && (
        <div style={{ marginTop: "var(--space-4)" }}>
          <TaskDetails />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
