import { z } from "zod";

export const campaignFormSchema = z
  .object({
    name:      z.string().min(1, "Campaign name is required"),
    slug:      z.string().optional(),
    platform:  z.string().optional(),
    startDate: z.string().optional().nullable(),
    endDate:   z.string().optional().nullable(),
    status:    z.enum(["draft", "active", "completed"]).default("draft"),
    budget:    z.coerce
      .number()
      .int("Budget must be a whole number")
      .nonnegative("Budget must be a non-negative whole number")
      .default(0),
  })
  .refine(
    (d) => !d.startDate || !d.endDate || d.endDate >= d.startDate,
    { message: "End date cannot be earlier than start date", path: ["endDate"] }
  );

export type CampaignFormInput = z.infer<typeof campaignFormSchema>;

/** Parse FormData through the schema. Returns `{ data }` or `{ error: string }`. */
export function parseCampaignForm(formData: FormData): { data: CampaignFormInput } | { error: string } {
  const raw = {
    name:      formData.get("name"),
    slug:      formData.get("slug") || undefined,
    platform:  formData.get("platform") || undefined,
    startDate: formData.get("startDate") || null,
    endDate:   formData.get("endDate") || null,
    status:    formData.get("status") || "draft",
    budget:    formData.get("budget"),
  };
  const result = campaignFormSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }
  return { data: result.data };
}

/** Normalise a string to a URL-safe slug (max 80 chars). */
export function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
