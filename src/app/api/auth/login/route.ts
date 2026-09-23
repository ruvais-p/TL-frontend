import { getApiBaseUrl } from "@/lib/env";
import { forwardResponse } from "@/lib/server/response";
import { clearLearnerSession, setLearnerSession } from "@/lib/server/learner-session";
import { clearSession, setSession, type TokenPair } from "@/lib/server/session";

type PortalAccess = { staff?: boolean; learner?: boolean };

export async function POST(request: Request) {
  let credentials: Record<string, unknown>;
  try {
    credentials = await request.json() as Record<string, unknown>;
  } catch {
    return Response.json({ detail: "Invalid login request." }, { status: 400 });
  }
  const portalHint = credentials.portal_hint;
  delete credentials.portal_hint;
  const body = JSON.stringify(credentials);
  const response = await fetch(`${getApiBaseUrl()}/auth/login/`, { method: "POST", headers: { "content-type": "application/json" }, body, cache: "no-store" });
  if (!response.ok) return forwardResponse(response);
  const tokens = await response.json() as TokenPair;
  const me = await fetch(`${getApiBaseUrl()}/auth/me/`, { headers: { authorization: `Bearer ${tokens.access}` }, cache: "no-store" });
  if (!me.ok) {
    await clearSession();
    await clearLearnerSession();
    return forwardResponse(me);
  }
  const user = await me.json() as { portal_access?: PortalAccess };
  const learnerPreferred = portalHint === "learner" && user.portal_access?.learner === true;
  if (learnerPreferred) {
    await clearSession();
    await setLearnerSession(tokens, "password");
    return Response.json({ ok: true, portal: "learner" });
  }
  if (user.portal_access?.staff === true) {
    await clearLearnerSession();
    await setSession(tokens, "password");
    return Response.json({ ok: true, portal: "staff" });
  }
  if (user.portal_access?.learner === true) {
    await clearSession();
    await setLearnerSession(tokens, "password");
    return Response.json({ ok: true, portal: "learner" });
  }
  await clearSession();
  await clearLearnerSession();
  return Response.json(
    { detail: "This account cannot access the requested workspace." },
    { status: 403 },
  );
}
