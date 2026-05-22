import type { Permission, Resource, Action } from "./permissions.js";

export interface UserPermissionContext {
  permissions: string[];
  tenantId: string;
  userId: string;
  scope?: Record<string, string>;
}

/**
 * Check if a user has a specific permission.
 * Supports wildcard "resource:*" grants.
 */
export function checkPermission(
  ctx: UserPermissionContext,
  resource: Resource,
  action: Action,
): boolean {
  const { permissions } = ctx;
  const exact: Permission = `${resource}:${action}`;
  const wildcard: Permission = `${resource}:*`;

  return permissions.includes(exact) || permissions.includes(wildcard);
}

/**
 * Assert permission — throws if not authorized.
 */
export function assertPermission(
  ctx: UserPermissionContext,
  resource: Resource,
  action: Action,
): void {
  if (!checkPermission(ctx, resource, action)) {
    throw new Error(
      `Unauthorized: missing permission '${resource}:${action}'`,
    );
  }
}

/**
 * Collect all permissions from an array of role permission arrays.
 */
export function mergePermissions(rolePermissions: string[][]): string[] {
  return [...new Set(rolePermissions.flat())];
}
