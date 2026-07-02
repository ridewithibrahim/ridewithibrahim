"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const credentials = z.object({
  email: z.string().email("Geçerli bir e-posta gir."),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı."),
});

const signupSchema = credentials.extend({
  username: z
    .string()
    .min(3, "Kullanıcı adı en az 3 karakter.")
    .regex(/^[a-z0-9_]+$/, "Sadece küçük harf, rakam ve _ kullan."),
});

export type AuthState = { error?: string };

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "E-posta veya şifre hatalı." };

  revalidatePath("/", "layout");
  redirect((formData.get("next") as string) || "/");
}

export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    username: formData.get("username"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { username: parsed.data.username } },
  });
  if (error) {
    const msg = /already registered/i.test(error.message)
      ? "Bu e-posta zaten kayıtlı. Giriş yapmayı dene."
      : error.message;
    return { error: msg };
  }

  // E-posta onayı kapalı olduğu için signUp doğrudan oturum açar.
  revalidatePath("/", "layout");
  redirect("/?welcome=1");
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
