import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Heading, Text, Button } from "@stellar/design-system";
import { useWallet } from "../../hooks/useWallet";
import { Task, TaskStatus, shortenContractId } from "../../util/contract";
import { taskMasterService } from "../../services/taskmaster";
import StatusBadge from "../../components/taskmaster/StatusBadge";
import { TaskApplication } from "../../types/user";

const TaskDetails: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { address, signTransaction } = useWallet();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [applications, setApplications] = useState<TaskApplication[]>([]);
  const [creatorUsername, setCreatorUsername] = useState<string>('');

  useEffect(() => {
    const loadTaskData = async () => {
      if (!taskId) return;

      try {
        setLoading(true);
        
        // Load task data
        const taskData = await taskMasterService.getTask(parseInt(taskId));
        setTask(taskData);
        
        // Load applications if task is in Created status
        if (taskData && taskData.status === TaskStatus.Created) {
          const apps = await taskMasterService.getTaskApplications(taskData.id);
          setApplications(apps);
        }
        
        // Load creator username
        if (taskData) {
          const creatorProfile = await taskMasterService.getUserProfile(taskData.creator);
          if (creatorProfile) {
            setCreatorUsername(creatorProfile.username);
          }
        }
      } catch (error) {
        console.error("Error loading task data:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadTaskData();
  }, [taskId]);

  const handleAction = async (action: string, applicantAddress?: string) => {
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
        case "assign":
          if (applicantAddress) {
            await taskMasterService.assignToApplicant(task.id, address, applicantAddress);
          }
          break;
      }

      // Reload task data to see updated state
      const updatedTask = await taskMasterService.getTask(task.id);
      if (updatedTask) {
        setTask(updatedTask);
      }
      
      // Reload applications if task was assigned
      if (action === "assign" && updatedTask) {
        const apps = await taskMasterService.getTaskApplications(updatedTask.id);
        setApplications(apps);
      }
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
        <div className="p-8 text-center">
          <Text as="p" size="md">Loading task details...</Text>
        </div>
      </Card>
    );
  }

  if (!task) {
    return (
      <Card>
        <div className="p-8 text-center">
          <Text as="p" size="md">Task not found.</Text>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <Heading as="h1" size="xl">{task.title}</Heading>
            <StatusBadge status={task.status} />
          </div>
          
          <Text as="p" size="md" className="mb-4">
            {task.description}
          </Text>
          
          {task.github_link && (
            <div className="mb-4">
              <Text as="p" size="sm"><strong>GitHub Repository:</strong></Text>
              <br />
              <a
                href={task.github_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 no-underline"
              >
                {task.github_link}
              </a>
            </div>
          )}

          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-4">
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

          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-4">
            <div>
              <Text as="p" size="sm"><strong>Creator:</strong> {creatorUsername || shortenContractId(task.creator)}</Text>
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
            <div className="mb-4">
              <Text as="p" size="sm"><strong>Completed:</strong> {formatDate(task.completed_at)}</Text>
            </div>
          )}

          {isExpired && task.status !== TaskStatus.Expired && task.status !== TaskStatus.Cancelled && (
            <Text as="p" size="sm" className="text-red-600 mb-4">
              ⚠️ This task has expired!
            </Text>
          )}
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <Heading as="h2" size="lg">Actions</Heading>
          
          <div className="flex flex-col gap-4">
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
              <div className="flex gap-4">
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
      </Card>

      {/* Show applicants for tasks with Created status */}
      {task.status === TaskStatus.Created && applications.length > 0 && (
        <Card>
          <div className="p-6">
            <Heading as="h2" size="lg">Applicants ({applications.length})</Heading>
            
            <div className="flex flex-col gap-4 mt-4">
              {applications.map((application, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <Text as="p" size="sm" className="font-bold">
                      Applicant: {shortenContractId(application.applicant)}
                    </Text>
                    <Text as="p" size="sm" className="mt-2">
                      {application.message}
                    </Text>
                    <Text as="p" size="sm" className="text-gray-600 mt-2">
                      Applied: {formatDate(application.applied_at)}
                    </Text>
                  </div>
                  
                  {isCreator && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => void handleAction("assign", application.applicant)}
                      disabled={actionLoading === `assign-${index}`}
                      isLoading={actionLoading === `assign-${index}`}
                    >
                      Assign Task
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <div className="text-center">
        <Button
          variant="tertiary"
          onClick={() => void navigate("/taskmaster")}
          size="md"
        >
          ← Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default TaskDetails;