import React, { useState } from "react";
import { Card, Button, Input, Textarea, Heading, Text } from "@stellar/design-system";
import { useWallet } from "../../hooks/useWallet";
import { taskMasterService } from "../../services/taskmaster";

interface TaskCreationFormProps {
  onTaskCreated?: () => void;
}

const TaskCreationForm: React.FC<TaskCreationFormProps> = ({ onTaskCreated }) => {
  const { address, signTransaction } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    githubLink: "",
    fundingAmount: "",
    deadline: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    if (!formData.title || !formData.description || !formData.fundingAmount || !formData.deadline) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const fundingAmount = BigInt(parseFloat(formData.fundingAmount) * 10000000); // Convert to stroops
      const deadline = Math.floor(new Date(formData.deadline).getTime() / 1000);
      
      // Debug logging
      console.log("Creating task with address:", address);
      console.log("signTransaction function available:", typeof signTransaction);
      
      // Configure client with wallet credentials
      taskMasterService.configureWallet(address, signTransaction);
      
      const result = await taskMasterService.createTask(
        formData.title,
        formData.description,
        formData.githubLink || "",  // Pass empty string if not provided
        fundingAmount,
        deadline,
        address
      );
      
      // Debug logging
      console.log("Transaction result:", result);
      
      if (result) {
        onTaskCreated?.();
        // Reset form
        setFormData({
          title: "",
          description: "",
          githubLink: "",
          fundingAmount: "",
          deadline: "",
        });
      }
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatePlatformFee = () => {
    const amount = parseFloat(formData.fundingAmount) || 0;
    return (amount * 0.03).toFixed(7);
  };

  const calculateTotal = () => {
    const amount = parseFloat(formData.fundingAmount) || 0;
    const fee = parseFloat(calculatePlatformFee());
    return (amount + fee).toFixed(7);
  };

  return (
    <Card>
      <div className="p-4 min-h-full">
        <Heading as="h2" size="md">Create New Task</Heading>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Input
              id="title"
              label="Task Title"
              placeholder="Enter task title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              fieldSize="md"
              required
            />
          </div>

          <div>
            <Textarea
              id="description"
              label="Description"
              placeholder="Describe task requirements"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              fieldSize="md"
              rows={4}
              required
            />
          </div>

          <div>
            <Input
              id="githubLink"
              label="GitHub Repository (Optional)"
              placeholder="https://github.com/username/repo"
              value={formData.githubLink}
              onChange={(e) => handleInputChange("githubLink", e.target.value)}
              type="url"
              fieldSize="md"
            />
          </div>

          <div>
            <Input
              id="fundingAmount"
              label="Funding Amount (XLM)"
              placeholder="10.0000000"
              value={formData.fundingAmount}
              onChange={(e) => handleInputChange("fundingAmount", e.target.value)}
              type="number"
              step="0.0000001"
              min="0.0000001"
              fieldSize="md"
              required
            />
            {formData.fundingAmount && (
              <Text as="p" size="sm" className="mt-2">
                Platform fee (3%): {calculatePlatformFee()} XLM
                <br />
                Total: {calculateTotal()} XLM
              </Text>
            )}
          </div>

          <div>
            <Input
              id="deadline"
              label="Deadline"
              value={formData.deadline}
              onChange={(e) => handleInputChange("deadline", e.target.value)}
              type="datetime-local"
              min={new Date().toISOString().slice(0, 16)}
              fieldSize="md"
              required
            />
          </div>


          <Button 
            type="submit" 
            variant="primary" 
            size="md"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {isSubmitting ? "Creating Task..." : "Create Task"}
          </Button>
        </form>
      </div>
    </Card>
  );
};

export default TaskCreationForm;