"use client";

import { useRouter } from "next/navigation";
import { clearSession, getSessionUser } from "@/lib/auth";

export default function NavBar({ title }: { title: string }) {
  const router = useRouter();
  const user = getSessionUser();

  function handleLogout() {
    clearSession();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm text-gray-600">
              {user.fullName} <span className="text-gray-400">({user.role})</span>
            </span>
          )}
          <button
            onClick={handleLogout}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
