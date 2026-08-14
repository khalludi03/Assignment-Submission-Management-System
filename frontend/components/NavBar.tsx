"use client";

import { useState, useSyncExternalStore } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);

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

        <div className="hidden items-center gap-4 md:flex">
          {user && (
            <span className="text-sm text-zinc-400">
              {user.fullName} <span className="text-zinc-600">({user.role})</span>
            </span>
          )}
          <button onClick={handleLogout} className="btn btn-secondary">
            Log out
          </button>
        </div>

        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="text-zinc-300 hover:text-zinc-50 md:hidden"
        >
          {menuOpen ? (
            <svg
              className="fill-current"
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 512 512"
            >
              <polygon points="400 145.49 366.51 112 256 222.51 145.49 112 112 145.49 222.51 256 112 366.51 145.49 400 256 289.49 366.51 400 400 366.51 289.49 256 400 145.49" />
            </svg>
          ) : (
            <svg
              className="fill-current"
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 512 512"
            >
              <path d="M64,384H448V341.33H64Zm0-106.67H448V234.67H64ZM64,128v42.67H448V128Z" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-zinc-800/80 px-4 py-3 md:hidden">
          {user && (
            <p className="mb-3 text-sm text-zinc-400">
              {user.fullName} <span className="text-zinc-600">({user.role})</span>
            </p>
          )}
          <button onClick={handleLogout} className="btn btn-secondary w-full">
            Log out
          </button>
        </div>
      )}
    </header>
  );
}
