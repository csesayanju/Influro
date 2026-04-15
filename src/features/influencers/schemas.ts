import { z } from "zod";

export const PLATFORMS = ["Instagram", "YouTube", "Twitter/X"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const influencerFormSchema = z.object({
  handle: z.string().min(1, "Handle is required"),
  platform: z
    .string()
    .refine(
      (v): v is Platform => (PLATFORMS as readonly string[]).includes(v),
      "Select a valid platform"
    ),
  follower_count: z.coerce
    .number()
    .int("Follower count must be a whole number")
    .nonnegative("Follower count cannot be negative")
    .nullable()
    .optional(),
  agreed_fee: z.coerce
    .number()
    .int("Fee must be a whole number")
    .nonnegative("Fee must be a non-negative whole number")
    .default(0),
});

export type InfluencerFormInput = z.infer<typeof influencerFormSchema>;

/** Parse FormData through the schema. Returns `{ data }` or `{ error: string }`. */
export function parseInfluencerForm(
  formData: FormData
): { data: InfluencerFormInput } | { error: string } {
  const followerRaw = formData.get("follower_count");
  const raw = {
    handle: formData.get("handle"),
    platform: formData.get("platform"),
    // Treat blank string as null so optional follower count works correctly
    follower_count:
      followerRaw === "" || followerRaw === null ? null : followerRaw,
    agreed_fee: formData.get("agreed_fee"),
  };
  const result = influencerFormSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }
  return { data: result.data };
}
