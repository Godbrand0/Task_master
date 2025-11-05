import React from "react";
import { Card, Button, Text, Heading } from "@stellar/design-system";
import { Task, TaskStatus, shortenContractId } from "../../util/contract";
import StatusBadge from "./StatusBadge";
import { useWallet } from "../../hooks/useWallet";

interface TaskCardProps {
  task: Task;
  onStartTask?: (taskId: number) => void;
  onCompleteTask?: (taskId: number) => void;
  onApproveTask?: (taskId: number) => void;
  onCancelTask?: (taskId: number) => void;
  onReclaimFunds?: (taskId: number) => void;
  onReassignTask?: (taskId: number) => void;
  onTaskClick?: (taskId: number) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStartTask,
  onCompleteTask,
  onApproveTask,
  onCancelTask,
  onReclaimFunds,
  onReassignTask,
  onTaskClick,
}) => {
  const { address } = useWallet();
  
  const isCreator = address === task.creator;
  const isAssignee = address === task.assignee;
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };
  
  const formatAmount = (amount: bigint) => {
    return (Number(amount) / 10000000).toFixed(7);
  };
  
  const isExpired = Date.now() / 1000 > task.deadline;
  
  const renderActions = () => {
    const actions = [];
    
    if (isAssignee && task.status === TaskStatus.Assigned && !isExpired) {
      actions.push(
        <Button key="start" size="sm" variant="primary" onClick={() => onStartTask?.(task.id)}>
          Start Task
        </Button>
      );
    }
    
    if (isAssignee && task.status === TaskStatus.InProgress && !isExpired) {
      actions.push(
        <Button key="complete" size="sm" variant="primary" onClick={() => onCompleteTask?.(task.id)}>
          Complete Task
        </Button>
      );
    }
    
    if (isCreator && task.status === TaskStatus.Completed) {
      actions.push(
        <Button key="approve" size="sm" variant="success" onClick={() => onApproveTask?.(task.id)}>
          Approve & Release Funds
        </Button>
      );
    }
    
    if (isCreator && (task.status === TaskStatus.Assigned || task.status === TaskStatus.InProgress)) {
      actions.push(
        <Button key="cancel" size="sm" variant="secondary" onClick={() => onCancelTask?.(task.id)}>
          Cancel Task
        </Button>
      );
    }
    
    if (isCreator && task.status === TaskStatus.Expired) {
      actions.push(
        <Button key="reclaim" size="sm" variant="secondary" onClick={() => onReclaimFunds?.(task.id)}>
          Reclaim Funds
        </Button>
      );
      actions.push(
        <Button key="reassign" size="sm" variant="secondary" onClick={() => onReassignTask?.(task.id)}>
          Reassign Task
        </Button>
      );
    }
    
    return actions.length > 0 ? (
      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
        {actions}
      </div>
    ) : null;
  };

  return (
    <Card>
      <div 
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: "var(--space-4)",
          cursor: onTaskClick ? "pointer" : "default"
        }}
        onClick={() => {
          if (onTaskClick) {
            onTaskClick(task.id);
          }
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Heading as="h3" size="sm">{task.title.replace(/Task/g, "Bounty")}</Heading>
          <StatusBadge status={task.status} />
        </div>
        
        <Text as="p" size="sm">{task.description}</Text>
        
        {task.github_link && task.github_link !== "" && (
          <Text as="p" size="sm" onClick={(e) => e.stopPropagation()}>
            <strong>GitHub:</strong>{" "}
            <a href={task.github_link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              {task.github_link}
            </a>
          </Text>
        )}
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
          <div>
            <Text as="p" size="sm"><strong>Funding:</strong> {formatAmount(task.funding_amount)} XLM</Text>
            <Text as="p" size="sm"><strong>Deadline:</strong> {formatDate(task.deadline)}</Text>
          </div>
          <div>
            <Text as="p" size="sm"><strong>Creator:</strong> {shortenContractId(task.creator)}</Text>
            {task.assignee && (
              <Text as="p" size="sm"><strong>Assignee:</strong> {shortenContractId(task.assignee)}</Text>
            )}
          </div>
        </div>
        
        {task.completed_at && (
          <Text as="p" size="sm"><strong>Completed:</strong> {formatDate(task.completed_at)}</Text>
        )}
        
        {isExpired && task.status !== TaskStatus.Expired && task.status !== TaskStatus.Cancelled && (
          <Text as="p" size="sm" style={{ color: "color-mix(in oklab, var(--color-ink), red 35%)" }}>This task has expired!</Text>
        )}
        
        {renderActions() && (
          <div onClick={(e) => e.stopPropagation()}>
            {renderActions()}
          </div>
        )}
      </div>
    </Card>
  );
};

export default TaskCard;