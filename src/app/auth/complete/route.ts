import { NextResponse } from "next/server";
import { auth0, auth0Audience } from "@/lib/auth0";
import { parseLoginPortal, portalForContinuation, safeContinuation, type AuthPortal, type LoginPortal } from "@/lib/auth/continuation";
import { getApiBaseUrl } from "@/lib/env";
import { clearLearnerSession, setLearnerSession } from "@/lib/server/learner-session";
import { clearSession, setSession, type TokenPair } from "@/lib/server/session";

type ExchangePayload = TokenPair & { user: { id: string; portal_access?: { staff?: boolean; learner?: boolean } } };

function noStoreRedirect(request: Request, path: string) {
  const response = NextResponse.redirect(new URL(path, request.url), 303);
  response.headers.set("cache-control", "no-store");
  response.headers.set("referrer-policy", "no-referrer");
  return response;
}

function loginError(request: Request, code = "access_denied") {
  return noStoreRedirect(request, `/learn/login?auth0_error=${encodeURIComponent(code)}`);
}

async function clearPortal(portal: LoginPortal) {
  if (portal === "staff") return clearSession();
  if (portal === "learner") return clearLearnerSession();
  await clearSession();
  await clearLearnerSession();
}

function resolvePortal(requested: LoginPortal, access: { staff?: boolean; learner?: boolean }, candidate: string | null): AuthPortal | null {
  if (requested !== "auto") return access[requested] === true ? requested : null;
  const hintedPortal = portalForContinuation(candidate);
  if (hintedPortal && access[hintedPortal] === true) return hintedPortal;
  if (access.staff === true) return "staff";
  if (access.learner === true) return "learner";
  return null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const portal = parseLoginPortal(url.searchParams.get("portal"));
  if (!portal) return loginError(request);
  if (!auth0 || !auth0Audience) {
    await clearPortal(portal);
    return loginError(request, "unavailable");
  }
  try {
    const session = await auth0.getSession();
    if (!session) {
      await clearPortal(portal);
      return loginError(request);
    }
    const { token } = await auth0.getAccessToken({ audience: auth0Audience });
    const exchange = await fetch(`${getApiBaseUrl()}/auth/auth0/exchange/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ assertion: token, portal }),
      cache: "no-store",
    });
    if (!exchange.ok) {
      await clearPortal(portal);
      return loginError(request);
    }
    const payload = await exchange.json() as ExchangePayload;
    const selectedPortal = resolvePortal(portal, payload.user?.portal_access ?? {}, url.searchParams.get("next"));
    if (!payload.access || !payload.refresh || !payload.user?.id || !selectedPortal) {
      await clearPortal(portal);
      return loginError(request);
    }
    if (selectedPortal === "learner") {
      await clearSession();
      await setLearnerSession(payload, "auth0");
    } else {
      await clearLearnerSession();
      await setSession(payload, "auth0");
    }
    const destination = safeContinuation(selectedPortal, url.searchParams.get("next"));
    return noStoreRedirect(request, destination);
  } catch {
    await clearPortal(portal);
    return loginError(request, "unavailable");
  }
}
