import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n-server";
import { RouteEditForm, type RouteEditInitial } from "@/components/routes/route-edit-form";

export const metadata = { title: "Rotayı düzenle — RideWithIbrahim" };

type Row = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  route_type: RouteEditInitial["routeType"];
  difficulty: RouteEditInitial["difficulty"];
  province: string;
  thumbnail_url: string | null;
};

export default async function EditRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("routes")
    .select("id, user_id, title, description, route_type, difficulty, province, thumbnail_url")
    .eq("id", id)
    .maybeSingle<Row>();
  if (!data) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== data.user_id) redirect(`/rotalar/${id}`);

  const lang = await getLang();

  const initial: RouteEditInitial = {
    id: data.id,
    title: data.title,
    description: data.description ?? "",
    routeType: data.route_type,
    difficulty: data.difficulty,
    province: data.province,
    thumbnailUrl: data.thumbnail_url,
  };

  return (
    <main className="rf-page">
      <div className="wrap" style={{ maxWidth: 720 }}>
        <div className="rf-head">
          <span className="eyebrow">{lang === "en" ? "Edit" : "Düzenle"}</span>
          <h1>{data.title}</h1>
          <p>{lang === "en" ? "You can update the title, type, difficulty, region, photo and description. The route line itself doesn't change." : "Başlık, tür, zorluk, il, fotoğraf ve açıklamayı güncelleyebilirsin. Rota çizgisi (parkur) değişmez."}</p>
        </div>
        <RouteEditForm lang={lang} initial={initial} />
      </div>
    </main>
  );
}
