import React, { useState, useEffect, useCallback } from "react";
import { Heading, Text, Button } from "@stellar/design-system";
import { useWallet } from "../../hooks/useWallet";
import { TaskStatus } from "../../util/contract";
import TaskCreationForm from "../../components/taskmaster/TaskCreationForm";
import TaskList from "../../components/taskmaster/TaskList";
import TaskDetails from "./TaskDetails";
import { UsernameRegistrationModal } from "../../components/taskmaster/UsernameRegistrationModal";
import { taskMasterService } from "../../services/taskmaster";
import { useParams, useNavigate } from "react-router-dom";

interface DashboardStats {
  totalTasks: number;
  createdTasks: number;
  assignedTasks: number;
  completedTasks: number;
  totalFunding: bigint;
}

const Dashboard: React.FC = () => {
  const { address, signTransaction, userProfile, isProfileLoading } = useWallet();
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId?: string }>();
  
  // Check if contract was already initialized for this address
  const getIsInitialized = () => {
    const key = `contract_initialized_${address}`;
    return localStorage.getItem(key) === 'true';
  };
  
  const setIsInitialized = (value: boolean) => {
    const key = `contract_initialized_${address}`;
    localStorage.setItem(key, value.toString());
  };
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "create">("overview");
  const [taskFilter, setTaskFilter] = useState<"all" | "created" | "assigned">("all");
  const [platformFees, setPlatformFees] = useState<bigint>(0n);
  const [loadingFees, setLoadingFees] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    createdTasks: 0,
    assignedTasks: 0,
    completedTasks: 0,
    totalFunding: 0n,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  const loadPlatformFees = useCallback(async () => {
    if (!address) return;

    try {
      setLoadingFees(true);
      const fees = await taskMasterService.getPlatformFees();
      setPlatformFees(fees);
    } catch (error) {
      console.error("Error loading platform fees:", error);
    } finally {
      setLoadingFees(false);
    }
  }, [address]);

  const loadDashboardStats = useCallback(async () => {
    if (!address) return;

    try {
      setLoadingStats(true);
      
      // Get task counts
      let totalTasks = 0;
      let createdTasks = 0;
      let assignedTasks = 0;
      let completedTasks = 0;
      let totalFunding = 0n;

      try {
        const created = await taskMasterService.getUserTasks(address);
        createdTasks = created.length;
        
        // Get funding amounts for created tasks
        for (const taskId of created) {
          const task = await taskMasterService.getTask(taskId);
          if (task) {
            totalFunding += task.funding_amount;
            if (task.status === TaskStatus.Completed || task.status === TaskStatus.Approved || task.status === TaskStatus.FundsReleased) {
              completedTasks++;
            }
          }
        }
      } catch {
        console.error("Error loading created tasks");
      }

      try {
        const assigned = await taskMasterService.getAssignedTasks(address);
        assignedTasks = assigned.length;
      } catch {
        console.error("Error loading assigned tasks");
      }

      try {
        const totalCount = await taskMasterService.getTaskCount();
        totalTasks = totalCount;
      } catch {
        console.error("Error loading total task count");
      }

      setStats({
        totalTasks,
        createdTasks,
        assignedTasks,
        completedTasks,
        totalFunding,
      });
    } catch {
      console.error("Error loading dashboard stats");
    } finally {
      setLoadingStats(false);
    }
  }, [address]);

  const initializeContract = useCallback(async () => {
    if (!address) return;

    try {
      // Configure client with wallet credentials - with proper check
      if (signTransaction) {
        taskMasterService.configureWallet(address, signTransaction);
      } else {
        console.error("No signTransaction function available");
        alert("Wallet not properly connected. Please reconnect your wallet.");
        return;
      }

      // First check if contract is already initialized by getting task count
      try {
        await taskMasterService.getTaskCount();
        console.log("Contract is already initialized");
        return;
      } catch (error) {
        console.log("Contract might not be initialized, attempting initialization...");
      }

      await taskMasterService.initialize();
      console.log("Contract initialized successfully");
    } catch (error) {
      console.error("Error initializing contract:", error);
      if (error instanceof Error && error.message.includes("AlreadyExists")) {
        console.log("Contract already initialized");
      } else {
        console.error("Contract initialization failed:", error);
      }
    }
  }, [address, signTransaction]);

  const handleTaskCreated = () => {
    setActiveTab("tasks");
    setTaskFilter("created");
    void loadDashboardStats(); // Refresh stats
    window.location.reload();
  };

  const handleWithdrawFees = async () => {
    if (!address) return;

    try {
      // Configure client with wallet credentials - with proper check
      if (signTransaction) {
        taskMasterService.configureWallet(address, signTransaction);
      } else {
        console.error("No signTransaction function available");
        alert("Wallet not properly connected. Please reconnect your wallet.");
        return;
      }
      const result = await taskMasterService.withdrawPlatformFees(address);

      if (result) {
        alert("Platform fees withdrawn successfully!");
        void loadPlatformFees();
      }
    } catch (error) {
      console.error("Error withdrawing platform fees:", error);
      alert("Failed to withdraw platform fees. Please try again.");
    }
  };

  const handleApplyForTask = async (taskId: number) => {
    if (!address) {
      alert("Please connect your wallet to apply for a task.");
      return;
    }

    if (!userProfile) {
      setShowRegistrationModal(true);
      return;
    }

    try {
      if (signTransaction) {
        taskMasterService.configureWallet(address, signTransaction);
      } else {
        console.error("No signTransaction function available");
        alert("Wallet not properly connected. Please reconnect your wallet.");
        return;
      }
      
      await taskMasterService.applyForTask(taskId, address, "I'm interested in this task!");
      alert("You have successfully applied for the task!");
      // Optionally, refresh the task list or specific task
      window.location.reload();
    } catch (error) {
      console.error("Error applying for task:", error);
      alert("Failed to apply for the task. Please try again.");
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    const filterParam = params.get("filter");
    if (tabParam === "create") setActiveTab("create");
    else if (tabParam === "tasks") setActiveTab("tasks");
    if (filterParam === "created" || filterParam === "assigned")
      setTaskFilter(filterParam);
  }, []);

  useEffect(() => {
    console.log("Dashboard useEffect triggered - address:", address);
    if (address && !getIsInitialized()) {
      console.log("Initializing contract and loading data...");
      void initializeContract().then(() => {
        void loadPlatformFees();
        void loadDashboardStats();
        // Mark as initialized after successful initialization
        setIsInitialized(true);
      }).catch((error) => {
        console.error("Contract initialization failed:", error);
        // Still mark as initialized attempt to prevent repeated attempts
        setIsInitialized(true);
      });
    }
  }, [address]); // Only depend on address, not on callback functions

  // Reset initialization flag when address changes
  useEffect(() => {
    return () => {
      if (address) {
        const key = `contract_initialized_${address}`;
        localStorage.removeItem(key);
      }
    };
  }, [address]);

  useEffect(() => {
    console.log("Modal check - address:", address, "userProfile:", userProfile, "isProfileLoading:", isProfileLoading);
    // Show modal if we have an address but no profile AND we're not currently loading
    if (address && !userProfile && !isProfileLoading) {
      console.log("Showing registration modal - no profile found");
      setShowRegistrationModal(true);
    } else if (userProfile) {
      console.log("Hiding registration modal - profile exists:", userProfile.username);
      setShowRegistrationModal(false);
    }
  }, [address, userProfile, isProfileLoading]);

  if (!address) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4 bg-white rounded-lg shadow p-6">
          <div className="p-6 text-center">
            <Heading as="h2" size="lg" className="mb-4">
              TaskMaster Dashboard
            </Heading>
            <Text as="p" size="md" className="text-gray-600">
              Please connect your wallet to access the TaskMaster dashboard.
            </Text>
          </div>
        </div>
      </div>
    );
  }

  const formatAmount = (amount: bigint) => {
    return (Number(amount) / 10000000).toFixed(7);
  };

  const StatCard = ({ title, value, subtitle, isLoading }: { 
    title: string; 
    value: string | number; 
    subtitle?: string;
    isLoading?: boolean;
  }) => (
    <div className="bg-white rounded-lg shadow p-4">
      <Text as="p" size="sm" className="text-gray-600 mb-1">{title}</Text>
      {isLoading ? (
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
      ) : (
        <>
          <Text as="p" size="xl" className="font-bold text-gray-900">{value}</Text>
          {subtitle && <Text as="p" size="sm" className="text-gray-500">{subtitle}</Text>}
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <Heading as="h1" size="xl" className="text-gray-900">
              TaskMaster Dashboard
            </Heading>
            <Text as="p" size="md" className="text-gray-600 mt-2">
              Manage your tasks and bounties on the Stellar network
            </Text>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "overview"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("tasks")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "tasks"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "create"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Create Task
            </button>
            {!userProfile && (
              <button
                onClick={() => setShowRegistrationModal(true)}
                className="py-4 px-1 border-b-2 font-medium text-sm border-transparent text-orange-500 hover:text-orange-600"
              >
                Register Username
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && !taskId && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Total Tasks" 
                value={stats.totalTasks} 
                isLoading={loadingStats}
              />
              <StatCard 
                title="Created by You" 
                value={stats.createdTasks} 
                isLoading={loadingStats}
              />
              <StatCard 
                title="Assigned to You" 
                value={stats.assignedTasks} 
                isLoading={loadingStats}
              />
              <StatCard 
                title="Completed" 
                value={stats.completedTasks} 
                isLoading={loadingStats}
              />
            </div>

            {/* Platform Fees and Funding */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <Heading as="h3" size="md" className="mb-4">Platform Fees</Heading>
                <div className="space-y-4">
                  <div>
                    <Text as="p" size="sm" className="text-gray-600">Available Fees</Text>
                    {loadingFees ? (
                      <div className="h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
                    ) : (
                      <Text as="p" size="lg" className="font-bold">
                        {formatAmount(platformFees)} XLM
                      </Text>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => void handleWithdrawFees()}
                    disabled={loadingFees || platformFees === 0n}
                    size="sm"
                  >
                    Withdraw Fees
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <Heading as="h3" size="md" className="mb-4">Total Funding</Heading>
                <div>
                  <Text as="p" size="sm" className="text-gray-600">Your Created Tasks</Text>
                  {loadingStats ? (
                    <div className="h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
                  ) : (
                    <Text as="p" size="lg" className="font-bold">
                      {formatAmount(stats.totalFunding)} XLM
                    </Text>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <Heading as="h3" size="md" className="mb-4">Quick Actions</Heading>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setActiveTab("create")} variant="primary" size="md">
                  Create New Task
                </Button>
                <Button variant="secondary" onClick={() => setActiveTab("tasks")} size="md">
                  View All Tasks
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setActiveTab("tasks");
                    setTaskFilter("created");
                  }}
                  size="md"
                >
                  My Created Tasks
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setActiveTab("tasks");
                    setTaskFilter("assigned");
                  }}
                  size="md"
                >
                  My Assigned Tasks
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === "tasks" && !taskId && (
          <div>
            {/* Filter Pills */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setTaskFilter("all");
                    const params = new URLSearchParams(window.location.search);
                    params.delete("filter");
                    navigate(
                      { pathname: "/taskmaster", search: params.toString() },
                      { replace: true }
                    );
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    taskFilter === "all"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All Tasks
                </button>
                <button
                  onClick={() => {
                    setTaskFilter("created");
                    const params = new URLSearchParams(window.location.search);
                    params.set("filter", "created");
                    navigate(
                      { pathname: "/taskmaster", search: params.toString() },
                      { replace: true }
                    );
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    taskFilter === "created"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Created by You
                </button>
                <button
                  onClick={() => {
                    setTaskFilter("assigned");
                    const params = new URLSearchParams(window.location.search);
                    params.set("filter", "assigned");
                    navigate(
                      { pathname: "/taskmaster", search: params.toString() },
                      { replace: true }
                    );
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    taskFilter === "assigned"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Assigned to You
                </button>
              </div>
            </div>

            <TaskList filter={taskFilter} onApplyForTask={handleApplyForTask} />
          </div>
        )}

        {/* Create Task Tab */}
        {activeTab === "create" && !taskId && (
          <TaskCreationForm onTaskCreated={handleTaskCreated} />
        )}

        {/* Task Details */}
        {taskId && (
          <div className="mt-4">
            <TaskDetails />
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {showRegistrationModal && (
        <UsernameRegistrationModal
          isOpen={showRegistrationModal}
          onClose={() => setShowRegistrationModal(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
