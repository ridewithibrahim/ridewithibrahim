// Çerez tabanlı iki dillilik — URL'ler değişmez, tercih hatırlanır.
export type Lang = "tr" | "en";
export const LANG_COOKIE = "rwi_lang";

const STR = {
  nav_routes: ["Rotalar", "Routes"],
  nav_map: ["Harita", "Map"],
  nav_meetups: ["Buluşmalar", "Meetups"],
  nav_leaderboard: ["Liderlik", "Leaderboard"],
  logout: ["Çıkış", "Log out"],
  login: ["Giriş yap", "Log in"],
  join: ["Katıl", "Join"],
  my_profile: ["Profilim", "My profile"],
  saved: ["Kaydettiklerim", "Saved routes"],
  messages: ["Mesajlar", "Messages"],
  notifications: ["Bildirimler", "Notifications"],
  settings: ["Ayarlar", "Settings"],

  cta_title: ["Bir sonraki rotan seni bekliyor.", "Your next route is waiting."],
  cta_authed_p: [
    "Bildiğin güzel bir parkur mu var? Paylaş, topluluk keşfetsin.",
    "Know a great route? Share it and let the community discover it.",
  ],
  cta_share: ["Rota paylaş", "Share a route"],
  cta_open_map: ["Haritayı aç", "Open the map"],
  cta_guest_p: [
    "Aramıza katıl, ilk rotanı paylaş ve Türkiye'nin en aktif sürüş topluluğunun parçası ol.",
    "Join us, share your first route and become part of an active riding community.",
  ],
  cta_browse: ["Önce rotalara bak", "Browse routes first"],

  f_explore: ["Keşfet", "Explore"],
  f_community: ["Topluluk", "Community"],
  f_support: ["Destek", "Support"],
  f_new_meetup: ["Buluşma aç", "Create a meetup"],
  f_account: ["Hesap ayarları", "Account settings"],
  f_contact: ["İletişim", "Contact"],
  f_privacy: ["Gizlilik", "Privacy"],
  f_terms: ["Kullanım Şartları", "Terms of Use"],
  f_tagline: [
    "Bisiklet, moto, kamp ve keşif severler için topluluk rotası ve buluşma platformu.",
    "A community route and meetup platform for cycling, moto, camping and exploring.",
  ],
  f_made: ["Türkiye'de tasarlandı · Dünya için 🌍", "Designed in Türkiye · Made for the world 🌍"],

  login_title: ["Tekrar hoş geldin", "Welcome back"],
  login_sub: ["Rotalarına ve buluşmalarına devam et.", "Pick up your routes and meetups where you left off."],
  no_account: ["Hesabın yok mu?", "No account yet?"],
  signup_title: ["Topluluğa katıl", "Join the community"],
  signup_sub: ["Rotanı paylaş, buluşmalara katıl, keşfet.", "Share routes, join meetups, explore."],
  have_account: ["Zaten üye misin?", "Already a member?"],
  username: ["Kullanıcı adı", "Username"],
  email: ["E-posta", "Email"],
  password: ["Şifre", "Password"],
  please_wait: ["Lütfen bekle…", "Please wait…"],
  create_account: ["Hesabı oluştur", "Create account"],
} as const;

export type StrKey = keyof typeof STR;

export function t(lang: Lang, key: StrKey): string {
  return STR[key][lang === "en" ? 1 : 0];
}
