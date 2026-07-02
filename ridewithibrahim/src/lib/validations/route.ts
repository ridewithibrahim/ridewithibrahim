import { z } from "zod";

export const routeFormSchema = z.object({
  title: z
    .string()
    .min(3, "Başlık en az 3 karakter olmalı.")
    .max(120, "Başlık çok uzun."),
  description: z.string().max(2000, "Açıklama çok uzun.").optional().or(z.literal("")),
  routeType: z.enum(["yol", "mtb", "moto", "kamp"], {
    message: "Tür seç.",
  }),
  difficulty: z.enum(["kolay", "orta", "zor", "uzman"], {
    message: "Zorluk seç.",
  }),
  province: z.string().min(2, "İl gir (ör. İstanbul)."),
});

export type RouteFormValues = z.infer<typeof routeFormSchema>;
