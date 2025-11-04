import React, { useState, useEffect } from "react";
import { Card, Heading, Text, Select } from "@stellar/design-system";
import { Task } from "../../util/contract";
import { useWallet } from "../../hooks/useWallet";
import { taskMasterService } from "../../services/taskmaster";
import TaskCard from "./TaskCard";

interface TaskListProps {
  filter?: "all" | "created" | "assigned";
  onTaskAction?: (action: string, taskId: number) => void;
}

const TaskList: React.FC<TaskListProps> = ({ filter = "all" }) => {
  const { address, signTransaction } = useWallet();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"deadline" | "created" | "funding">("created");

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

      let tx;
      switch (action) {
        case "start":
          tx = await taskMasterService.startTask(taskId, address);
          break;
        case "complete":
          tx = await taskMasterService.completeTask(taskId, address);
          break;
        case "approve":
          tx = await taskMasterService.releaseFunds(taskId, address);
          break;
        case "cancel":
          tx = await taskMasterService.cancelTask(taskId, address);
          break;
        case "reclaim":
          tx = await taskMasterService.reclaimExpiredFunds(taskId, address);
          break;
        case "reassign":
          // For reassignment, we'd need a dialog to get new assignee
          const newAssignee = prompt("Enter new assignee address:");
          if (newAssignee) {
            tx = await taskMasterService.reassignTask(taskId, address, newAssignee);
          }
          break;
      }

      if (tx) {
        await tx.signAndSend();
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

  if (loading) {
    return (
      <Card>
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <Text as="p" size="md">Loading tasks...</Text>
        </div>
      </Card>
    );
  }

  if (!address) {
    return (
      <Card>
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <Text as="p" size="md">Please connect your wallet to view tasks.</Text>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Heading as="h2" size="lg">{getFilterDescription()}</Heading>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
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

      {tasks.length === 0 ? (
        <Card>
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <Text as="p" size="md">No tasks found.</Text>
          </div>
        </Card>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;