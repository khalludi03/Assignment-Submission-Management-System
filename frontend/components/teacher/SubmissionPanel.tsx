"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Assignment, Submission } from "@/lib/types";

interface Props {
  assignment: Assignment;
  onBack: () => void;
}

interface GradeDraft {
  marks: string;
  feedback: string;
  status: "Submitted" | "Graded" | "Rejected";
}

export default function SubmissionPanel({ assignment, onBack }: Props) {
  const [submissions, setSubmissions] = useState<Submission[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<number, GradeDraft>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api<Submission[]>(`/api/submissions/assignment/${assignment.id}`);
        if (cancelled) return;
        setSubmissions(data);
        const drafts: Record<number, GradeDraft> = {};
        for (const s of data) {
          drafts[s.id] = {
            marks: s.marks != null ? String(s.marks) : "",
            feedback: s.feedback ?? "",
            status: s.status,
          };
        }
        setDrafts(drafts);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load submissions.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [assignment.id]);

  async function handleGrade(submission: Submission) {
    const draft = drafts[submission.id];
    if (draft.marks === "" ) return;
    setSavingId(submission.id);
    try {
      const updated = await api<Submission>(`/api/submissions/${submission.id}/grade`, {
        method: "PUT",
        body: {
          marks: Number(draft.marks),
          feedback: draft.feedback.trim() || null,
          status: draft.status,
        },
      });
      setSubmissions((prev) =>
        prev ? prev.map((s) => (s.id === updated.id ? updated : s)) : prev,
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to grade.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-zinc-50">{assignment.title}</h3>
          <p className="text-sm text-zinc-400">
            {assignment.className} · {assignment.subjectName} · Max {assignment.maxMarks} marks
          </p>
        </div>
        <button onClick={onBack} className="btn btn-secondary">
          ← Back
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {!submissions ? (
        <p className="text-zinc-400">Loading submissions...</p>
      ) : submissions.length === 0 ? (
        <p className="card p-5 text-sm text-zinc-400">No submissions yet.</p>
      ) : (
        <div className="space-y-4">
          {submissions.map((s) => {
            const draft = drafts[s.id];
            return (
              <div key={s.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-zinc-50">{s.studentName}</p>
                    <p className="text-xs text-zinc-500">
                      Submitted {formatDate(s.submittedAt)}
                      {s.updatedAt ? ` · Updated ${formatDate(s.updatedAt)}` : ""}
                    </p>
                  </div>
                  <span
                    className={`badge shrink-0 ${
                      s.status === "Graded"
                        ? "badge-green"
                        : s.status === "Rejected"
                          ? "badge-red"
                          : "badge-blue"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>

                <p className="mt-3 whitespace-pre-wrap rounded-md border border-zinc-800/60 bg-zinc-950 p-3 text-sm text-zinc-300">
                  {s.answer}
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-[8rem_1fr_auto]">
                  <div>
                    <label className="label">Marks</label>
                    <input
                      type="number"
                      min={0}
                      max={assignment.maxMarks}
                      value={draft?.marks ?? ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [s.id]: { ...prev[s.id], marks: e.target.value } }))
                      }
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Feedback</label>
                    <input
                      value={draft?.feedback ?? ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [s.id]: { ...prev[s.id], feedback: e.target.value } }))
                      }
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Status</label>
                    <select
                      value={draft?.status ?? s.status}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [s.id]: { ...prev[s.id], status: e.target.value as GradeDraft["status"] },
                        }))
                      }
                      className="input"
                    >
                      <option value="Graded">Graded</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Submitted">Submitted</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3">
                  <button
                    onClick={() => handleGrade(s)}
                    disabled={savingId === s.id || draft?.marks === ""}
                    className="btn btn-primary"
                  >
                    {savingId === s.id ? "Saving..." : "Save grade"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
