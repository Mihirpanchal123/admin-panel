import { PermissionTypes, Permissions } from 'librechat-data-provider';
import type * as t from '@/types';

/**
 * LibreChat's `USAGE` permission (seeing one's own token usage) is newer than the
 * pinned `librechat-data-provider`, whose enum lacks it. Drop this shim once the
 * dependency ships `PermissionTypes.USAGE`; the dedupe below keeps it safe until then.
 */
export const USAGE_PERMISSION_TYPE = 'USAGE' as PermissionTypes;

/** Every role permission type LibreChat accepts, the shimmed ones included. */
export const ROLE_PERMISSION_TYPES: PermissionTypes[] = [
  ...new Set([...Object.values(PermissionTypes), USAGE_PERMISSION_TYPE]),
];

/** Maps each PermissionType to the subset of Permissions it supports. */
export const PERMISSION_TYPE_SCHEMA: Record<PermissionTypes, Permissions[]> = {
  [USAGE_PERMISSION_TYPE]: [Permissions.USE],
  [PermissionTypes.BOOKMARKS]: [Permissions.USE],
  [PermissionTypes.PROMPTS]: [
    Permissions.USE,
    Permissions.CREATE,
    Permissions.SHARE,
    Permissions.SHARE_PUBLIC,
  ],
  [PermissionTypes.AGENTS]: [
    Permissions.USE,
    Permissions.CREATE,
    Permissions.SHARE,
    Permissions.SHARE_PUBLIC,
  ],
  [PermissionTypes.MEMORIES]: [
    Permissions.USE,
    Permissions.CREATE,
    Permissions.UPDATE,
    Permissions.READ,
    Permissions.OPT_OUT,
  ],
  [PermissionTypes.MULTI_CONVO]: [Permissions.USE],
  [PermissionTypes.TEMPORARY_CHAT]: [Permissions.USE],
  [PermissionTypes.RUN_CODE]: [Permissions.USE],
  [PermissionTypes.WEB_SEARCH]: [Permissions.USE],
  [PermissionTypes.PEOPLE_PICKER]: [
    Permissions.VIEW_USERS,
    Permissions.VIEW_GROUPS,
    Permissions.VIEW_ROLES,
  ],
  [PermissionTypes.MARKETPLACE]: [Permissions.USE],
  [PermissionTypes.FILE_SEARCH]: [Permissions.USE],
  [PermissionTypes.FILE_CITATIONS]: [Permissions.USE],
  [PermissionTypes.MCP_SERVERS]: [
    Permissions.USE,
    Permissions.CREATE,
    Permissions.SHARE,
    Permissions.SHARE_PUBLIC,
    Permissions.CONFIGURE_OBO,
  ],
  [PermissionTypes.REMOTE_AGENTS]: [
    Permissions.USE,
    Permissions.CREATE,
    Permissions.SHARE,
    Permissions.SHARE_PUBLIC,
  ],
  [PermissionTypes.SKILLS]: [
    Permissions.USE,
    Permissions.CREATE,
    Permissions.SHARE,
    Permissions.SHARE_PUBLIC,
  ],
  [PermissionTypes.SHARED_LINKS]: [Permissions.CREATE, Permissions.SHARE, Permissions.SHARE_PUBLIC],
  [PermissionTypes.SCHEDULES]: [Permissions.USE, Permissions.CREATE],
};

export function defaultPermissions(): t.RolePermissions {
  const perms = {} as t.RolePermissions;
  for (const type of ROLE_PERMISSION_TYPES) {
    const section: Record<string, boolean> = {};
    for (const p of PERMISSION_TYPE_SCHEMA[type]) {
      section[p] = false;
    }
    perms[type] = section;
  }
  return perms;
}
