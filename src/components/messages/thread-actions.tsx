"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { t, type Lang } from "@/lib/i18n";

const REASONS: Record<Lang, string[]> = {
  tr: ["Spam", "Hakaret / taciz", "Sahte profil veya içerik", "Diğer"],
  en: ["Spam", "Harassment / abuse", "Fake profile or content", "Other"],
};

export function ThreadActions({
  otherId,
  otherUsername,
  blockedByMe,
  lang = "tr",
}: {
  otherId: string;
  otherUsername: string;
  blockedByMe: boolean;
  lang?: Lang;
}) {
  const router = useRouter();
  const [arming, setArming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState(REASONS[lang][0]);
  const [detail, setDetail] = useState("");
  const [sent, setSent] = useState(false);

  async function block() {
    setBusy(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: otherId } as never);
    router.refresh();
    setBusy(false);
    setArming(false);
  }

  async function unblock() {
    setBusy(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("blocks").delete().eq("blocker_id", user.id).eq("blocked_id", otherId);
    router.refresh();
    setBusy(false);
  }

  async function report() {
    setBusy(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_id: otherId,
      reason,
      detail: detail.trim() || null,
    } as never);
    if (!error) {
      setSent(true);
      setTimeout(() => {
        setReporting(false);
        setSent(false);
        setDetail("");
      }, 1800);
    }
    setBusy(false);
  }

  return (
    <div className="thread-actions">
      {blockedByMe ? (
        <button type="button" className="btn btn-ghost btn-sm" onClick={unblock} disabled={busy}>
          {t(lang, "unblock")}
        </button>
      ) : arming ? (
        <span className="del-confirm">
          <span>{lang === "en" ? <>Block @{otherUsername}?</> : <>@{otherUsername} engellensin mi?</>}</span>
          <button type="button" className="btn-del solid" onClick={block} disabled={busy}>
            {t(lang, "block_yes")}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setArming(false)}>
            {t(lang, "cancel")}
          </button>
        </span>
      ) : (
        <>
          <button type="button" className="btn-del" onClick={() => setArming(true)}>
            {t(lang, "block")}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setReporting((r) => !r)}>
            {t(lang, "report_btn")}
          </button>
        </>
      )}

      {reporting && !blockedByMe && (
        <div className="report-panel">
          {sent ? (
            <p className="report-ok">{t(lang, "report_ok")}</p>
          ) : (
            <>
              <label className="field">
                <span>{t(lang, "reason_lbl")}</span>
                <select value={reason} onChange={(e) => setReason(e.target.value)}>
                  {REASONS[lang].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>{t(lang, "detail_opt")}</span>
                <textarea rows={2} value={detail} maxLength={500} onChange={(e) => setDetail(e.target.value)} />
              </label>
              <button type="button" className="btn btn-primary btn-sm" onClick={report} disabled={busy}>
                {t(lang, "send")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
