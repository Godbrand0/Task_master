import React from "react";
import { Badge } from "@stellar/design-system";
import { TaskStatus } from "../../util/contract";

interface StatusBadgeProps {
  status: TaskStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusVariant = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.Created:
        return "primary";
      case TaskStatus.Assigned:
        return "secondary";
      case TaskStatus.InProgress:
        return "warning";
      case TaskStatus.Completed:
        return "success";
      case TaskStatus.Approved:
        return "success";
      case TaskStatus.FundsReleased:
        return "success";
      case TaskStatus.Expired:
        return "error";
      case TaskStatus.Cancelled:
        return "error";
      default:
        return "primary";
    }
  };

  return (
    <Badge variant={getStatusVariant(status) as "primary" | "secondary" | "warning" | "success" | "error" | "tertiary"}>
      {status}
    </Badge>
  );
};

export default StatusBadge;