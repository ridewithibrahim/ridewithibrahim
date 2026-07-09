import Link from "next/link";
import { signup } from "@/app/(auth)/actions";
import { AuthForm } from "@/app/(auth)/auth-form";
import { getLang } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export default async function SignupPage() {
  const lang = await getLang();

  return (
    <>
      <h1 className="auth-title">{t(lang, "signup_title")}</h1>
      <p className="auth-sub">{t(lang, "signup_sub")}</p>

      <AuthForm action={signup} mode="signup" lang={lang} />

      <p className="auth-switch">
        {t(lang, "have_account")} <Link href="/login">{t(lang, "login")}</Link>
      </p>
    </>
  );
}
