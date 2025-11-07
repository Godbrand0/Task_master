import React, { useState } from "react";
import { Modal, Heading, Text, Button, Input } from "@stellar/design-system";
import { useWallet } from "../../hooks/useWallet";
import { taskMasterService } from "../../services/taskmaster";

interface UsernameRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UsernameRegistrationModal: React.FC<UsernameRegistrationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { address, signTransaction, refreshUserProfile } = useWallet();
  const [username, setUsername] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleRegister = async () => {
    if (!address || !username.trim()) {
      setError("Please enter a username");
      return;
    }

    try {
      setIsRegistering(true);
      setError(null);

      // Configure client with wallet credentials
      taskMasterService.configureWallet(address, signTransaction);

      // Register the username (passing address first, then username)
      await taskMasterService.registerUser(address, username.trim());

      // Refresh user profile
      if (refreshUserProfile) {
        await refreshUserProfile();
      }

      // Close modal
      onClose();
      
      // Reset form
      setUsername("");
    } catch (error) {
      console.error("Error registering username:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to register username. Please try again."
      );
    } finally {
      setIsRegistering(false);
    }
  };

  const handleClose = () => {
    if (!isRegistering) {
      setUsername("");
      setError(null);
      onClose();
    }
  };

  return (
    <Modal visible={isOpen} onClose={handleClose} disableWindowScrollWhenOpened={false}>
      <div className="p-6 overflow-y-auto">
        <Heading as="h2" size="md">
          Register Username
        </Heading>
        
        <Text as="p" size="sm" className="mb-4">
          Register a permanent username to create and apply for tasks. This username will be
          permanently associated with your wallet address and cannot be changed.
        </Text>

        <Input
          id="username-input"
          fieldSize="md"
          label="Username"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isRegistering}
          error={error}
        />

        <div className="flex gap-2 justify-end mt-4">
          <Button
            variant="tertiary"
            onClick={handleClose}
            disabled={isRegistering}
            size="sm"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleRegister}
            disabled={isRegistering || !username.trim()}
            isLoading={isRegistering}
            size="sm"
          >
            Register
          </Button>
        </div>
      </div>
    </Modal>
  );
};