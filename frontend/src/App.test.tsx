import { render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import App from "./App";

afterEach(() => {
  vi.unstubAllGlobals();
});

it("shows the backend status when the API responds", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: "OK",
        data: { status: "ok", database: "connected", timestamp: "now" },
      }),
    }),
  );

  render(<App />);

  expect(await screen.findByText(/Backend status: ok/)).toBeInTheDocument();
});

it("shows an error when the API is unreachable", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

  render(<App />);

  expect(await screen.findByText(/unreachable/)).toBeInTheDocument();
});
