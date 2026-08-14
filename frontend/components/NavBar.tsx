"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { clearSession, getSessionUser } from "@/lib/auth";

type SessionUser = { email: string; fullName: string; role: string } | null;

let cachedCookie: string | null = null;
let cachedUser: SessionUser = null;

function getSnapshot(): SessionUser {
  const raw = document.cookie;
  if (raw !== cachedCookie) {
    cachedCookie = raw;
    cachedUser = getSessionUser();
  }
  return cachedUser;
}

function subscribe(): () => void {
  return () => {};
}

export default function NavBar({ title }: { title: string }) {
  const router = useRouter();
  const user = useSyncExternalStore(subscribe, getSnapshot, () => null);

  function handleLogout() {
    clearSession();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-800/80 bg-black/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          <h1 className="text-base font-semibold text-zinc-50">{title}</h1>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm text-zinc-400">
              {user.fullName} <span className="text-zinc-600">({user.role})</span>
            </span>
          )}
          <button onClick={handleLogout} className="btn btn-secondary">
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
