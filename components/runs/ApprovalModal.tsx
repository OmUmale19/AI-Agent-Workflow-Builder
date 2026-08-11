"use client";

import React, { useState } from "react";
import { useOrgContext } from "../auth/OrgContext";

interface ApprovalModalProps {
  stepRunId: string;
  stepName: string;
  message?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApprovalModal({
  stepRunId,
  stepName,
  message,
  onClose,
  onSuccess,
}: ApprovalModalProps) {
  const { currentRole } = useOrgContext();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const canApprove = currentRole === "owner" || currentRole === "editor";

  const handleApprove = async () => {
    if (!canApprove) {
      setLocalError("Layer 2 Permission Error: Viewer role is not authorized to clear approval gates.");
      return;
    }

    try {
      setLoading(true);
      setLocalError(null);

      const res = await fetch("/api/approve-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step_run_id: stepRunId }),
      });

      const resData = await res.json();

      if (resData?.success) {
        onSuccess();
        onClose();
      } else {
        setLocalError(resData?.message || "Failed to approve step.");
      }
    } catch (err: any) {
      setLocalError(err.message || "Approval execution error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-purple-500/30">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              ⚠️
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-100">
                Approval Gate Required
              </h3>
              <p className="text-xs text-slate-400">
                Step: <span className="text-purple-400 font-semibold">{stepName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <div className="bg-slate-900/80 rounded-xl p-4 mb-6 border border-slate-800 text-sm text-slate-300">
          <p className="mb-2 font-medium">Message from Workflow Execution:</p>
          <p className="text-xs text-purple-300 italic bg-purple-950/40 p-3 rounded-lg border border-purple-900/50">
            "{message || "This workflow is paused awaiting manual review and authorization."}"
          </p>
        </div>

        {/* Security Info Badge */}
        <div className="mb-6 p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Current Caller Role:</span>
          <span
            className={`font-bold uppercase px-2 py-0.5 rounded ${
              canApprove
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
            }`}
          >
            {currentRole} ({canApprove ? "Authorized" : "Blocked"})
          </span>
        </div>

        {localError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {localError}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={loading || !canApprove}
            className={`px-5 py-2 text-xs font-bold rounded-lg transition-all shadow-lg ${
              canApprove
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/20"
                : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
            }`}
          >
            {loading ? "Processing..." : "Approve & Resume Run →"}
          </button>
        </div>
      </div>
    </div>
  );
}

