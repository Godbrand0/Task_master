import React, { useState, useEffect } from "react";
import { Heading, Text, Select, Button } from "@stellar/design-system";
import { Task } from "../../util/contract";
import { useWallet } from "../../hooks/useWallet";
import { taskMasterService } from "../../services/taskmaster";
import TaskCard from "./TaskCard";
import TaskModal from "./TaskModal";

interface TaskListProps {
  filter?: "all" | "created" | "assigned";
  onTaskAction?: (action: string, taskId: number) => void;
  onApplyForTask?: (taskId: number) => void;
}

const TaskList: React.FC<TaskListProps> = ({ filter = "all", onApplyForTask }) => {
  const { address, signTransaction } = useWallet();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"deadline" | "created" | "funding">("created");
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const loadTasks = async () => {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        let taskIds: number[] = [];

        switch (filter) {
          case "created":
            taskIds = await taskMasterService.getUserTasks(address);
            break;
          case "assigned":
            taskIds = await taskMasterService.getAssignedTasks(address);
            break;
          default:
            // For "all", we'll get a limited number for now
            // In a real app, you might implement pagination
            const count = await taskMasterService.getTaskCount();
            const maxTasks = Math.min(count, 20); // Limit to 20 most recent
            taskIds = Array.from({ length: maxTasks }, (_, i) => count - i);
            break;
        }

        const taskDetails = await Promise.all(
          taskIds.map(async (id) => {
            const task = await taskMasterService.getTask(id);
            return task;
          })
        );

        const validTasks = taskDetails.filter((task): task is Task => task !== null);
        
        // Sort tasks
        const sortedTasks = [...validTasks].sort((a, b) => {
          switch (sortBy) {
            case "deadline":
              return a.deadline - b.deadline;
            case "funding":
              return Number(b.funding_amount) - Number(a.funding_amount);
            case "created":
            default:
              return b.created_at - a.created_at;
          }
        });

        setTasks(sortedTasks);
      } catch (error) {
        console.error("Error loading tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [address, filter, sortBy]);

  const handleTaskAction = async (action: string, taskId: number) => {
    if (!address) return;

    try {
      // Configure client with wallet credentials
      taskMasterService.configureWallet(address, signTransaction);

      switch (action) {
        case "start":
          await taskMasterService.startTask(taskId, address);
          break;
        case "complete":
          await taskMasterService.completeTask(taskId, address);
          break;
        case "approve":
          await taskMasterService.releaseFunds(taskId, address);
          break;
        case "cancel":
          await taskMasterService.cancelTask(taskId, address);
          break;
        case "reclaim":
          await taskMasterService.reclaimExpiredFunds(taskId, address);
          break;
        case "reassign":
          // For reassignment, we'd need a dialog to get new assignee
          const newAssignee = prompt("Enter new assignee address:");
          if (newAssignee) {
            await taskMasterService.reassignTask(taskId, address, newAssignee);
          }
          break;
      }

      // Refresh tasks after action
      window.location.reload();
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      alert(`Failed to ${action} task. Please try again.`);
    }
  };

  const getFilterDescription = () => {
    switch (filter) {
      case "created":
        return "Tasks You Created";
      case "assigned":
        return "Tasks Assigned to You";
      default:
        return "All Tasks";
    }
  };

  const getEmptyStateMessage = () => {
    switch (filter) {
      case "created":
        return "You haven't created any tasks yet. Create your first task to get started!";
      case "assigned":
        return "No tasks are currently assigned to you. Browse available tasks and apply for ones that interest you.";
      default:
        return "No tasks found. Be the first to create a task!";
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="space-y-3">
                <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="p-6 text-center">
          <Text as="p" size="md">Please connect your wallet to view tasks.</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Heading as="h2" size="lg">{getFilterDescription()}</Heading>
          
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === "grid"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                List
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <Text as="span" size="sm">Sort by:</Text>
              <Select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                fieldSize="sm"
              >
                <option value="created">Created Date</option>
                <option value="deadline">Deadline</option>
                <option value="funding">Funding Amount</option>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Display */}
      {tasks.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="p-8 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <Heading as="h3" size="md" className="mb-2">No tasks found</Heading>
              <Text as="p" size="md" className="text-gray-600 mb-4">
                {getEmptyStateMessage()}
              </Text>
              {filter !== "created" && (
                <Button
                  onClick={() => window.location.href = "/taskmaster?tab=create"}
                  variant="primary"
                  size="md"
                >
                  Create New Task
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Task count */}
          <div className="bg-white rounded-lg shadow px-4 py-3">
            <Text as="p" size="sm" className="text-gray-600">
              Showing {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </Text>
          </div>

          {/* Tasks Grid/List */}
          <div className={viewMode === "grid" ? "grid gap-4" : "space-y-4"}>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStartTask={() => handleTaskAction("start", task.id)}
                onCompleteTask={() => handleTaskAction("complete", task.id)}
                onApproveTask={() => handleTaskAction("approve", task.id)}
                onCancelTask={() => handleTaskAction("cancel", task.id)}
                onReclaimFunds={() => handleTaskAction("reclaim", task.id)}
                onReassignTask={() => handleTaskAction("reassign", task.id)}
                onTaskClick={(taskId) => {
                  setSelectedTaskId(taskId);
                  setIsModalOpen(true);
                }}
                onApplyForTask={onApplyForTask}
              />
            ))}
          </div>

          {/* Task Modal */}
          {selectedTaskId !== null && (
            <TaskModal
              taskId={selectedTaskId}
              isOpen={isModalOpen}
              onClose={() => {
                setIsModalOpen(false);
                setSelectedTaskId(null);
              }}
              onTaskUpdated={() => {
                // Reload tasks after action
                window.location.reload();
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default TaskList;