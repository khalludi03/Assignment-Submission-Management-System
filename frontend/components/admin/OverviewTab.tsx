"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { clearSession } from "@/lib/auth";
import type { Assignment, Submission } from "@/lib/types";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export default function OverviewTab() {
  const [assignments, setAssignments] = useState<Assignment[] | null>(null);
  const [submissions, setSubmissions] = useState<Submission[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [a, s] = await Promise.all([
          api<Assignment[]>("/api/admin/assignments"),
          api<Submission[]>("/api/admin/submissions"),
        ]);
        setAssignments(a);
        setSubmissions(s);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearSession();
          window.location.assign("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load data.");
      }
    }
    load();
  }, []);

  if (error) return <p className="text-sm text-red-400">{error}</p>;

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 text-base font-semibold text-zinc-50">
          All Assignments
          {assignments && <span className="ml-2 text-sm font-normal text-zinc-500">({assignments.length})</span>}
        </h3>
        {!assignments ? (
          <p className="text-zinc-400">Loading...</p>
        ) : assignments.length === 0 ? (
          <p className="card p-5 text-sm text-zinc-400">No assignments yet.</p>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900 text-xs text-zinc-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Title</th>
                  <th className="px-4 py-2.5 font-medium">Teacher</th>
                  <th className="px-4 py-2.5 font-medium">Class</th>
                  <th className="px-4 py-2.5 font-medium">Subject</th>
                  <th className="px-4 py-2.5 font-medium">Deadline</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.id} className="border-b border-zinc-800/60 last:border-0">
                    <td className="px-4 py-2.5 text-zinc-100">{a.title}</td>
                    <td className="px-4 py-2.5 text-zinc-400">{a.teacherName}</td>
                    <td className="px-4 py-2.5 text-zinc-400">{a.className}</td>
                    <td className="px-4 py-2.5 text-zinc-400">{a.subjectName}</td>
                    <td className="px-4 py-2.5 text-zinc-400">{formatDate(a.deadline)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`badge ${a.status === "Published" ? "badge-green" : "badge-gray"}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-base font-semibold text-zinc-50">
          All Submissions
          {submissions && <span className="ml-2 text-sm font-normal text-zinc-500">({submissions.length})</span>}
        </h3>
        {!submissions ? (
          <p className="text-zinc-400">Loading...</p>
        ) : submissions.length === 0 ? (
          <p className="card p-5 text-sm text-zinc-400">No submissions yet.</p>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900 text-xs text-zinc-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Assignment</th>
                  <th className="px-4 py-2.5 font-medium">Student</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Marks</th>
                  <th className="px-4 py-2.5 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.id} className="border-b border-zinc-800/60 last:border-0">
                    <td className="px-4 py-2.5 text-zinc-100">{s.assignmentTitle}</td>
                    <td className="px-4 py-2.5 text-zinc-400">{s.studentName}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`badge ${
                          s.status === "Graded"
                            ? "badge-green"
                            : s.status === "Rejected"
                              ? "badge-red"
                              : "badge-blue"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-400">{s.marks ?? "—"}</td>
                    <td className="px-4 py-2.5 text-zinc-400">{formatDate(s.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
