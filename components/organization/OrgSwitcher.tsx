"use client";

import React from "react";
import { useOrgContext, PRESET_ORGS } from "../auth/OrgContext";
import { OrganizationRole } from "@/types/organization";

export function OrgSwitcher() {
  const {
    currentOrgId,
    setOrgId,
    currentRole,
    setRole,
    currentOrgName,
  } = useOrgContext();

  return (
    <div className="glass-panel rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-lg border border-slate-800">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md">
          {currentOrgName.charAt(0)}
        </div>
        <div>
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Active Multi-Tenant Scope
          </div>
          <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span>{currentOrgName}</span>
            <span
              className={`px-2 py-0.5 text-xs rounded-full font-bold uppercase ${
                currentRole === "owner"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : currentRole === "editor"
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
              }`}
            >
              Role: {currentRole}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {/* Org Selector */}
        <div className="flex items-center bg-slate-900/80 rounded-lg p-1 border border-slate-800">
          <span className="text-xs text-slate-400 px-3 font-medium">Org:</span>
          {PRESET_ORGS.map((org) => (
            <button
              key={org.id}
              onClick={() => setOrgId(org.id)}
              className={`px-3 py-1.5 text-xs rounded-md transition-all font-medium ${
                currentOrgId === org.id
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {org.name.split(" ")[0]} {org.name.split(" ")[1]}
            </button>
          ))}
        </div>

        {/* Role Selector */}
        <div className="flex items-center bg-slate-900/80 rounded-lg p-1 border border-slate-800">
          <span className="text-xs text-slate-400 px-3 font-medium">Role:</span>
          {(["owner", "editor", "viewer"] as OrganizationRole[]).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-3 py-1.5 text-xs capitalize rounded-md transition-all font-medium ${
                currentRole === r
                  ? "bg-purple-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
