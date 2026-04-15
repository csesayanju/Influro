import { describe, expect, it } from "vitest";
import { parseInfluencerForm } from "../schemas";

function makeForm(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return fd;
}

const valid = {
  handle: "priya_styles",
  platform: "Instagram",
  follower_count: "52000",
  agreed_fee: "15000",
};

describe("parseInfluencerForm", () => {
  it("returns data for a fully valid form", () => {
    const result = parseInfluencerForm(makeForm(valid));
    expect(result).toEqual({
      data: {
        handle: "priya_styles",
        platform: "Instagram",
        follower_count: 52000,
        agreed_fee: 15000,
      },
    });
  });

  it("treats empty follower_count as null", () => {
    const result = parseInfluencerForm(
      makeForm({ ...valid, follower_count: "" })
    );
    expect("data" in result && result.data.follower_count).toBeNull();
  });

  it("treats missing follower_count as null", () => {
    const fd = makeForm({ handle: "x", platform: "YouTube", agreed_fee: "0" });
    const result = parseInfluencerForm(fd);
    expect("data" in result && result.data.follower_count).toBeNull();
  });

  it("coerces string agreed_fee to number", () => {
    const result = parseInfluencerForm(makeForm({ ...valid, agreed_fee: "9999" }));
    expect("data" in result && result.data.agreed_fee).toBe(9999);
  });

  it("defaults agreed_fee to 0 when blank", () => {
    const result = parseInfluencerForm(makeForm({ ...valid, agreed_fee: "" }));
    expect("data" in result && result.data.agreed_fee).toBe(0);
  });

  it("errors on missing handle", () => {
    const result = parseInfluencerForm(makeForm({ ...valid, handle: "" }));
    expect(result).toMatchObject({ error: "Handle is required" });
  });

  it("errors on invalid platform", () => {
    const result = parseInfluencerForm(
      makeForm({ ...valid, platform: "TikTok" })
    );
    expect(result).toMatchObject({ error: "Select a valid platform" });
  });

  it("errors on negative agreed_fee", () => {
    const result = parseInfluencerForm(
      makeForm({ ...valid, agreed_fee: "-500" })
    );
    expect(result).toMatchObject({
      error: "Fee must be a non-negative whole number",
    });
  });

  it("errors on fractional agreed_fee", () => {
    const result = parseInfluencerForm(
      makeForm({ ...valid, agreed_fee: "999.50" })
    );
    expect(result).toMatchObject({ error: "Fee must be a whole number" });
  });

  it("errors on negative follower_count", () => {
    const result = parseInfluencerForm(
      makeForm({ ...valid, follower_count: "-1" })
    );
    expect(result).toMatchObject({
      error: "Follower count cannot be negative",
    });
  });

  it("accepts all three valid platforms", () => {
    for (const platform of ["Instagram", "YouTube", "Twitter/X"]) {
      const result = parseInfluencerForm(makeForm({ ...valid, platform }));
      expect("data" in result).toBe(true);
    }
  });
});
