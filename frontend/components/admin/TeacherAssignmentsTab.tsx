"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { delay } from "@/lib/delay";
import ConfirmDialog from "@/components/ConfirmDialog";
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingUnassign, setPendingUnassign] = useState<TeacherAssignment | null>(null);
  const [unassigning, setUnassigning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [a, u, c, s] = await Promise.all([
          api<TeacherAssignment[]>("/api/admin/teacher-assignments"),
          api<User[]>("/api/admin/users"),
          api<ClassItem[]>("/api/admin/classes"),
          api<SubjectItem[]>("/api/admin/subjects"),
        ]);
        if (cancelled) return;
        setAssignments(a);
        setTeachers(u.filter((user) => user.role === "Teacher"));
        setClasses(c);
        setSubjects(s);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load teacher assignments.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api("/api/admin/teacher-assignments", {
        method: "POST",
        body: { teacherId: Number(teacherId), classId: Number(classId), subjectId: Number(subjectId) },
      });
      setRefreshKey((k) => k + 1);
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
    setPendingUnassign(ta);
  }

  async function handleUnassignConfirm() {
    if (!pendingUnassign) return;
    setUnassigning(true);
    try {
      const ta = pendingUnassign;
      await Promise.all([
        api(`/api/admin/teacher-assignments/${ta.teacherId}/${ta.classId}/${ta.subjectId}`, {
          method: "DELETE",
        }),
        delay(1200),
      ]);
      setAssignments((prev) =>
        prev
          ? prev.filter(
              (x) =>
                !(x.teacherId === ta.teacherId && x.classId === ta.classId && x.subjectId === ta.subjectId),
            )
          : prev,
      );
      setPendingUnassign(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to unassign teacher.");
    } finally {
      setUnassigning(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleAssign} className="card mb-5 p-5">
        <h3 className="mb-3 text-base font-semibold text-zinc-50">Assign Teacher</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            required
            className="input"
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
            className="input"
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
            className="input"
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
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={saving} className="btn btn-primary mt-3">
          {saving ? "Assigning..." : "Assign teacher"}
        </button>
      </form>

      {!assignments ? (
        <p className="text-zinc-400">Loading...</p>
      ) : (
        <div className="card max-w-lg overflow-hidden">
          {assignments.length === 0 ? (
            <p className="p-5 text-sm text-zinc-400">No teacher assignments yet.</p>
          ) : (
            <ul className="divide-y divide-zinc-800/60">
              {assignments.map((ta) => (
                <li
                  key={`${ta.teacherId}-${ta.classId}-${ta.subjectId}`}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div>
                    <p className="text-sm text-zinc-100">{ta.teacherName}</p>
                    <p className="text-xs text-zinc-500">
                      {ta.className} · {ta.subjectName}
                    </p>
                  </div>
                  <button onClick={() => handleUnassign(ta)} className="btn btn-danger">
                    Unassign
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ConfirmDialog
        open={pendingUnassign !== null}
        title="Unassign teacher?"
        message={
          pendingUnassign
            ? `This will remove ${pendingUnassign.teacherName} from ${pendingUnassign.className} · ${pendingUnassign.subjectName}.`
            : ""
        }
        confirmLabel="Unassign"
        busy={unassigning}
        onConfirm={handleUnassignConfirm}
        onCancel={() => setPendingUnassign(null)}
      />
    </div>
  );
}
