/**
 * Network tests for SignOutButton
 *
 * What we're verifying:
 *  - Clicking the button calls supabase.auth.signOut() exactly once
 *  - signOut is called with `scope: "local"` (fast path — no /logout round-trip)
 *  - After signOut resolves, the user is hard-navigated to /login
 *  - Button text is visible and accessible
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignOutButton } from "../sign-out-button";

// ── window.location.assign mock ───────────────────────────────────────────────
const mockAssign = vi.fn();
Object.defineProperty(window, "location", {
  writable: true,
  value: { ...window.location, assign: mockAssign },
});

// ── supabase client mock ──────────────────────────────────────────────────────
const mockSignOut = vi.fn().mockResolvedValue({ error: null });
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signOut: mockSignOut } }),
}));

// ─────────────────────────────────────────────────────────────────────────────

describe("SignOutButton — network", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a visible Sign out button", () => {
    render(<SignOutButton />);
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });

  it("calls supabase.auth.signOut() once with scope: 'local' on click", async () => {
    render(<SignOutButton />);
    await userEvent.click(screen.getByRole("button", { name: /sign out/i }));

    await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
    expect(mockSignOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("hard-navigates to /login after sign-out", async () => {
    render(<SignOutButton />);
    await userEvent.click(screen.getByRole("button", { name: /sign out/i }));

    await waitFor(() => expect(mockAssign).toHaveBeenCalledWith("/login"));
  });

  it("redirects only after signOut resolves, not before", async () => {
    let resolveSignOut!: () => void;
    mockSignOut.mockReturnValueOnce(
      new Promise<{ error: null }>((res) => {
        resolveSignOut = () => res({ error: null });
      })
    );

    render(<SignOutButton />);
    await userEvent.click(screen.getByRole("button", { name: /sign out/i }));

    // signOut still pending — no redirect yet
    expect(mockAssign).not.toHaveBeenCalled();

    resolveSignOut();
    await waitFor(() => expect(mockAssign).toHaveBeenCalledWith("/login"));
  });
});
