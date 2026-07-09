import Link from "next/link";
import { login } from "@/app/(auth)/actions";
import { AuthForm } from "@/app/(auth)/auth-form";
import { getLang } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const lang = await getLang();

  return (
    <>
      <h1 className="auth-title">{t(lang, "login_title")}</h1>
      <p className="auth-sub">{t(lang, "login_sub")}</p>

      <AuthForm action={login} mode="login" next={sp.next} lang={lang} />

      <p className="auth-switch">
        {t(lang, "no_account")} <Link href="/signup">{t(lang, "join")}</Link>
      </p>
    </>
  );
}
