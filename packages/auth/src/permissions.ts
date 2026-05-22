import { z } from "zod";

// Permission format: "resource:action" or "resource:*"
// Resources map to the 13 modules
export const RESOURCES = [
  "documents",
  "work",
  "hrm",
  "finance",
  "projects",
  "assets",
  "business",
  "operations",
  "legal",
  "admin",
  "ai",
  "audit",
] as const;

export const ACTIONS = ["read", "write", "delete", "approve", "export", "*"] as const;

export type Resource = (typeof RESOURCES)[number];
export type Action = (typeof ACTIONS)[number];
export type Permission = `${Resource}:${Action}`;

export const permissionSchema = z.custom<Permission>((val) => {
  if (typeof val !== "string") return false;
  const [resource, action] = val.split(":");
  return (
    RESOURCES.includes(resource as Resource) && ACTIONS.includes(action as Action)
  );
});

export const SYSTEM_ROLES = {
  ADMIN: "admin",
  PROJECT_MANAGER: "project-manager",
  HR_MANAGER: "hr-manager",
  FINANCE_MANAGER: "finance-manager",
  LEGAL: "legal",
  VIEWER: "viewer",
} as const;

export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];
