import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
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

  return (
    <>
      <Navbar username={username} />
      {children}
      <Footer />
      <ScrollReveal />
      <Suspense fallback={null}>
        <WelcomeToast />
      </Suspense>
    </>
  );
}
