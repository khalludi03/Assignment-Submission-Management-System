import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { roleHome } from "@/lib/roles";

function roleForPath(pathname: string): string | null {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "Admin";
  if (pathname === "/teacher" || pathname.startsWith("/teacher/")) return "Teacher";
  if (pathname === "/student" || pathname.startsWith("/student/")) return "Student";
  return null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userCookie = request.cookies.get("auth_user")?.value;

  let role: string | null = null;
  if (userCookie) {
    try {
      role = JSON.parse(decodeURIComponent(userCookie)).role;
    } catch {
      role = null;
    }
  }

  const requiredRole = roleForPath(pathname);
  const isRoot = pathname === "/";
  const isLogin = pathname === "/login";

  if (!role) {
    if (requiredRole || isRoot) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  if (isLogin || isRoot) {
    return NextResponse.redirect(new URL(roleHome[role] ?? "/login", request.url));
  }

  if (requiredRole && requiredRole !== role) {
    return NextResponse.redirect(new URL(roleHome[role] ?? "/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login/:path*", "/admin/:path*", "/teacher/:path*", "/student/:path*"],
};
