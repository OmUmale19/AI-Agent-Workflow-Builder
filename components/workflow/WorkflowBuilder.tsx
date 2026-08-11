"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useOrgContext } from "../auth/OrgContext";
import { WorkflowStepType } from "@/types/workflow-step";
import { LiveRunViewer } from "../runs/LiveRunViewer";

export function WorkflowBuilder() {
  const { currentOrgId, currentRole } = useOrgContext();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [addingStep, setAddingStep] = useState(false);
  const [triggering, setTriggering] = useState(false);

  // New Workflow form state
  const [newWfName, setNewWfName] = useState("");
  const [newWfDesc, setNewWfDesc] = useState("");

  // New Step form state
  const [stepName, setStepName] = useState("");
  const [stepType, setStepType] = useState<WorkflowStepType>("llm_call");
  const [promptText, setPromptText] = useState("");
  const [httpUrl, setHttpUrl] = useState("https://httpbin.org/json");

  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/get-workflows?org_id=${currentOrgId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.workflows)) {
        setWorkflows(data.workflows);
        if (data.workflows.length > 0 && !selectedWorkflowId) {
          setSelectedWorkflowId(data.workflows[0].id);
        }
      }
    } catch (err) {
      console.error("Fetch workflows error:", err);
    } finally {
      setLoading(false);
    }
  }, [currentOrgId, selectedWorkflowId]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const activeWorkflow = workflows.find((w: any) => w.id === selectedWorkflowId) || workflows[0];

  const canEdit = currentRole === "owner" || currentRole === "editor";
  const canRun = currentRole === "owner" || currentRole === "editor";

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWfName.trim() || !canEdit) return;

    try {
      setCreating(true);
      const res = await fetch("/api/create-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: currentOrgId,
          name: newWfName,
          description: newWfDesc,
        }),
      });

      const data = await res.json();
      if (data.success && data.workflow?.id) {
        setNewWfName("");
        setNewWfDesc("");
        setSelectedWorkflowId(data.workflow.id);
        await fetchWorkflows();
      } else {
        alert(data.message || "Failed to create workflow.");
      }
    } catch (err: any) {
      alert("Failed to create workflow: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkflow || !stepName.trim() || !canEdit) return;

    const nextPosition = (activeWorkflow.steps?.length || 0) + 1;
    let config: any = {};

    if (stepType === "llm_call") {
      config = { prompt: promptText || "Analyze user input." };
    } else if (stepType === "http_request") {
      config = { url: httpUrl, method: "GET" };
    } else if (stepType === "approval_gate") {
      config = { approver_role: "editor", message: "Approval required before proceeding." };
    } else if (stepType === "conditional_branch") {
      config = { condition_field: "llm_output", expected_value: "success" };
    } else if (stepType === "db_write") {
      config = { table: "workflows", payload: { updated: true } };
    } else if (stepType === "notify") {
      config = { channel: "slack", message: "Workflow executed." };
    }

    try {
      setAddingStep(true);
      const res = await fetch("/api/add-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow_id: activeWorkflow.id,
          name: stepName,
          position: nextPosition,
          type: stepType,
          config,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStepName("");
        setPromptText("");
        await fetchWorkflows();
      } else {
        alert(data.message || "Failed to add step.");
      }
    } catch (err: any) {
      alert("Failed to add step: " + err.message);
    } finally {
      setAddingStep(false);
    }
  };

  const handleRunWorkflow = async () => {
    if (!activeWorkflow || !canRun) return;

    try {
      setTriggering(true);
      const res = await fetch("/api/trigger-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow_id: activeWorkflow.id,
          input: { prompt: "Execute AI Agent Pipeline" },
        }),
      });

      const data = await res.json();
      if (data.success && data.workflow_run_id) {
        setActiveRunId(data.workflow_run_id);
        await fetchWorkflows();
      } else {
        alert(data.message || "Failed to trigger run.");
      }
    } catch (err: any) {
      alert("Run trigger error: " + err.message);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Run Subscription Stream Viewer */}
      {activeRunId && (
        <LiveRunViewer
          workflowRunId={activeRunId}
          onClose={() => setActiveRunId(null)}
        />
      )}

      {/* Main Workflow Builder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Workflows List in Active Org */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Workflows ({workflows.length})
            </h3>
            <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
              Org Isolated
            </span>
          </div>

          {loading ? (
            <div className="text-xs text-slate-400 py-4 text-center">Loading workflows...</div>
          ) : workflows.length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-6">
              No workflows found in this organization.
            </div>
          ) : (
            <div className="space-y-2">
              {workflows.map((wf: any) => {
                const isSelected = (activeWorkflow?.id === wf.id);
                return (
                  <div
                    key={wf.id}
                    onClick={() => setSelectedWorkflowId(wf.id)}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? "bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/10"
                        : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-100">{wf.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {wf.steps?.length || 0} steps
                      </span>
                    </div>
                    {wf.description && (
                      <p className="text-xs text-slate-400 line-clamp-1 mb-2">{wf.description}</p>
                    )}
                    <div className="text-[10px] font-mono text-slate-500">
                      ID: {wf.id.slice(0, 13)}...
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Form to create new workflow */}
          {canEdit ? (
            <form onSubmit={handleCreateWorkflow} className="mt-6 pt-4 border-t border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-300 block">
                + Create New Workflow
              </span>
              <input
                type="text"
                placeholder="Workflow Name (e.g. AI Agent Support Pipeline)"
                value={newWfName}
                onChange={(e) => setNewWfName(e.target.value)}
                className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newWfDesc}
                onChange={(e) => setNewWfDesc(e.target.value)}
                className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={creating}
                className="w-full py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                {creating ? "Creating Workflow..." : "Create Workflow"}
              </button>
            </form>
          ) : (
            <div className="mt-4 text-xs text-slate-500 italic p-3 bg-slate-950 rounded-lg border border-slate-900">
              🔒 Viewer role cannot create workflows.
            </div>
          )}
        </div>

        {/* Right 2 Columns: Workflow Canvas & Step Builder */}
        <div className="lg:col-span-2 space-y-6">
          {activeWorkflow ? (
            <div className="glass-panel rounded-2xl p-6 border border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-3">
                    {activeWorkflow.name}
                    <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                      Active
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {activeWorkflow.description || "AI Agent Workflow Pipeline"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {canRun ? (
                    <button
                      onClick={handleRunWorkflow}
                      disabled={triggering}
                      className="px-6 py-2.5 text-xs font-extrabold rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white shadow-xl shadow-indigo-500/25 transition-all transform hover:scale-105 disabled:opacity-50"
                    >
                      {triggering ? "Starting Engine..." : "▶ Run Workflow Now"}
                    </button>
                  ) : (
                    <div className="text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-4 py-2 rounded-xl">
                      🔒 Run Button Hidden for Viewer Role
                    </div>
                  )}
                </div>
              </div>

              {/* Steps Visual Pipeline */}
              <div className="space-y-4 mb-8">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Ordered Workflow Steps ({activeWorkflow.steps?.length || 0})
                </h3>

                {activeWorkflow.steps?.length === 0 ? (
                  <div className="text-xs text-slate-500 py-6 text-center bg-slate-950/60 rounded-xl border border-slate-900">
                    No steps added yet. Add steps below to build the workflow.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeWorkflow.steps?.map((step: any, idx: number) => (
                      <div
                        key={step.id}
                        className="glass-card rounded-xl p-4 flex items-center justify-between border border-slate-800"
                      >
                        <div className="flex items-center gap-4">
                          <span className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 font-mono font-bold flex items-center justify-center border border-indigo-500/30">
                            {idx + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-slate-100">{step.name}</h4>
                            <span className="text-[10px] font-mono uppercase text-purple-400">
                              Type: {step.type}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs font-mono text-slate-400 max-w-xs truncate bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                          {JSON.stringify(step.config)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Step Section */}
              {canEdit && (
                <form
                  onSubmit={handleAddStep}
                  className="bg-slate-950/80 rounded-xl p-5 border border-slate-800/80 space-y-4"
                >
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    + Add Step to Canvas
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                        Step Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Generate Copy with LLM"
                        value={stepName}
                        onChange={(e) => setStepName(e.target.value)}
                        className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                        Step Type (Node)
                      </label>
                      <select
                        value={stepType}
                        onChange={(e) => setStepType(e.target.value as WorkflowStepType)}
                        className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="llm_call">🤖 llm_call (Gemini LLM)</option>
                        <option value="http_request">🌐 http_request (External API)</option>
                        <option value="approval_gate">⏸️ approval_gate (Manual Approval)</option>
                        <option value="conditional_branch">🔀 conditional_branch (If/Else)</option>
                        <option value="db_write">💾 db_write (Save to DB)</option>
                        <option value="notify">🔔 notify (Slack/Email Event)</option>
                      </select>
                    </div>
                  </div>

                  {stepType === "llm_call" && (
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                        LLM Prompt Configuration
                      </label>
                      <input
                        type="text"
                        placeholder="Prompt for Gemini AI"
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                        className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}

                  {stepType === "http_request" && (
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                        HTTP Target URL
                      </label>
                      <input
                        type="text"
                        placeholder="Target Endpoint URL"
                        value={httpUrl}
                        onChange={(e) => setHttpUrl(e.target.value)}
                        className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={addingStep}
                    className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {addingStep ? "Adding Step..." : "Add Step to Workflow"}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-10 text-center text-slate-500 text-sm">
              Select or create a workflow to view the canvas.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
