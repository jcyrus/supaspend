"use client";

import { ReactNode } from "react";
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
          {icon}
        </div>
      )}
      <h3 className="mt-2 text-sm font-medium text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

interface StatusMessageProps {
  type: "success" | "error" | "warning" | "info";
  message: string;
  className?: string;
}

export function StatusMessage({
  type,
  message,
  className = "",
}: StatusMessageProps) {
  const config = {
    success: {
      icon: CheckCircle,
      className:
        "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    },
    error: {
      icon: XCircle,
      className:
        "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    },
    warning: {
      icon: AlertCircle,
      className:
        "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
    },
    info: {
      icon: Info,
      className:
        "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    },
  };

  const { icon: Icon, className: typeClassName } = config[type];

  return (
    <div
      className={`flex items-center p-4 border rounded-lg ${typeClassName} ${className}`}
    >
      <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
      <span className="text-sm">{message}</span>
    </div>
  );
}
