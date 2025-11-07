import React, { useState, useEffect } from "react";
import { Button, Text } from "@stellar/design-system";
import { useWallet } from "../../hooks/useWallet";
import { Task, TaskStatus, shortenContractId } from "../../util/contract";
import { taskMasterService } from "../../services/taskmaster";
import StatusBadge from "./StatusBadge";

interface TaskModalProps {
  taskId: number;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated?: () => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ taskId, isOpen, onClose, onTaskUpdated }) => {
  const { address, signTransaction } = useWallet();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadTask = async () => {
    try {
      setLoading(true);
      const taskData = await taskMasterService.getTask(taskId);
      setTask(taskData);
    } catch (error) {
      console.error("Error loading task:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && taskId) {
      void loadTask();
    }
  }, [isOpen, taskId, loadTask]);

  // Manage body scroll when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Disable scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scroll
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    
    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleAction = async (action: string) => {
    if (!address || !task) return;

    try {
      setActionLoading(action);
      
      // Configure client with wallet credentials - with proper check
      if (signTransaction) {
        taskMasterService.configureWallet(address, signTransaction);
      } else {
        console.error("No signTransaction function available");
        alert("Wallet not properly connected. Please reconnect your wallet.");
        return;
      }

      switch (action) {
        case "start":
          await taskMasterService.startTask(task.id, address);
          break;
        case "complete":
          await taskMasterService.completeTask(task.id, address);
          break;
        case "approve":
          await taskMasterService.releaseFunds(task.id, address);
          break;
        case "cancel":
          await taskMasterService.cancelTask(task.id, address);
          break;
        case "reclaim":
          await taskMasterService.reclaimExpiredFunds(task.id, address);
          break;
        case "reassign": {
          const newAssignee = prompt("Enter new assignee address:");
          if (newAssignee) {
            await taskMasterService.reassignTask(task.id, address, newAssignee);
          }
          break;
        }
      }

      await loadTask();
      onTaskUpdated?.();
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      alert(`Failed to ${action} task. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatAmount = (amount: bigint) => {
    return (Number(amount) / 10000000).toFixed(7);
  };

  if (!isOpen) {
    return null;
  }

  const isCreator = address === task?.creator;
  const isAssignee = address === task?.assignee;
  const isExpired = task ? Date.now() / 1000 > task.deadline : false;

  // Check if there are any actions available
  const hasActions = task && (
    (isAssignee && task.status === TaskStatus.Assigned && !isExpired) ||
    (isAssignee && task.status === TaskStatus.InProgress && !isExpired) ||
    (isCreator && task.status === TaskStatus.Completed) ||
    (isCreator && (task.status === TaskStatus.Assigned || task.status === TaskStatus.InProgress)) ||
    (isCreator && task.status === TaskStatus.Expired)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 bg-white flex items-start justify-between gap-4 relative">
          <div className="flex justify-between items-start w-full pr-10">
            <div className="flex-1">
              <h1 className="font-bebas text-4xl m-0 mb-2 uppercase">
                {loading ? "LOADING..." : task?.title.toUpperCase() || "TASK DETAILS"}
              </h1>
              {task && (
                <div className="mt-2">
                  <StatusBadge status={task.status} />
                </div>
              )}
            </div>
          </div>
          <button
            className="absolute top-6 right-6 bg-white border-2 border-gray-300 text-xl leading-none text-gray-900 cursor-pointer p-0 w-9 h-9 flex items-center justify-center rounded-full transition-all duration-120 z-10 hover:bg-gray-100 hover:border-gray-400 focus-visible:outline-3 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
          {loading ? (
            <div className="text-center p-8">
              <Text as="p" size="md">Loading task details...</Text>
            </div>
          ) : !task ? (
            <div className="text-center p-8">
              <Text as="p" size="md">Task not found.</Text>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Description Section */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="font-lora text-xl mt-0 mb-4 text-gray-900">
                  Description
                </h3>
                <Text as="p" size="md" className="leading-relaxed text-gray-900">
                  {task.description}
                </Text>
                
                {task.github_link && task.github_link !== "" && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <Text as="p" size="sm" className="mb-1 text-gray-500 font-semibold">
                      GitHub Repository
                    </Text>
                    <a
                      href={task.github_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 break-all text-decoration-none font-medium transition-colors duration-120 hover:text-blue-600 hover:underline opacity-80"
                    >
                      {task.github_link}
                    </a>
                  </div>
                )}
              </div>

              {/* Funding Details */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="font-lora text-xl mt-0 mb-4 text-gray-900">
                  Funding Details
                </h3>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                  <div className="p-3 bg-gray-50 rounded-md">
                    <Text as="p" size="xs" className="text-gray-500 uppercase tracking-wide mb-1">
                      Task ID
                    </Text>
                    <Text as="p" size="md" className="font-semibold">#{task.id}</Text>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <Text as="p" size="xs" className="text-gray-500 uppercase tracking-wide mb-1">
                      Funding Amount
                    </Text>
                    <Text as="p" size="md" className="font-semibold">
                      {formatAmount(task.funding_amount)} XLM
                    </Text>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <Text as="p" size="xs" className="text-gray-500 uppercase tracking-wide mb-1">
                      Platform Fee (3%)
                    </Text>
                    <Text as="p" size="md" className="font-semibold">
                      {formatAmount(task.funding_amount * 3n / 100n)} XLM
                    </Text>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <Text as="p" size="xs" className="text-gray-500 uppercase tracking-wide mb-1">
                      Assignee Receives
                    </Text>
                    <Text as="p" size="md" className="font-semibold">
                      {formatAmount(task.funding_amount * 97n / 100n)} XLM
                    </Text>
                  </div>
                </div>
              </div>

              {/* Task Information */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="font-lora text-xl mt-0 mb-4 text-gray-900">
                  Task Information
                </h3>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                  <div className="p-3 bg-gray-50 rounded-md">
                    <Text as="p" size="xs" className="text-gray-500 uppercase tracking-wide mb-1">
                      Creator
                    </Text>
                    <Text as="p" size="md" className="font-semibold font-mono">
                      {shortenContractId(task.creator)}
                    </Text>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <Text as="p" size="xs" className="text-gray-500 uppercase tracking-wide mb-1">
                      Assignee
                    </Text>
                    <Text as="p" size="md" className="font-semibold font-mono">
                      {task.assignee ? shortenContractId(task.assignee) : "Not assigned"}
                    </Text>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <Text as="p" size="xs" className="text-gray-500 uppercase tracking-wide mb-1">
                      Created
                    </Text>
                    <Text as="p" size="md" className="font-semibold">
                      {formatDate(task.created_at)}
                    </Text>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <Text as="p" size="xs" className="text-gray-500 uppercase tracking-wide mb-1">
                      Deadline
                    </Text>
                    <Text as="p" size="md" className="font-semibold">
                      {formatDate(task.deadline)}
                    </Text>
                  </div>
                </div>

                {task.completed_at && (
                  <div className="p-3 bg-gray-50 rounded-md mt-4">
                    <Text as="p" size="xs" className="text-gray-500 uppercase tracking-wide mb-1">
                      Completed
                    </Text>
                    <Text as="p" size="md" className="font-semibold">
                      {formatDate(task.completed_at)}
                    </Text>
                  </div>
                )}

                {isExpired && task.status !== TaskStatus.Expired && task.status !== TaskStatus.Cancelled && (
                  <div className="mt-4 p-4 bg-red-50 rounded-md border border-red-200">
                    <Text as="p" size="sm" className="text-red-700 font-semibold">
                      ⚠️ This task has expired!
                    </Text>
                  </div>
                )}
              </div>

              {/* Actions Section */}
              {hasActions && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="font-lora text-xl mt-0 mb-4 text-gray-900">
                    Actions
                  </h3>
                  <div className="space-y-3">
                    {isAssignee && task.status === TaskStatus.Assigned && !isExpired && (
                      <Button
                        variant="primary"
                        onClick={() => void handleAction("start")}
                        disabled={actionLoading === "start"}
                        isLoading={actionLoading === "start"}
                        size="md"
                      >
                        Start Task
                      </Button>
                    )}
                    
                    {isAssignee && task.status === TaskStatus.InProgress && !isExpired && (
                      <Button
                        variant="primary"
                        onClick={() => void handleAction("complete")}
                        disabled={actionLoading === "complete"}
                        isLoading={actionLoading === "complete"}
                        size="md"
                      >
                        Complete Task
                      </Button>
                    )}
                    
                    {isCreator && task.status === TaskStatus.Completed && (
                      <Button
                        variant="success"
                        onClick={() => void handleAction("approve")}
                        disabled={actionLoading === "approve"}
                        isLoading={actionLoading === "approve"}
                        size="md"
                      >
                        Approve & Release Funds
                      </Button>
                    )}
                    
                    {isCreator && (task.status === TaskStatus.Assigned || task.status === TaskStatus.InProgress) && (
                      <Button
                        variant="secondary"
                        onClick={() => void handleAction("cancel")}
                        disabled={actionLoading === "cancel"}
                        isLoading={actionLoading === "cancel"}
                        size="md"
                      >
                        Cancel Task
                      </Button>
                    )}
                    
                    {isCreator && task.status === TaskStatus.Expired && (
                      <div className="flex gap-3 flex-wrap">
                        <Button
                          variant="secondary"
                          onClick={() => void handleAction("reclaim")}
                          disabled={actionLoading === "reclaim"}
                          isLoading={actionLoading === "reclaim"}
                          size="md"
                        >
                          Reclaim Funds
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => void handleAction("reassign")}
                          disabled={actionLoading === "reassign"}
                          isLoading={actionLoading === "reassign"}
                          size="md"
                        >
                          Reassign Task
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
