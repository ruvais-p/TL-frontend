import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ middleware: vi.fn(), enabled: false }));

vi.mock("@/lib/auth0", () => ({
  get auth0() {
    return mocks.enabled ? { middleware: mocks.middleware } : null;
  },
}));

describe("Auth0 proxy", () => {
  beforeEach(() => {
    mocks.enabled = false;
    mocks.middleware.mockReset();
  });

  it("passes application and Django proxy routes through when Auth0 is disabled", async () => {
    const { proxy } = await import("./proxy");
    const response = await proxy(new NextRequest("https://platform.test/api/staff/courses"));
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(mocks.middleware).not.toHaveBeenCalled();
  });

  it("delegates mounted Auth0 routes to the SDK middleware when enabled", async () => {
    const expected = new Response(null, { status: 204 });
    mocks.enabled = true;
    mocks.middleware.mockResolvedValue(expected);
    const { proxy } = await import("./proxy");
    expect(await proxy(new NextRequest("https://platform.test/auth/login"))).toBe(expected);
    expect(mocks.middleware).toHaveBeenCalledOnce();
  });

  it("redirects the legacy staff login to the shared sign-in portal", async () => {
    const { proxy } = await import("./proxy");
    const response = await proxy(new NextRequest("https://platform.test/login?next=%2Fcourses"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://platform.test/learn/login?next=%2Fcourses");
  });

  it.each([
    ["/dashboard?tab=reports", "/dashboard?tab=reports"],
    ["/learn/courses/42", "/learn/courses/42"],
  ])("redirects an unauthenticated request for %s to shared sign-in", async (path, next) => {
    const { proxy } = await import("./proxy");
    const response = await proxy(new NextRequest(`https://platform.test${path}`));
    const location = new URL(String(response.headers.get("location")));
    expect(location.pathname).toBe("/learn/login");
    expect(location.searchParams.get("next")).toBe(next);
  });

  it("lets matching authenticated sessions reach their workspace", async () => {
    const { proxy } = await import("./proxy");
    const staff = await proxy(new NextRequest("https://platform.test/dashboard", {
      headers: { cookie: "tella_admin_refresh=refresh" },
    }));
    const learner = await proxy(new NextRequest("https://platform.test/learn/courses", {
      headers: { cookie: "tella_learner_refresh=refresh" },
    }));
    expect(staff.headers.get("x-middleware-next")).toBe("1");
    expect(learner.headers.get("x-middleware-next")).toBe("1");
  });

  it("excludes framework and public logo assets from its matcher", async () => {
    const { config } = await import("./proxy");
    expect(config.matcher[0]).toContain("_next/static");
    expect(config.matcher[0]).toContain("_next/image");
    expect(config.matcher[0]).toContain("logo.png");
  });
});
