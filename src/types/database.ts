/**
 * Database types — optional: generate from Supabase CLI:
 * npx supabase gen types typescript --project-id <ref> > src/types/database.generated.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
