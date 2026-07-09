import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n-server";
import { Navbar } from "@/components/home/navbar";
import { Footer } from "@/components/home/footer";
import { ScrollReveal } from "@/components/shared/reveal";
import { WelcomeToast } from "@/components/shared/welcome-toast";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const username = (user?.user_metadata?.username as string | undefined) ?? null;

  let unread = 0;
  if (user) {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);
    unread = count ?? 0;
  }

  const lang = await getLang();

  return (
    <>
      <Navbar username={username} unread={unread} lang={lang} />
      {children}
      <Footer lang={lang} />
      <ScrollReveal />
      <Suspense fallback={null}>
        <WelcomeToast />
      </Suspense>
    </>
  );
}
