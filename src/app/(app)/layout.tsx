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

  let unread = 0;
  if (user) {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);
    unread = count ?? 0;
  }

  return (
    <>
      <Navbar username={username} unread={unread} />
      {children}
    </>
  );
}
