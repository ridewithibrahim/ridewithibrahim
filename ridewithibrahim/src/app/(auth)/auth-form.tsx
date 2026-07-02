"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { AuthState } from "@/app/(auth)/actions";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" type="submit" disabled={pending} style={{ width: "100%", justifyContent: "center" }}>
      {pending ? "Lütfen bekle…" : label}
    </button>
  );
}

export function AuthForm({
  action,
  mode,
  next,
}: {
  action: (prev: AuthState, fd: FormData) => Promise<AuthState>;
  mode: "login" | "signup";
  next?: string;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="auth-form">
      {next && <input type="hidden" name="next" value={next} />}

      {mode === "signup" && (
        <label className="field">
          <span>Kullanıcı adı</span>
          <input name="username" autoComplete="username" placeholder="ibrahim_rides" required />
        </label>
      )}

      <label className="field">
        <span>E-posta</span>
        <input type="email" name="email" autoComplete="email" placeholder="ornek@mail.com" required />
      </label>

      <label className="field">
        <span>Şifre</span>
        <input type="password" name="password" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="••••••••" required minLength={8} />
      </label>

      {state.error && <p className="field-error">{state.error}</p>}

      <Submit label={mode === "login" ? "Giriş yap" : "Hesabı oluştur"} />
    </form>
  );
}
