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
        return "default";
      case TaskStatus.Assigned:
        return "info";
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
        return "default";
    }
  };

  return (
    <Badge variant={getStatusVariant(status) as any}>
      {status}
    </Badge>
  );
};

export default StatusBadge;