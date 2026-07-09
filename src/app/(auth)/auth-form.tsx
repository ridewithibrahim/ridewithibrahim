"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { AuthState } from "@/app/(auth)/actions";
import { t, type Lang } from "@/lib/i18n";

function Submit({ label, waiting }: { label: string; waiting: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" type="submit" disabled={pending} style={{ width: "100%", justifyContent: "center" }}>
      {pending ? waiting : label}
    </button>
  );
}

export function AuthForm({
  action,
  mode,
  next,
  lang = "tr",
}: {
  action: (prev: AuthState, fd: FormData) => Promise<AuthState>;
  mode: "login" | "signup";
  next?: string;
  lang?: Lang;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="auth-form">
      {next && <input type="hidden" name="next" value={next} />}

      {mode === "signup" && (
        <label className="field">
          <span>{t(lang, "username")}</span>
          <input name="username" autoComplete="username" placeholder="ibrahim_rides" required />
        </label>
      )}

      <label className="field">
        <span>{t(lang, "email")}</span>
        <input type="email" name="email" autoComplete="email" placeholder="ornek@mail.com" required />
      </label>

      <label className="field">
        <span>{t(lang, "password")}</span>
        <input type="password" name="password" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="••••••••" required minLength={8} />
      </label>

      {state.error && <p className="field-error">{state.error}</p>}

      <Submit label={mode === "login" ? t(lang, "login") : t(lang, "create_account")} waiting={t(lang, "please_wait")} />
    </form>
  );
}
