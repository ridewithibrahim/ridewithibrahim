"use client";

import { useState } from "react";
import { type Lang, typeName } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { eventFormSchema, type EventFormValues } from "@/lib/validations/event";

const TYPES = ["yol", "mtb", "moto", "kamp"] as const;

export function EventForm({ lang = "tr" }: { lang?: Lang } = {}) {
  const L = (tr: string, en: string) => (lang === "en" ? en : tr);
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormValues>({ resolver: zodResolver(eventFormSchema) });
  const eventType = watch("eventType");

  async function onSubmit(values: EventFormValues) {
    setSubmitError("");
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(L("Oturum bulunamadı, tekrar giriş yap.", "Session not found — please log in again."));

      const eventArgs = {
        p_title: values.title,
        p_description: values.description || "",
        p_event_type: values.eventType,
        p_province: values.province,
        p_location: values.location,
        p_starts_at: new Date(values.startsAt).toISOString(),
        p_capacity: values.capacity ? Number(values.capacity) : undefined,
      };
      const { data: id, error } = await supabase.rpc("create_event", eventArgs as never);
      if (error) throw error;

      router.push(`/bulusmalar/${id}`);
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : L("Kayıt sırasında hata oluştu.", "Something went wrong while saving."));
      setSaving(false);
    }
  }

  return (
    <form className="rf" onSubmit={handleSubmit(onSubmit)}>
      <div className="rf-block">
        <label className="field">
          <span>{L("Başlık", "Title")}</span>
          <input placeholder={L("Pazar Sabahı Boğaz Turu", "Sunday morning group ride")} {...register("title")} />
          {errors.title && <em className="field-error">{errors.title.message}</em>}
        </label>
      </div>

      <div className="rf-block">
        <label className="rf-label">{L("Tür", "Type")}</label>
        <div className="chips">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className={`chip${eventType === t ? " active" : ""}`}
              onClick={() => setValue("eventType", t, { shouldValidate: true })}
            >
              {typeName(lang, t)}
            </button>
          ))}
        </div>
        {errors.eventType && <em className="field-error">{errors.eventType.message}</em>}
      </div>

      <div className="rf-row">
        <label className="field">
          <span>{L("İl", "Region")}</span>
          <input placeholder="İstanbul" {...register("province")} />
          {errors.province && <em className="field-error">{errors.province.message}</em>}
        </label>
        <label className="field">
          <span>{L("Buluşma yeri", "Meeting point")}</span>
          <input placeholder="Bebek Sahili" {...register("location")} />
          {errors.location && <em className="field-error">{errors.location.message}</em>}
        </label>
      </div>

      <div className="rf-row">
        <label className="field">
          <span>Tarih ve saat</span>
          <input type="datetime-local" {...register("startsAt")} />
          {errors.startsAt && <em className="field-error">{errors.startsAt.message}</em>}
        </label>
        <label className="field">
          <span>{L("Kapasite (opsiyonel)", "Capacity (optional)")}</span>
          <input type="number" min={1} placeholder="30" {...register("capacity")} />
          {errors.capacity && <em className="field-error">{errors.capacity.message}</em>}
        </label>
      </div>

      <div className="rf-block">
        <label className="field">
          <span>{L("Açıklama (opsiyonel)", "Description (optional)")}</span>
          <textarea rows={4} placeholder={L("Rota, tempo, buluşma detayları…", "Route, pace, meetup details…")} {...register("description")} />
        </label>
      </div>

      {submitError && <p className="field-error">{submitError}</p>}

      <button className="btn btn-primary" type="submit" disabled={saving} style={{ justifyContent: "center" }}>
        {saving ? L("Oluşturuluyor…", "Creating…") : L("Buluşmayı oluştur", "Create meetup")}
      </button>
    </form>
  );
}
