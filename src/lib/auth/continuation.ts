export type AuthPortal = "staff" | "learner";
export type LoginPortal = AuthPortal | "auto";

const STAFF_PATHS = [
  "/dashboard",
  "/access",
  "/assessments",
  "/content",
  "/courses",
  "/learners",
  "/manage",
  "/media",
  "/operations",
  "/opportunities",
  "/people",
  "/student-groups",
];

export function isStaffPath(pathname: string) {
  return STAFF_PATHS.some((prefix) => pathMatches(pathname, prefix));
}

export function parsePortal(value: string | null): AuthPortal | null {
  return value === "staff" || value === "learner" ? value : null;
}

export function parseLoginPortal(value: string | null): LoginPortal | null {
  return value === "auto" ? value : parsePortal(value);
}

export function defaultContinuation(portal: AuthPortal) {
  return portal === "learner" ? "/learn" : "/dashboard";
}

function pathMatches(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function safeContinuation(portal: AuthPortal, candidate?: string | null) {
  const fallback = defaultContinuation(portal);
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) {
    return fallback;
  }
  try {
    decodeURI(candidate);
    const resolved = new URL(candidate, "https://platform.invalid");
    if (resolved.origin !== "https://platform.invalid") return fallback;
    const allowed = portal === "learner"
      ? pathMatches(resolved.pathname, "/learn") && !pathMatches(resolved.pathname, "/learn/login")
      : isStaffPath(resolved.pathname);
    return allowed ? `${resolved.pathname}${resolved.search}${resolved.hash}` : fallback;
  } catch {
    return fallback;
  }
}

export function safeUnifiedContinuation(candidate?: string | null) {
  if (!candidate) return "/";
  const staff = safeContinuation("staff", candidate);
  if (staff === candidate) return staff;
  const learner = safeContinuation("learner", candidate);
  return learner === candidate ? learner : "/";
}

export function portalForContinuation(candidate?: string | null): AuthPortal | null {
  if (!candidate) return null;
  if (safeContinuation("learner", candidate) === candidate) return "learner";
  if (safeContinuation("staff", candidate) === candidate) return "staff";
  return null;
}

export function auth0LoginUrl(portal: LoginPortal, candidate?: string | null) {
  const completion = new URL("https://platform.invalid/auth/complete");
  completion.searchParams.set("portal", portal);
  completion.searchParams.set("next", portal === "auto" ? safeUnifiedContinuation(candidate) : safeContinuation(portal, candidate));
  const params = new URLSearchParams({
    returnTo: `${completion.pathname}${completion.search}`,
  });
  return `/auth/login?${params}`;
}
