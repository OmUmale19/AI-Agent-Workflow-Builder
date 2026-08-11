"use client";

import React, { useState } from "react";
import { useSubscription, useQuery } from "@apollo/client/react";
import { SUBSCRIBE_WORKFLOW_RUN } from "@/graphql/subscriptions";
import { GET_WORKFLOW_RUN_DETAILS } from "@/graphql/queries";
import { StepRun } from "@/types/run";
import { ApprovalModal } from "./ApprovalModal";

interface LiveRunViewerProps {
  workflowRunId: string;
  onClose?: () => void;
}

export function LiveRunViewer({ workflowRunId, onClose }: LiveRunViewerProps) {
  const { data: subData, loading: subLoading, error: subError } = useSubscription(
    SUBSCRIBE_WORKFLOW_RUN,
    { variables: { id: workflowRunId } }
  );

  const { data: queryData } = useQuery(GET_WORKFLOW_RUN_DETAILS, {
    variables: { id: workflowRunId },
    pollInterval: subError ? 1000 : 0,
    skip: !!(subData as any)?.workflow_runs_by_pk,
  });

  const [activeApproval, setActiveApproval] = useState<{
    stepRunId: string;
    name: string;
    message?: string;
  } | null>(null);

  const run = (subData as any)?.workflow_runs_by_pk || (queryData as any)?.workflow_runs_by_pk;
  const stepRuns: StepRun[] = run?.step_runs || [];

  const runStatus = run?.status || "pending";

  return (
    <div className="glass-panel rounded-2xl p-6 mb-8 border border-indigo-500/20 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-indigo-500 animate-ping"></div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Live Execution Stream
              <span className="text-xs font-mono font-normal text-slate-400">
                (ID: {workflowRunId.slice(0, 8)}...)
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Real-Time GraphQL WebSocket Subscription Active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${
              runStatus === "completed"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : runStatus === "running"
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 animate-pulse"
                : runStatus === "paused"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                : runStatus === "failed"
                ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                : "bg-slate-500/20 text-slate-400 border-slate-500/30"
            }`}
          >
            Status: {runStatus}
          </span>

          {onClose && (
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
            >
              Close Stream
            </button>
          )}
        </div>
      </div>

      {!run && subLoading ? (
        <div className="text-center py-10 text-slate-400 text-sm">
          Connecting to real-time subscription stream...
        </div>
      ) : !run && subError ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          Subscription Warning: {subError.message} (Polling Fallback Active)
        </div>
      ) : (
        <div className="space-y-4">
          {stepRuns.length === 0 ? (
            <div className="text-slate-400 text-xs text-center py-6">
              Initializing workflow step execution sequence...
            </div>
          ) : (
            stepRuns.map((sr, index) => {
              const stepName = sr.workflow_step?.name || `Step ${index + 1}`;
              const stepType = sr.workflow_step?.type || "step";
              const isRunning = sr.status === "running";
              const isPaused = sr.status === "paused";
              const isCompleted = sr.status === "completed";
              const isFailed = sr.status === "failed";

              return (
                <div
                  key={sr.id}
                  className={`glass-card rounded-xl p-4 transition-all border ${
                    isRunning
                      ? "border-indigo-500/60 pulse-running bg-indigo-950/20"
                      : isPaused
                      ? "border-amber-500/60 bg-amber-950/20"
                      : isCompleted
                      ? "border-emerald-500/30 bg-emerald-950/10"
                      : isFailed
                      ? "border-rose-500/40 bg-rose-950/10"
                      : "border-slate-800 bg-slate-900/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-mono font-bold text-slate-300">
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-100">
                          {stepName}
                        </h4>
                        <span className="text-[10px] font-mono uppercase text-indigo-400">
                          {stepType}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${
                          isCompleted
                            ? "text-emerald-400 bg-emerald-500/10"
                            : isRunning
                            ? "text-indigo-400 bg-indigo-500/10"
                            : isPaused
                            ? "text-amber-400 bg-amber-500/10"
                            : isFailed
                            ? "text-rose-400 bg-rose-500/10"
                            : "text-slate-500 bg-slate-800"
                        }`}
                      >
                        {sr.status}
                      </span>

                      {isPaused && (
                        <button
                          onClick={() =>
                            setActiveApproval({
                              stepRunId: sr.id,
                              name: stepName,
                              message: sr.output?.message,
                            })
                          }
                          className="px-3 py-1 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-amber-500/20 transition-all animate-bounce"
                        >
                          Review & Approve Step →
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Step Output / Log Box */}
                  {sr.output && (
                    <div className="mt-3 bg-slate-950/80 rounded-lg p-3 border border-slate-800/80 text-xs font-mono text-slate-300 overflow-x-auto max-h-40">
                      {sr.output.llm_output ? (
                        <div>
                          <div className="text-emerald-400 font-semibold mb-1">
                            🤖 Gemini LLM Result:
                          </div>
                          <p className="text-slate-200 whitespace-pre-wrap">
                            {sr.output.llm_output}
                          </p>
                        </div>
                      ) : (
                        <pre className="text-slate-400">
                          {JSON.stringify(sr.output, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}

                  {sr.error && (
                    <div className="mt-2 text-xs text-rose-400 bg-rose-950/40 p-2 rounded border border-rose-900/40">
                      Error: {sr.error}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Approval Modal Popup */}
      {activeApproval && (
        <ApprovalModal
          stepRunId={activeApproval.stepRunId}
          stepName={activeApproval.name}
          message={activeApproval.message}
          onClose={() => setActiveApproval(null)}
          onSuccess={() => setActiveApproval(null)}
        />
      )}
    </div>
  );
}
