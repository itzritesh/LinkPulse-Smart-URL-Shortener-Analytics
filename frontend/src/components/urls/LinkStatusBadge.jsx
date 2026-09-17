import React from "react";
import Badge from "@/components/common/Badge";

export default function LinkStatusBadge({ isActive = true, expiresAt = null, isExpired: isExpiredProp = null, className = "" }) {
  const isExpired = isExpiredProp !== null ? isExpiredProp : (expiresAt && new Date(expiresAt) < new Date());

  if (isExpired) {
    return (
      <Badge variant="rose" dot size="sm" className={className}>
        Expired
      </Badge>
    );
  }

  if (!isActive) {
    return (
      <Badge variant="amber" dot size="sm" className={className}>
        Paused
      </Badge>
    );
  }

  return (
    <Badge variant="emerald" dot pulse size="sm" className={className}>
      Active
    </Badge>
  );
}
