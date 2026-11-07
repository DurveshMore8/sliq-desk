import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import app from "./app.js";

describe("GET /health", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(
    () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
      }),
  );

  it("returns status ok", async () => {
    const res = await fetch(`${baseUrl}/health`);
    const body = (await res.json()) as { status: string };
    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
  });
});
