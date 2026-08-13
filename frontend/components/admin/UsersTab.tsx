"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { clearSession } from "@/lib/auth";
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

  async function load() {
    try {
      const [u, c] = await Promise.all([
        api<User[]>("/api/admin/users"),
        api<ClassItem[]>("/api/admin/classes"),
      ]);
      setUsers(u);
      setClasses(c);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
        window.location.assign("/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load users.");
    }
  }

  useEffect(() => {
    load();
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
      <form onSubmit={handleCreate} className="mb-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-base font-semibold text-gray-900">Add User</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            required
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
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
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
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
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="mt-3 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create user"}
        </button>
      </form>

      {!users ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Class</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2.5 text-gray-900">{u.fullName}</td>
                  <td className="px-4 py-2.5 text-gray-600">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{u.className ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => handleDelete(u)}
                      className="rounded-md border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
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
