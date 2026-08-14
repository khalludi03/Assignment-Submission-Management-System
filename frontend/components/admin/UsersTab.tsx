"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ClassItem, User } from "@/lib/types";

export default function UsersTab() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Student");
  const [classId, setClassId] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [users, classes] = await Promise.all([
          api<User[]>("/api/admin/users"),
          api<ClassItem[]>("/api/admin/classes"),
        ]);
        if (cancelled) return;
        setUsers(users);
        setClasses(classes);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load users.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const created = await api<User>("/api/admin/users", {
        method: "POST",
        body: {
          fullName,
          email,
          password,
          role,
          classId: role === "Student" ? Number(classId) : null,
        },
      });
      setUsers((prev) => (prev ? [...prev, created] : prev));
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("Student");
      setClassId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user: User) {
    if (!confirm(`Delete ${user.fullName} (${user.email})?`)) return;
    try {
      await api(`/api/admin/users/${user.id}`, { method: "DELETE" });
      setUsers((prev) => (prev ? prev.filter((u) => u.id !== user.id) : prev));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user.");
    }
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="card mb-5 p-5">
        <h3 className="mb-3 text-base font-semibold text-zinc-50">Add User</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            required
            className="input"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="input"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            className="input"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="input"
          >
            <option value="Student">Student</option>
            <option value="Teacher">Teacher</option>
            <option value="Admin">Admin</option>
          </select>
          {role === "Student" && (
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              required
              className="input"
            >
              <option value="" disabled>
                Select class...
              </option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={saving} className="btn btn-primary mt-3">
          {saving ? "Creating..." : "Create user"}
        </button>
      </form>

      {!users ? (
        <p className="text-zinc-400">Loading...</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900 text-xs text-zinc-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Role</th>
                <th className="px-4 py-2.5 font-medium">Class</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-zinc-800/60 last:border-0">
                  <td className="px-4 py-2.5 text-zinc-100">{u.fullName}</td>
                  <td className="px-4 py-2.5 text-zinc-400">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <span className="badge badge-blue">{u.role}</span>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-400">{u.className ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => handleDelete(u)} className="btn btn-danger">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
