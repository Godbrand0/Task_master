import React, { useState, useEffect } from "react";
import { Button, Text, Heading } from "@stellar/design-system";
import { useWallet } from "../../hooks/useWallet";
import { Task, TaskStatus, shortenContractId } from "../../util/contract";
import { taskMasterService } from "../../services/taskmaster";
import StatusBadge from "./StatusBadge";
import "./TaskModal.css";

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
      loadTask();
    }
  }, [isOpen, taskId]);

  const handleAction = async (action: string) => {
    if (!address || !task) return;

    try {
      setActionLoading(action);
      
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", paddingRight: "var(--space-10)" }}>
            <div style={{ flex: 1 }}>
              <h1 className="headline" style={{ fontSize: "32px", margin: 0, marginBottom: "var(--space-2)" }}>
                {loading ? "LOADING..." : task?.title.toUpperCase() || "TASK DETAILS"}
              </h1>
              {task && (
                <div style={{ marginTop: "var(--space-2)" }}>
                  <StatusBadge status={task.status} />
                </div>
              )}
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: "center", padding: "var(--space-8)" }}>
              <Text as="p" size="md">Loading task details...</Text>
            </div>
          ) : !task ? (
            <div style={{ textAlign: "center", padding: "var(--space-8)" }}>
              <Text as="p" size="md">Task not found.</Text>
            </div>
          ) : (
            <div className="stack-6">
              {/* Description Section */}
              <div className="modal-section">
                <h3 className="headline-long" style={{ fontSize: "20px", marginTop: 0, marginBottom: "var(--space-4)", color: "var(--color-ink)" }}>
                  Description
                </h3>
                <Text as="p" size="md" style={{ lineHeight: 1.6, color: "var(--color-ink)" }}>
                  {task.description}
                </Text>
                
                {task.github_link && task.github_link !== "" && (
                  <div style={{ marginTop: "var(--space-4)", padding: "var(--space-3)", background: "var(--color-bg)", borderRadius: "var(--radius-md)" }}>
                    <Text as="p" size="sm" style={{ marginBottom: "var(--space-1)", color: "color-mix(in oklab, var(--color-ink), white 40%)", fontWeight: 600 }}>
                      GitHub Repository
                    </Text>
                    <a 
                      href={task.github_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="modal-link"
                    >
                      {task.github_link}
                    </a>
                  </div>
                )}
              </div>

              {/* Funding Details */}
              <div className="modal-section">
                <h3 className="headline-long" style={{ fontSize: "20px", marginTop: 0, marginBottom: "var(--space-4)", color: "var(--color-ink)" }}>
                  Funding Details
                </h3>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                  gap: "var(--space-4)"
                }}>
                  <div className="modal-field">
                    <Text as="p" size="xs" style={{ color: "color-mix(in oklab, var(--color-ink), white 40%)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "var(--space-1)" }}>
                      Task ID
                    </Text>
                    <Text as="p" size="md" style={{ fontWeight: 600 }}>#{task.id}</Text>
                  </div>
                  <div className="modal-field">
                    <Text as="p" size="xs" style={{ color: "color-mix(in oklab, var(--color-ink), white 40%)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "var(--space-1)" }}>
                      Funding Amount
                    </Text>
                    <Text as="p" size="md" style={{ fontWeight: 600 }}>
                      {formatAmount(task.funding_amount)} XLM
                    </Text>
                  </div>
                  <div className="modal-field">
                    <Text as="p" size="xs" style={{ color: "color-mix(in oklab, var(--color-ink), white 40%)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "var(--space-1)" }}>
                      Platform Fee (3%)
                    </Text>
                    <Text as="p" size="md" style={{ fontWeight: 600 }}>
                      {formatAmount(task.funding_amount * 3n / 100n)} XLM
                    </Text>
                  </div>
                  <div className="modal-field">
                    <Text as="p" size="xs" style={{ color: "color-mix(in oklab, var(--color-ink), white 40%)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "var(--space-1)" }}>
                      Assignee Receives
                    </Text>
                    <Text as="p" size="md" style={{ fontWeight: 600 }}>
                      {formatAmount(task.funding_amount * 97n / 100n)} XLM
                    </Text>
                  </div>
                </div>
              </div>

              {/* Task Information */}
              <div className="modal-section">
                <h3 className="headline-long" style={{ fontSize: "20px", marginTop: 0, marginBottom: "var(--space-4)", color: "var(--color-ink)" }}>
                  Task Information
                </h3>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                  gap: "var(--space-4)"
                }}>
                  <div className="modal-field">
                    <Text as="p" size="xs" style={{ color: "color-mix(in oklab, var(--color-ink), white 40%)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "var(--space-1)" }}>
                      Creator
                    </Text>
                    <Text as="p" size="md" style={{ fontWeight: 600, fontFamily: "monospace" }}>
                      {shortenContractId(task.creator)}
                    </Text>
                  </div>
                  <div className="modal-field">
                    <Text as="p" size="xs" style={{ color: "color-mix(in oklab, var(--color-ink), white 40%)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "var(--space-1)" }}>
                      Assignee
                    </Text>
                    <Text as="p" size="md" style={{ fontWeight: 600, fontFamily: "monospace" }}>
                      {task.assignee ? shortenContractId(task.assignee) : "Not assigned"}
                    </Text>
                  </div>
                  <div className="modal-field">
                    <Text as="p" size="xs" style={{ color: "color-mix(in oklab, var(--color-ink), white 40%)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "var(--space-1)" }}>
                      Created
                    </Text>
                    <Text as="p" size="md" style={{ fontWeight: 600 }}>
                      {formatDate(task.created_at)}
                    </Text>
                  </div>
                  <div className="modal-field">
                    <Text as="p" size="xs" style={{ color: "color-mix(in oklab, var(--color-ink), white 40%)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "var(--space-1)" }}>
                      Deadline
                    </Text>
                    <Text as="p" size="md" style={{ fontWeight: 600 }}>
                      {formatDate(task.deadline)}
                    </Text>
                  </div>
                </div>

                {task.completed_at && (
                  <div className="modal-field" style={{ marginTop: "var(--space-4)" }}>
                    <Text as="p" size="xs" style={{ color: "color-mix(in oklab, var(--color-ink), white 40%)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "var(--space-1)" }}>
                      Completed
                    </Text>
                    <Text as="p" size="md" style={{ fontWeight: 600 }}>
                      {formatDate(task.completed_at)}
                    </Text>
                  </div>
                )}

                {isExpired && task.status !== TaskStatus.Expired && task.status !== TaskStatus.Cancelled && (
                  <div style={{ 
                    marginTop: "var(--space-4)", 
                    padding: "var(--space-4)", 
                    background: "color-mix(in oklab, red, white 85%)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid color-mix(in oklab, red, white 70%)"
                  }}>
                    <Text as="p" size="sm" style={{ color: "color-mix(in oklab, var(--color-ink), red 35%)", fontWeight: 600 }}>
                      ⚠️ This task has expired!
                    </Text>
                  </div>
                )}
              </div>

              {/* Actions Section */}
              {hasActions && (
                <div className="modal-section">
                  <h3 className="headline-long" style={{ fontSize: "20px", marginTop: 0, marginBottom: "var(--space-4)", color: "var(--color-ink)" }}>
                    Actions
                  </h3>
                  <div className="stack-3">
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
                  <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
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
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskModal;

