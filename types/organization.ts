export type OrganizationRole = "owner" | "editor" | "viewer";

export interface Organization {
  id: string;
  name: string;
  calls_used: number;
  calls_allowed: number;
  quota_period_start: string;
  created_at: string;
  updated_at: string;
}

export interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  role: OrganizationRole;
  created_at: string;
}

export interface OrganizationUsage {
  organization_id: string;
  organization_name: string;
  calls_used: number;
  calls_allowed: number;
  usage_percentage: number;
  quota_period_start: string;
}
