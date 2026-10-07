import { describe, it, expect, vi, afterEach } from "vitest";

async function loadConfig() {
  vi.resetModules();
  return import("./config");
}

describe("config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("memakai nilai default bila environment tidak diset", async () => {
    vi.stubEnv("NEXT_PUBLIC_DELCOM_BASEURL", "");
    vi.stubEnv("APP_PORT", "");
    const { DELCOM_BASEURL, APP_PORT } = await loadConfig();

    expect(DELCOM_BASEURL).toBe("https://open-api.delcom.org/api/v1");
    expect(APP_PORT).toBe(3000);
  });

  it("memakai nilai dari environment", async () => {
    vi.stubEnv("NEXT_PUBLIC_DELCOM_BASEURL", "http://localhost:8000/api/v1");
    vi.stubEnv("APP_PORT", "4321");
    const { DELCOM_BASEURL, APP_PORT } = await loadConfig();

    expect(DELCOM_BASEURL).toBe("http://localhost:8000/api/v1");
    expect(APP_PORT).toBe(4321);
  });

  it("APP_PORT non-numerik kembali ke 3000", async () => {
    vi.stubEnv("APP_PORT", "abc");
    const { APP_PORT } = await loadConfig();

    expect(APP_PORT).toBe(3000);
  });
});
