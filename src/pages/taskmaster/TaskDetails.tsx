import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Heading, Text, Button } from "@stellar/design-system";
import { useWallet } from "../../hooks/useWallet";
import { Task, TaskStatus, shortenContractId } from "../../util/contract";
import { taskMasterService } from "../../services/taskmaster";
import StatusBadge from "../../components/taskmaster/StatusBadge";

const TaskDetails: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { address, signTransaction } = useWallet();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const loadTask = async () => {
      if (!taskId) return;

      try {
        setLoading(true);
        const taskData = await taskMasterService.getTask(parseInt(taskId));
        setTask(taskData);
      } catch (error) {
        console.error("Error loading task:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTask();
  }, [taskId]);

  const handleAction = async (action: string) => {
    if (!address || !task) return;

    try {
      setActionLoading(action);
      
      // Configure client with wallet credentials
      taskMasterService.configureWallet(address, signTransaction);

      let tx;
      switch (action) {
        case "start":
          tx = await taskMasterService.startTask(task.id, address);
          break;
        case "complete":
          tx = await taskMasterService.completeTask(task.id, address);
          break;
        case "approve":
          tx = await taskMasterService.releaseFunds(task.id, address);
          break;
        case "cancel":
          tx = await taskMasterService.cancelTask(task.id, address);
          break;
        case "reclaim":
          tx = await taskMasterService.reclaimExpiredFunds(task.id, address);
          break;
        case "reassign":
          const newAssignee = prompt("Enter new assignee address:");
          if (newAssignee) {
            tx = await taskMasterService.reassignTask(task.id, address, newAssignee);
          }
          break;
      }

      if (tx) {
        await tx.signAndSend();
      }

      // Reload task data to see updated state
      const updatedTask = await taskMasterService.getTask(task.id);
      setTask(updatedTask);
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

  const isCreator = address === task?.creator;
  const isAssignee = address === task?.assignee;
  const isExpired = task ? Date.now() / 1000 > task.deadline : false;

  if (loading) {
    return (
      <Card>
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <Text as="p" size="md">Loading task details...</Text>
        </div>
      </Card>
    );
  }

  if (!task) {
    return (
      <Card>
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <Text as="p" size="md">Task not found.</Text>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <Card>
        <div style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
            <Heading as="h1" size="xl">{task.title}</Heading>
            <StatusBadge status={task.status} />
          </div>
          
          <Text as="p" size="md" style={{ marginBottom: "1rem" }}>
            {task.description}
          </Text>
          
          {task.github_link && (
            <div style={{ marginBottom: "1rem" }}>
              <Text as="p" size="sm"><strong>GitHub Repository:</strong></Text>
              <br />
              <a 
                href={task.github_link} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: "#007bff", textDecoration: "none" }}
              >
                {task.github_link}
              </a>
            </div>
          )}

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: "1rem", 
            marginBottom: "1rem" 
          }}>
            <div>
              <Text as="p" size="sm"><strong>Task ID:</strong> #{task.id}</Text>
            </div>
            <div>
              <Text as="p" size="sm"><strong>Funding Amount:</strong> {formatAmount(task.funding_amount)} XLM</Text>
            </div>
            <div>
              <Text as="p" size="sm"><strong>Platform Fee (3%):</strong> {formatAmount(task.funding_amount * 3n / 100n)} XLM</Text>
            </div>
            <div>
              <Text as="p" size="sm"><strong>Assignee Receives:</strong> {formatAmount(task.funding_amount * 97n / 100n)} XLM</Text>
            </div>
          </div>

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: "1rem", 
            marginBottom: "1rem" 
          }}>
            <div>
              <Text as="p" size="sm"><strong>Creator:</strong> {shortenContractId(task.creator)}</Text>
            </div>
            <div>
              <Text as="p" size="sm"><strong>Assignee:</strong> {task.assignee ? shortenContractId(task.assignee) : "Not assigned"}</Text>
            </div>
            <div>
              <Text as="p" size="sm"><strong>Created:</strong> {formatDate(task.created_at)}</Text>
            </div>
            <div>
              <Text as="p" size="sm"><strong>Deadline:</strong> {formatDate(task.deadline)}</Text>
            </div>
          </div>

          {task.completed_at && (
            <div style={{ marginBottom: "1rem" }}>
              <Text as="p" size="sm"><strong>Completed:</strong> {formatDate(task.completed_at)}</Text>
            </div>
          )}

          {isExpired && task.status !== TaskStatus.Expired && task.status !== TaskStatus.Cancelled && (
            <Text as="p" size="sm" style={{ color: "red", marginBottom: "1rem" }}>
              ⚠️ This task has expired!
            </Text>
          )}
        </div>
      </Card>

      <Card>
        <div style={{ padding: "1.5rem" }}>
          <Heading as="h2" size="lg">Actions</Heading>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {isAssignee && task.status === TaskStatus.Assigned && !isExpired && (
              <Button
                variant="primary"
                onClick={() => handleAction("start")}
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
                onClick={() => handleAction("complete")}
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
                onClick={() => handleAction("approve")}
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
                onClick={() => handleAction("cancel")}
                disabled={actionLoading === "cancel"}
                isLoading={actionLoading === "cancel"}
                size="md"
              >
                Cancel Task
              </Button>
            )}
            
            {isCreator && task.status === TaskStatus.Expired && (
              <div style={{ display: "flex", gap: "1rem" }}>
                <Button
                  variant="secondary"
                  onClick={() => handleAction("reclaim")}
                  disabled={actionLoading === "reclaim"}
                  isLoading={actionLoading === "reclaim"}
                  size="md"
                >
                  Reclaim Funds
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleAction("reassign")}
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
      </Card>

      <div style={{ textAlign: "center" }}>
        <Button
          variant="tertiary"
          onClick={() => navigate("/taskmaster")}
          size="md"
        >
          ← Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default TaskDetails;