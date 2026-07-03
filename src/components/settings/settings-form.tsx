"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface ProfileInitial {
  username: string;
  full_name: string;
  city: string;
  bio: string;
  avatar_url: string | null;
}

export function SettingsForm({ initial }: { initial: ProfileInitial }) {
  const router = useRouter();
  const supabase = createClient();

  // profil
  const [fullName, setFullName] = useState(initial.full_name);
  const [city, setCity] = useState(initial.city);
  const [bio, setBio] = useState(initial.bio);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(initial.avatar_url ?? "");
  const [pSaving, setPSaving] = useState(false);
  const [pMsg, setPMsg] = useState("");
  const [pErr, setPErr] = useState("");

  // şifre
  const [password, setPassword] = useState("");
  const [sSaving, setSSaving] = useState(false);
  const [sMsg, setSMsg] = useState("");
  const [sErr, setSErr] = useState("");

  function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    setPErr("");
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return setPErr("Lütfen bir görsel seç.");
    if (f.size > 3 * 1024 * 1024) return setPErr("Avatar 3 MB'dan büyük olamaz.");
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setPSaving(true);
    setPMsg("");
    setPErr("");
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Oturum bulunamadı.");

      let avatar_url: string | undefined;
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop() || "jpg";
        const path = `avatars/${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("route-thumbnails")
          .upload(path, avatarFile, { contentType: avatarFile.type });
        if (upErr) throw upErr;
        avatar_url = supabase.storage.from("route-thumbnails").getPublicUrl(path).data.publicUrl;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          city: city.trim() || null,
          bio: bio.trim() || null,
          ...(avatar_url ? { avatar_url } : {}),
        })
        .eq("id", user.id);
      if (error) throw error;

      setPMsg("Profil güncellendi ✓");
      router.refresh();
    } catch (err) {
      setPErr(err instanceof Error ? err.message : "Kaydedilemedi.");
    }
    setPSaving(false);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setSMsg("");
    setSErr("");
    if (password.length < 8) return setSErr("Şifre en az 8 karakter olmalı.");
    setSSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setSErr(error.message);
    else {
      setSMsg("Şifren güncellendi ✓");
      setPassword("");
    }
    setSSaving(false);
  }

  return (
    <div className="settings">
      <form className="rf" onSubmit={saveProfile}>
        <div className="rf-block">
          <label className="rf-label">Avatar</label>
          <div className="avatar-row">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarPreview} alt="" className="avatar-preview" />
            ) : (
              <span className="pf-avatar avatar-preview-letter">
                {initial.username[0]?.toUpperCase() ?? "?"}
              </span>
            )}
            <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer" }}>
              <input type="file" accept="image/*" onChange={onAvatar} hidden />
              Fotoğraf seç
            </label>
          </div>
        </div>

        <div className="rf-block">
          <label className="field">
            <span>Kullanıcı adı</span>
            <input value={`@${initial.username}`} disabled />
          </label>
        </div>

        <div className="rf-row">
          <label className="field">
            <span>Ad Soyad</span>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="İbrahim ..." maxLength={80} />
          </label>
          <label className="field">
            <span>Şehir</span>
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="İstanbul" maxLength={60} />
          </label>
        </div>

        <div className="rf-block">
          <label className="field">
            <span>Hakkında</span>
            <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Kısaca kendinden bahset…" maxLength={300} />
          </label>
        </div>

        {pErr && <p className="field-error">{pErr}</p>}
        {pMsg && <p className="form-msg">{pMsg}</p>}

        <button className="btn btn-primary" type="submit" disabled={pSaving} style={{ justifyContent: "center" }}>
          {pSaving ? "Kaydediliyor…" : "Profili kaydet"}
        </button>
      </form>

      <form className="rf settings-pass" onSubmit={changePassword}>
        <div className="rf-block">
          <label className="field">
            <span>Yeni şifre</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              minLength={8}
            />
          </label>
        </div>
        {sErr && <p className="field-error">{sErr}</p>}
        {sMsg && <p className="form-msg">{sMsg}</p>}
        <button className="btn btn-ghost" type="submit" disabled={sSaving || !password} style={{ justifyContent: "center" }}>
          {sSaving ? "Güncelleniyor…" : "Şifreyi değiştir"}
        </button>
      </form>
    </div>
  );
}
