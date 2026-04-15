/**
 * Integration tests for influencer server actions.
 *
 * Strategy:
 *  - Mock @/lib/supabase to return a controllable Supabase client stub
 *  - Mock next/navigation (redirect) and next/cache (revalidatePath)
 *  - redirect() throws just like real Next.js — wrap calls in run()
 *  - Assert the correct Supabase operations and redirects are triggered
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createInfluencerAction,
  deleteInfluencerAction,
  updateInfluencerAction,
} from "../actions";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw Object.assign(new Error(url), { digest: "NEXT_REDIRECT" });
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase", () => ({
  createServerClient: () => ({
    auth: { getUser: mockGetUser },
    from: (table: string) => ({
      insert: (data: unknown) => mockInsert(table, data),
      update: (data: unknown) => ({
        eq: () => ({
          eq: () => ({
            select: () => ({
              maybeSingle: () => mockUpdate(table, data),
            }),
          }),
        }),
      }),
      delete: () => ({
        eq: () => ({
          eq: () => mockDelete(table),
        }),
      }),
    }),
  }),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Swallow the NEXT_REDIRECT throw so test assertions can run after */
async function run(fn: () => Promise<void>) {
  try {
    await fn();
  } catch {
    // redirect() throws — expected
  }
}

function makeForm(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return fd;
}

const baseFields = {
  campaignId: "camp-abc",
  brandId: "brand-xyz",
  handle: "sunita_fit",
  platform: "Instagram",
  follower_count: "30000",
  agreed_fee: "12000",
};

const authedUser = { id: "user-1" };

// ── createInfluencerAction ────────────────────────────────────────────────────

describe("createInfluencerAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: authedUser } });
    mockInsert.mockResolvedValue({ error: null });
  });

  it("inserts into influencers and redirects to campaign detail on success", async () => {
    await run(() => createInfluencerAction(makeForm(baseFields)));

    expect(mockInsert).toHaveBeenCalledWith("influencers", {
      brand_id: "brand-xyz",
      campaign_id: "camp-abc",
      handle: "sunita_fit",
      platform: "Instagram",
      follower_count: 30000,
      agreed_fee: 12000,
    });
    expect(mockRedirect).toHaveBeenCalledWith(
      "/dashboard/campaigns/camp-abc?added=1"
    );
  });

  it("redirects with error when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    await run(() => createInfluencerAction(makeForm(baseFields)));
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("error=")
    );
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("redirects with error on missing brandId", async () => {
    await run(() =>
      createInfluencerAction(makeForm({ ...baseFields, brandId: "" }))
    );
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("error=")
    );
  });

  it("redirects with validation error for missing handle", async () => {
    await run(() =>
      createInfluencerAction(makeForm({ ...baseFields, handle: "" }))
    );
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("Handle")
    );
  });

  it("redirects with Supabase error message on insert failure", async () => {
    mockInsert.mockResolvedValue({ error: { message: "duplicate key" } });
    await run(() => createInfluencerAction(makeForm(baseFields)));
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("duplicate")
    );
  });

  it("sends null follower_count when field is blank", async () => {
    await run(() =>
      createInfluencerAction(
        makeForm({ ...baseFields, follower_count: "" })
      )
    );
    expect(mockInsert).toHaveBeenCalledWith(
      "influencers",
      expect.objectContaining({ follower_count: null })
    );
  });
});

// ── updateInfluencerAction ────────────────────────────────────────────────────

describe("updateInfluencerAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: authedUser } });
    mockUpdate.mockResolvedValue({ data: { id: "inf-1" }, error: null });
  });

  it("updates and redirects to campaign detail on success", async () => {
    await run(() =>
      updateInfluencerAction(makeForm({ ...baseFields, id: "inf-1" }))
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      "influencers",
      expect.objectContaining({ handle: "sunita_fit", platform: "Instagram" })
    );
    expect(mockRedirect).toHaveBeenCalledWith(
      "/dashboard/campaigns/camp-abc?updated=1"
    );
  });

  it("redirects with error when influencer not found (null data)", async () => {
    mockUpdate.mockResolvedValue({ data: null, error: null });
    await run(() =>
      updateInfluencerAction(makeForm({ ...baseFields, id: "inf-1" }))
    );
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("Influencer")
    );
  });

  it("redirects with error when id is missing", async () => {
    await run(() =>
      updateInfluencerAction(makeForm({ ...baseFields, id: "" }))
    );
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("error=")
    );
  });
});

// ── deleteInfluencerAction ────────────────────────────────────────────────────

describe("deleteInfluencerAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: authedUser } });
    mockDelete.mockResolvedValue({ error: null });
  });

  it("deletes and redirects to campaign detail", async () => {
    await run(() =>
      deleteInfluencerAction(makeForm({ ...baseFields, id: "inf-1" }))
    );
    expect(mockDelete).toHaveBeenCalledWith("influencers");
    expect(mockRedirect).toHaveBeenCalledWith(
      "/dashboard/campaigns/camp-abc?deleted=1"
    );
  });

  it("redirects with error on missing id", async () => {
    await run(() =>
      deleteInfluencerAction(makeForm({ ...baseFields, id: "" }))
    );
    expect(mockDelete).not.toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("error=")
    );
  });

  it("redirects with Supabase error on delete failure", async () => {
    mockDelete.mockResolvedValue({ error: { message: "foreign key violation" } });
    await run(() =>
      deleteInfluencerAction(makeForm({ ...baseFields, id: "inf-1" }))
    );
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("foreign")
    );
  });
});
