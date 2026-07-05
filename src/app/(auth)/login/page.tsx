import Link from "next/link";
import { login } from "@/app/(auth)/actions";
import { AuthForm } from "@/app/(auth)/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;

  return (
    <>
      <h1 className="auth-title">Tekrar hoş geldin</h1>
      <p className="auth-sub">Rotalarına ve buluşmalarına devam et.</p>

      <AuthForm action={login} mode="login" next={sp.next} />

      <p className="auth-switch">
        Hesabın yok mu? <Link href="/signup">Katıl</Link>
      </p>
    </>
  );
}
