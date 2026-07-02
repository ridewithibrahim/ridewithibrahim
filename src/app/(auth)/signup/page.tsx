import Link from "next/link";
import { signup } from "@/app/(auth)/actions";
import { AuthForm } from "@/app/(auth)/auth-form";

export default function SignupPage() {
  return (
    <>
      <h1 className="auth-title">Topluluğa katıl</h1>
      <p className="auth-sub">Rotanı paylaş, buluşmalara katıl, keşfet.</p>

      <AuthForm action={signup} mode="signup" />

      <p className="auth-switch">
        Zaten üye misin? <Link href="/login">Giriş yap</Link>
      </p>
    </>
  );
}
