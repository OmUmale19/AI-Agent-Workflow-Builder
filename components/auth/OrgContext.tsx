"use client";

import React, { createContext, useContext, useState } from "react";
import { OrganizationRole } from "@/types/organization";

export interface PresetOrg {
  id: string;
  name: string;
  defaultUserId: string;
}

export const PRESET_ORGS: PresetOrg[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Org A (Acme Corp)",
    defaultUserId: "usr-org-a-owner",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Org B (Stark Tech)",
    defaultUserId: "usr-org-b-owner",
  },
];

interface OrgContextType {
  currentOrgId: string;
  setOrgId: (id: string) => void;
  currentRole: OrganizationRole;
  setRole: (role: OrganizationRole) => void;
  currentUserId: string;
  setUserId: (id: string) => void;
  currentOrgName: string;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [currentOrgId, setOrgId] = useState<string>(PRESET_ORGS[0].id);
  const [currentRole, setRole] = useState<OrganizationRole>("owner");
  const [currentUserId, setUserId] = useState<string>(PRESET_ORGS[0].defaultUserId);

  const currentOrgName =
    PRESET_ORGS.find((o) => o.id === currentOrgId)?.name || "Selected Org";

  return (
    <OrgContext.Provider
      value={{
        currentOrgId,
        setOrgId: (id: string) => {
          setOrgId(id);
          const org = PRESET_ORGS.find((o) => o.id === id);
          if (org) setUserId(org.defaultUserId);
        },
        currentRole,
        setRole,
        currentUserId,
        setUserId,
        currentOrgName,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrgContext() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error("useOrgContext must be used within an OrgProvider");
  }
  return context;
}
