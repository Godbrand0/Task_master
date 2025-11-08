import React, { useState, useEffect } from "react";
import { Button, Text, Heading } from "@stellar/design-system";
import { Task, TaskStatus, shortenContractId } from "../../util/contract";
import StatusBadge from "./StatusBadge";
import { useWallet } from "../../hooks/useWallet";
import { taskMasterService } from "../../services/taskmaster";

interface TaskCardProps {
  task: Task;
  onStartTask?: (taskId: number) => void;
  onCompleteTask?: (taskId: number) => void;
  onApproveTask?: (taskId: number) => void;
  onCancelTask?: (taskId: number) => void;
  onReclaimFunds?: (taskId: number) => void;
  onReassignTask?: (taskId: number) => void;
  onTaskClick?: (taskId: number) => void;
  onApplyForTask?: (taskId: number) => void;
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
  onApplyForTask,
}) => {
  const { address, userProfile } = useWallet();
  const [applications, setApplications] = useState<number>(0);
  const [creatorUsername, setCreatorUsername] = useState<string>('');
  const [isApplying, setIsApplying] = useState(false);

  // Fetch applications count and creator username when component mounts
  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        // Get applications count
        const apps = await taskMasterService.getTaskApplications(task.id);
        setApplications(apps.length);
        
        // Get creator username
        console.log("Fetching creator profile for:", task.creator);
        console.log("Current creatorUsername state:", creatorUsername);
        const creatorProfile = await taskMasterService.getUserProfile(task.creator);
        console.log("Creator profile result:", creatorProfile);
        if (creatorProfile) {
          console.log("Setting creator username to:", creatorProfile.username);
          setCreatorUsername(creatorProfile.username);
        } else {
          console.log("No profile found for creator:", task.creator);
        }
      } catch (error) {
        console.error("Error fetching task data:", error);
      }
    };

    void fetchTaskData();
  }, [task.id, task.creator]);
  
  const isCreator = address === task.creator;
  const isAssignee = address === task.assignee;
  
  
  const formatAmount = (amount: bigint) => {
    return (Number(amount) / 10000000).toFixed(7);
  };
  
  const isExpired = Date.now() / 1000 > task.deadline;
  
  const getTimeRemaining = () => {
    const now = Date.now() / 1000;
    const timeLeft = task.deadline - now;
    
    if (timeLeft <= 0) return "Expired";
    
    const days = Math.floor(timeLeft / 86400);
    const hours = Math.floor((timeLeft % 86400) / 3600);
    
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''} left`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} left`;
    return "Less than 1 hour left";
  };
  
  const handleApplyForTask = async () => {
    if (!address || !onApplyForTask) return;
    
    setIsApplying(true);
    try {
      // Apply for the task
      await taskMasterService.applyForTask(task.id, address, "I'm interested in this task!");

      
      // Refresh applications count
      const apps = await taskMasterService.getTaskApplications(task.id);
      setApplications(apps.length);
    } catch (error) {
      console.error("Error applying for task:", error);
    } finally {
      setIsApplying(false);
    }
  };

  const renderActions = () => {
    const actions = [];
    
    // Apply button for unassigned tasks (for users who are not the creator)
    if (task.status === TaskStatus.Created && !isCreator && address) {
      actions.push(
        <Button
          key="apply"
          size="sm"
          variant="primary"
          onClick={handleApplyForTask}
          disabled={isApplying || !userProfile}
        >
          {isApplying ? 'Applying...' : 'Apply'}
        </Button>
      );
    }
    
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
      <div className="flex gap-2 flex-wrap">
        {actions}
      </div>
    ) : null;
  };

  const getStatusColor = () => {
    switch (task.status) {
      case TaskStatus.Created:
        return "bg-blue-50 border-blue-200";
      case TaskStatus.Assigned:
        return "bg-purple-50 border-purple-200";
      case TaskStatus.InProgress:
        return "bg-yellow-50 border-yellow-200";
      case TaskStatus.Completed:
        return "bg-green-50 border-green-200";
      case TaskStatus.Approved:
      case TaskStatus.FundsReleased:
        return "bg-emerald-50 border-emerald-200";
      case TaskStatus.Expired:
        return "bg-red-50 border-red-200";
      case TaskStatus.Cancelled:
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-white border-gray-200";
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow border hover:shadow-md transition-all duration-200 ${getStatusColor()} ${
        onTaskClick ? "cursor-pointer" : ""
      }`}
      onClick={() => {
        if (onTaskClick) {
          onTaskClick(task.id);
        }
      }}
    >
      <div className="p-4">
        {/* Compact Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <Heading as="h3" size="sm" className="text-gray-900 mb-1 truncate">
              {task.title.replace(/Task/g, "Bounty")}
            </Heading>
            <div className="flex items-center gap-2">
              <StatusBadge status={task.status} />
              {isExpired && task.status !== TaskStatus.Expired && task.status !== TaskStatus.Cancelled && (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                  Expired
                </span>
              )}
            </div>
          </div>
          <div className="text-right ml-2 flex-shrink-0">
            <div className="text-base font-bold text-gray-900">
              {formatAmount(task.funding_amount)} XLM
            </div>
          </div>
        </div>
        
        {/* Compact Description */}
        <Text as="p" size="sm" className="text-gray-600 mb-3 line-clamp-1">
          {task.description}
        </Text>
        
        {/* Compact Details */}
        <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
          <div>
            <span className="font-medium">Creator:</span> {creatorUsername || shortenContractId(task.creator)} (debug: username={creatorUsername}, address={task.creator})
          </div>
          <div>
            <span className="font-medium">Deadline:</span> {getTimeRemaining()}
          </div>
          {task.assignee ? (
            <div>
              <span className="font-medium">Assignee:</span> {shortenContractId(task.assignee)}
            </div>
          ) : task.status === TaskStatus.Created ? (
            <div>
              <span className="font-medium">Applications:</span> {applications}
            </div>
          ) : null}
        </div>
        
        {/* Compact Actions */}
        {renderActions() && (
          <div onClick={(e) => e.stopPropagation()}>
            {renderActions()}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;