/**
 * Network tests for DeleteAccountButton
 *
 * What we're verifying:
 *  - Button fires POST /api/account/delete (MSW intercepts the real fetch)
 *  - On 200: calls supabase.auth.signOut(), then redirects to /signup
 *  - On 4xx/5xx: shows the error message from the response body
 *  - On cancelled confirm dialog: no request is sent at all
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "@/tests/server";
import { DeleteAccountButton } from "../delete-account-button";

// ── router mock ───────────────────────────────────────────────────────────────
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// ── supabase client mock ──────────────────────────────────────────────────────
const mockSignOut = vi.fn().mockResolvedValue({ error: null });
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signOut: mockSignOut } }),
}));

// ─────────────────────────────────────────────────────────────────────────────

describe("DeleteAccountButton — network", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("sends POST to /api/account/delete when user confirms", async () => {
    let requestReceived = false;

    server.use(
      http.post("/api/account/delete", () => {
        requestReceived = true;
        return HttpResponse.json({}, { status: 200 });
      })
    );

    render(<DeleteAccountButton />);
    await userEvent.click(screen.getByRole("button", { name: /delete account/i }));

    await waitFor(() => expect(requestReceived).toBe(true));
  });

  it("calls supabase.auth.signOut() and redirects to /signup on 200", async () => {
    render(<DeleteAccountButton />);
    await userEvent.click(screen.getByRole("button", { name: /delete account/i }));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith("/signup");
    });
  });

  it("shows the error string from the response body on 500", async () => {
    server.use(
      http.post("/api/account/delete", () =>
        HttpResponse.json({ error: "Database unavailable" }, { status: 500 })
      )
    );

    render(<DeleteAccountButton />);
    await userEvent.click(screen.getByRole("button", { name: /delete account/i }));

    await waitFor(() =>
      expect(screen.getByText("Database unavailable")).toBeInTheDocument()
    );
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("falls back to generic message when 500 body has no error field", async () => {
    server.use(
      http.post("/api/account/delete", () =>
        HttpResponse.json(null, { status: 500 })
      )
    );

    render(<DeleteAccountButton />);
    await userEvent.click(screen.getByRole("button", { name: /delete account/i }));

    await waitFor(() =>
      expect(screen.getByText("Could not delete account.")).toBeInTheDocument()
    );
  });

  it("does NOT send any request when user dismisses the confirm dialog", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const fetchSpy = vi.spyOn(global, "fetch");

    render(<DeleteAccountButton />);
    await userEvent.click(screen.getByRole("button", { name: /delete account/i }));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mockSignOut).not.toHaveBeenCalled();
  });
});
