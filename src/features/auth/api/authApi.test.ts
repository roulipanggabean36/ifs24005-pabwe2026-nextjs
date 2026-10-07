import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/helpers/apiHelper", () => ({
  fetchApi: vi.fn(),
  putAccessToken: vi.fn(),
  getAccessToken: vi.fn(),
}));

import { fetchApi, putAccessToken } from "@/helpers/apiHelper";
import { loginApi, registerApi, logoutApi } from "./authApi";

const fetchMock = vi.mocked(fetchApi);

describe("authApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loginApi: POST /auth/login tanpa auth, lalu menyimpan token", async () => {
    fetchMock.mockResolvedValue({
      status: "success",
      message: "ok",
      data: { user: { id: 1 }, token: "tok" },
    });

    const result = await loginApi("a@a.com", "pass");

    expect(fetchMock).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ email: "a@a.com", password: "pass" }),
    });
    expect(putAccessToken).toHaveBeenCalledWith("tok");
    expect(result.data?.token).toBe("tok");
  });

  it("loginApi: tanpa token pada respons, token tidak disimpan", async () => {
    fetchMock.mockResolvedValue({ status: "success", message: "ok" });

    await loginApi("a@a.com", "pass");

    expect(putAccessToken).not.toHaveBeenCalled();
  });

  it("registerApi: POST /auth/register dengan nama, email, kata sandi", async () => {
    fetchMock.mockResolvedValue({ status: "success", message: "registered" });

    const result = await registerApi("Name", "a@a.com", "pass");

    expect(fetchMock).toHaveBeenCalledWith("/auth/register", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ name: "Name", email: "a@a.com", password: "pass" }),
    });
    expect(result.message).toBe("registered");
  });

  it("logoutApi: POST /auth/logout lalu menghapus token", async () => {
    fetchMock.mockResolvedValue({ status: "success", message: "bye" });

    await logoutApi();

    expect(fetchMock).toHaveBeenCalledWith("/auth/logout", { method: "POST" });
    expect(putAccessToken).toHaveBeenCalledWith(null);
  });

  it("logoutApi: token tetap dihapus walau server gagal, error diteruskan", async () => {
    fetchMock.mockRejectedValue(new Error("down"));

    await expect(logoutApi()).rejects.toThrow("down");
    expect(putAccessToken).toHaveBeenCalledWith(null);
  });
});
