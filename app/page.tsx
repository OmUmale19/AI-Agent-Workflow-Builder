"use client";

import React from "react";
import { OrgSwitcher } from "@/components/organization/OrgSwitcher";
import { UsageQuota } from "@/components/organization/UsageQuota";
import { WorkflowBuilder } from "@/components/workflow/WorkflowBuilder";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#090d16] text-slate-100 p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 text-white font-black text-lg">
              ⚡
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gradient-purple">
              AI Agent Workflow Builder
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Multi-Tenant n8n Engine • Powered by Nhost, Hasura GraphQL & Gemini AI
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="glass-card px-3.5 py-1.5 rounded-full flex items-center gap-2 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-mono font-medium text-slate-300">
              Nhost Cloud Live
            </span>
          </div>

          <div className="glass-card px-3.5 py-1.5 rounded-full flex items-center gap-2 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            <span className="text-xs font-mono font-medium text-slate-300">
              Gemini 2.0 Flash API
            </span>
          </div>
        </div>
      </header>

      {/* Multi-Tenant Org & Role Control Switcher */}
      <OrgSwitcher />

      {/* Monthly Execution Quota Indicator */}
      <UsageQuota />

      {/* Main Interactive Workflow Canvas */}
      <WorkflowBuilder />
    </main>
  );
}
