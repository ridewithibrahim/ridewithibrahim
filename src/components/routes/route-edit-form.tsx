"use client";

import { useState } from "react";
import { type Lang, typeName, diffName } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { routeFormSchema, type RouteFormValues } from "@/lib/validations/route";
import { DIFFICULTY } from "@/lib/types";

const TYPES = ["yol", "mtb", "moto", "kamp"] as const;
const DIFFS = ["kolay", "orta", "zor", "uzman"] as const;

export interface RouteEditInitial {
  id: string;
  title: string;
  description: string;
  routeType: (typeof TYPES)[number];
  difficulty: (typeof DIFFS)[number];
  province: string;
  thumbnailUrl: string | null;
}

export function RouteEditForm({ initial, lang = "tr" }: { initial: RouteEditInitial; lang?: Lang }) {
  const L = (tr: string, en: string) => (lang === "en" ? en : tr);
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(initial.thumbnailUrl ?? "");
  const [photoError, setPhotoError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RouteFormValues>({
    resolver: zodResolver(routeFormSchema),
    defaultValues: {
      title: initial.title,
      description: initial.description,
      routeType: initial.routeType,
      difficulty: initial.difficulty,
      province: initial.province,
    },
  });
  const routeType = watch("routeType");
  const difficulty = watch("difficulty");

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    setPhotoError("");
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return setPhotoError(L("Lütfen bir görsel dosyası seç.", "Please choose an image file."));
    if (f.size > 5 * 1024 * 1024) return setPhotoError(L("Fotoğraf 5 MB'dan büyük olamaz.", "The photo can't exceed 5 MB."));
    setPhoto(f);
    setPhotoPreview(URL.createObjectURL(f));
  }

  async function onSubmit(values: RouteFormValues) {
    setSubmitError("");
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(L("Oturum bulunamadı, tekrar giriş yap.", "Session not found — please log in again."));

      // Yeni fotoğraf seçildiyse yükle
      let thumbnail_url: string | undefined;
      if (photo) {
        const ext = photo.name.split(".").pop() || "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("route-thumbnails")
          .upload(path, photo, { contentType: photo.type });
        if (upErr) throw upErr;
        thumbnail_url = supabase.storage.from("route-thumbnails").getPublicUrl(path).data.publicUrl;
      }

      const { error } = await supabase
        .from("routes")
        .update({
          title: values.title,
          description: values.description || null,
          route_type: values.routeType,
          difficulty: values.difficulty,
          province: values.province,
          ...(thumbnail_url ? { thumbnail_url } : {}),
        } as never)
        .eq("id", initial.id);
      if (error) throw error;

      router.push(`/rotalar/${initial.id}`);
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Kaydedilemedi.");
      setSaving(false);
    }
  }

  return (
    <form className="rf" onSubmit={handleSubmit(onSubmit)}>
      <div className="rf-block">
        <label className="field">
          <span>{L("Başlık", "Title")}</span>
          <input {...register("title")} />
          {errors.title && <em className="field-error">{errors.title.message}</em>}
        </label>
      </div>

      <div className="rf-row">
        <div>
          <label className="rf-label">{L("Tür", "Type")}</label>
          <div className="chips">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                className={`chip${routeType === t ? " active" : ""}`}
                onClick={() => setValue("routeType", t, { shouldValidate: true })}
              >
                {typeName(lang, t)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="rf-label">{L("Zorluk", "Difficulty")}</label>
          <div className="chips">
            {DIFFS.map((d) => (
              <button
                key={d}
                type="button"
                className={`chip d-${DIFFICULTY[d].className}${difficulty === d ? " active" : ""}`}
                onClick={() => setValue("difficulty", d, { shouldValidate: true })}
              >
                {diffName(lang, d)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rf-block">
        <label className="field">
          <span>{L("İl", "Region")}</span>
          <input {...register("province")} />
          {errors.province && <em className="field-error">{errors.province.message}</em>}
        </label>
      </div>

      <div className="rf-block">
        <label className="rf-label">{L("Fotoğraf (değiştirmek istersen)", "Photo (replace if you like)")}</label>
        <label className="gpx-drop photo-drop">
          <input type="file" accept="image/*" onChange={onPhoto} hidden />
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="" className="photo-preview" />
          ) : (
            <span style={{ padding: "26px 20px" }}>{L("Yeni bir kare seç", "Choose a new shot")}</span>
          )}
        </label>
        {photoError && <p className="field-error">{photoError}</p>}
      </div>

      <div className="rf-block">
        <label className="field">
          <span>{L("Açıklama", "Description")}</span>
          <textarea rows={4} {...register("description")} />
        </label>
      </div>

      {submitError && <p className="field-error">{submitError}</p>}

      <button className="btn btn-primary" type="submit" disabled={saving} style={{ justifyContent: "center" }}>
        {saving ? L("Kaydediliyor…", "Saving…") : L("Değişiklikleri kaydet", "Save changes")}
      </button>
    </form>
  );
}
