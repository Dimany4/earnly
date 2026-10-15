import { NextResponse, type NextRequest } from "next/server";
import { cleanEmail, signInWithEmail, signUpWithEmail } from "@/lib/auth";
import { createSession, loadUser } from "@/lib/session";
import { databaseConfigured } from "@/lib/db";
import { provisionAfterSignIn } from "@/lib/chain/provisioning";
import { assertSameOrigin, CsrfError } from "@/lib/csrf";
import { errorResponse } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch (e) {
    if (e instanceof CsrfError)
      return errorResponse("forbidden", e.message, 403);
    throw e;
  }

  if (!databaseConfigured) {
    return NextResponse.json(
      { error: "Accounts are not configured on this deployment yet." },
      { status: 503 }
    );
  }
  let body: { mode?: string; email?: string; password?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return errorResponse("bad_request", "Malformed request.", 400);
  }

  const email = cleanEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  if (!email) return errorResponse("bad_request", "Enter a valid email address.", 400);
  if (password.length < 8) {
    return errorResponse("bad_request", "Use at least 8 characters for your password.", 400);
  }

  try {
    const result =
      body.mode === "signin"
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password);
    if (!result.ok) return errorResponse("unauthorized", result.error ?? "Sign-in failed.", 401);
    await createSession(result.userId, req.headers.get("user-agent"));
    await provisionAfterSignIn(result.userId);
    const user = await loadUser(result.userId);
    const next =
      user?.profile?.verification !== "verified"
        ? "/verify"
        : !user?.profile?.onboarded
          ? "/onboarding"
          : "/app";
    return NextResponse.json({ ok: true, next, user });
  } catch (error) {
    console.error("[earnly] email auth failed", error);
    return NextResponse.json(
      { error: "We could not reach the account service. Please try again." },
      { status: 500 }
    );
  }
}
