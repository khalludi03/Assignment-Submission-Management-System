"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { clearSession } from "@/lib/auth";
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

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export default function SubmissionPanel({ assignment, onBack }: Props) {
  const [submissions, setSubmissions] = useState<Submission[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<number, GradeDraft>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api<Submission[]>(`/api/submissions/assignment/${assignment.id}`);
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
        if (err instanceof ApiError && err.status === 401) {
          clearSession();
          window.location.assign("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load submissions.");
      }
    }
    load();
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
          <h3 className="text-base font-semibold text-gray-900">{assignment.title}</h3>
          <p className="text-sm text-gray-500">
            {assignment.className} · {assignment.subjectName} · Max {assignment.maxMarks} marks
          </p>
        </div>
        <button
          onClick={onBack}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          ← Back
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!submissions ? (
        <p className="text-gray-500">Loading submissions...</p>
      ) : submissions.length === 0 ? (
        <p className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-500">
          No submissions yet.
        </p>
      ) : (
        <div className="space-y-4">
          {submissions.map((s) => {
            const draft = drafts[s.id];
            return (
              <div key={s.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{s.studentName}</p>
                    <p className="text-xs text-gray-500">
                      Submitted {formatDate(s.submittedAt)}
                      {s.updatedAt ? ` · Updated ${formatDate(s.updatedAt)}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      s.status === "Graded"
                        ? "bg-green-100 text-green-700"
                        : s.status === "Rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>

                <p className="mt-3 whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm text-gray-800">
                  {s.answer}
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-[8rem_1fr_auto]">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Marks</label>
                    <input
                      type="number"
                      min={0}
                      max={assignment.maxMarks}
                      value={draft?.marks ?? ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [s.id]: { ...prev[s.id], marks: e.target.value } }))
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Feedback</label>
                    <input
                      value={draft?.feedback ?? ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [s.id]: { ...prev[s.id], feedback: e.target.value } }))
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
                    <select
                      value={draft?.status ?? s.status}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [s.id]: { ...prev[s.id], status: e.target.value as GradeDraft["status"] },
                        }))
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
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
                    className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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
