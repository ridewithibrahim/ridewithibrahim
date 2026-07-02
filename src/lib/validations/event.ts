import { z } from "zod";

export const eventFormSchema = z.object({
  title: z.string().min(3, "Başlık en az 3 karakter.").max(120, "Başlık çok uzun."),
  description: z.string().max(2000, "Açıklama çok uzun.").optional().or(z.literal("")),
  eventType: z.enum(["yol", "mtb", "moto", "kamp"], { message: "Tür seç." }),
  province: z.string().min(2, "İl gir."),
  location: z.string().min(2, "Buluşma yeri gir (ör. Bebek, İstanbul)."),
  startsAt: z.string().min(1, "Tarih ve saat seç."),
  capacity: z
    .string()
    .optional()
    .refine((v) => !v || (Number(v) > 0 && Number(v) <= 10000), "Geçerli bir kapasite gir."),
});

export type EventFormValues = z.infer<typeof eventFormSchema>;
