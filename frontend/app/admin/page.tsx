"use client";

import { useState } from "react";
import NavBar from "@/components/NavBar";
import OverviewTab from "@/components/admin/OverviewTab";
import UsersTab from "@/components/admin/UsersTab";
import SimpleListTab from "@/components/admin/SimpleListTab";
import TeacherAssignmentsTab from "@/components/admin/TeacherAssignmentsTab";

type Tab = "overview" | "users" | "classes" | "subjects" | "teacherAssignments";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "users", label: "Users" },
  { key: "classes", label: "Classes" },
  { key: "subjects", label: "Subjects" },
  { key: "teacherAssignments", label: "Teacher Assignments" },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="min-h-screen bg-black">
      <NavBar title="Admin Dashboard" />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={tab === t.key ? "btn btn-primary" : "btn btn-secondary"}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && <OverviewTab />}
        {tab === "users" && <UsersTab />}
        {tab === "classes" && (
          <SimpleListTab
            fetchUrl="/api/admin/classes"
            createUrl="/api/admin/classes"
            deleteUrl={(id) => `/api/admin/classes/${id}`}
            inputPlaceholder="Class name (e.g. Class 9)"
            emptyText="No classes yet."
            buttonLabel="Add class"
            noun="class"
          />
        )}
        {tab === "subjects" && (
          <SimpleListTab
            fetchUrl="/api/admin/subjects"
            createUrl="/api/admin/subjects"
            deleteUrl={(id) => `/api/admin/subjects/${id}`}
            inputPlaceholder="Subject name (e.g. Physics)"
            emptyText="No subjects yet."
            buttonLabel="Add subject"
            noun="subject"
          />
        )}
        {tab === "teacherAssignments" && <TeacherAssignmentsTab />}
      </main>
    </div>
  );
}
