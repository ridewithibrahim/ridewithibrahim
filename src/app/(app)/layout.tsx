import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/home/navbar";

export default async function AppLayout({
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
    </>
  );
}
