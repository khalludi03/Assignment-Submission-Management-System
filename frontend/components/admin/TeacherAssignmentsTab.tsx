"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { clearSession } from "@/lib/auth";
import type { ClassItem, SubjectItem, TeacherAssignment, User } from "@/lib/types";

export default function TeacherAssignmentsTab() {
  const [assignments, setAssignments] = useState<TeacherAssignment[] | null>(null);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [teacherId, setTeacherId] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");

  async function load() {
    try {
      const [a, u, c, s] = await Promise.all([
        api<TeacherAssignment[]>("/api/admin/teacher-assignments"),
        api<User[]>("/api/admin/users"),
        api<ClassItem[]>("/api/admin/classes"),
        api<SubjectItem[]>("/api/admin/subjects"),
      ]);
      setAssignments(a);
      setTeachers(u.filter((user) => user.role === "Teacher"));
      setClasses(c);
      setSubjects(s);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
        window.location.assign("/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load teacher assignments.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api("/api/admin/teacher-assignments", {
        method: "POST",
        body: { teacherId: Number(teacherId), classId: Number(classId), subjectId: Number(subjectId) },
      });
      await load();
      setTeacherId("");
      setClassId("");
      setSubjectId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign teacher.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUnassign(ta: TeacherAssignment) {
    if (!confirm(`Unassign ${ta.teacherName} from ${ta.className} · ${ta.subjectName}?`)) return;
    try {
      await api(`/api/admin/teacher-assignments/${ta.teacherId}/${ta.classId}/${ta.subjectId}`, {
        method: "DELETE",
      });
      setAssignments((prev) =>
        prev
          ? prev.filter(
              (x) =>
                !(x.teacherId === ta.teacherId && x.classId === ta.classId && x.subjectId === ta.subjectId),
            )
          : prev,
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to unassign teacher.");
    }
  }

  return (
    <div>
      <form onSubmit={handleAssign} className="mb-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-base font-semibold text-gray-900">Assign Teacher</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            required
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="" disabled>
              Teacher...
            </option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName}
              </option>
            ))}
          </select>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            required
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="" disabled>
              Class...
            </option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            required
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="" disabled>
              Subject...
            </option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="mt-3 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Assigning..." : "Assign teacher"}
        </button>
      </form>

      {!assignments ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="max-w-lg overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {assignments.length === 0 ? (
            <p className="p-5 text-sm text-gray-500">No teacher assignments yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {assignments.map((ta) => (
                <li key={`${ta.teacherId}-${ta.classId}-${ta.subjectId}`} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm text-gray-900">{ta.teacherName}</p>
                    <p className="text-xs text-gray-500">
                      {ta.className} · {ta.subjectName}
                    </p>
                  </div>
                  <button
                    onClick={() => handleUnassign(ta)}
                    className="rounded-md border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    Unassign
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
