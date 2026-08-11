"use client";

import React from "react";
import { useQuery } from "@apollo/client/react";
import { GET_ORGANIZATION_USAGE } from "@/graphql/queries";
import { useOrgContext } from "../auth/OrgContext";

export function UsageQuota() {
  const { currentOrgId } = useOrgContext();
  const { data, loading } = useQuery(GET_ORGANIZATION_USAGE, {
    variables: { org_id: currentOrgId },
    pollInterval: 3000,
  });

  const usage = (data as any)?.organization_usage?.[0] || {
    calls_used: 0,
    calls_allowed: 1000,
    usage_percentage: 0,
  };

  const percentage = Math.min(100, Math.max(0, usage.usage_percentage || 0));

  return (
    <div className="glass-card rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Monthly Execution Quota
          </span>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {loading ? "Refreshing..." : `${usage.calls_used} / ${usage.calls_allowed} calls used`}
        </span>
      </div>

      <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            percentage > 90
              ? "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]"
              : percentage > 70
              ? "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
              : "bg-gradient-to-r from-indigo-500 to-emerald-400 shadow-[0_0_12px_rgba(99,102,241,0.6)]"
          }`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
