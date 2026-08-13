"use client";

import { useState } from "react";
import NavBar from "@/components/NavBar";
import UsersTab from "@/components/admin/UsersTab";
import ClassesTab from "@/components/admin/ClassesTab";
import SubjectsTab from "@/components/admin/SubjectsTab";
import TeacherAssignmentsTab from "@/components/admin/TeacherAssignmentsTab";

type Tab = "users" | "classes" | "subjects" | "teacherAssignments";

const TABS: { key: Tab; label: string }[] = [
  { key: "users", label: "Users" },
  { key: "classes", label: "Classes" },
  { key: "subjects", label: "Subjects" },
  { key: "teacherAssignments", label: "Teacher Assignments" },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("users");

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar title="Admin Dashboard" />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium ${
                tab === t.key
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "users" && <UsersTab />}
        {tab === "classes" && <ClassesTab />}
        {tab === "subjects" && <SubjectsTab />}
        {tab === "teacherAssignments" && <TeacherAssignmentsTab />}
      </main>
    </div>
  );
}
