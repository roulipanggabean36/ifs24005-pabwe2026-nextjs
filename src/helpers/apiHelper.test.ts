import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { DELCOM_BASEURL } from "@/lib/config";
import { fetchApi, getAccessToken, putAccessToken } from "./apiHelper";

function mockResponse(body: unknown, init: { ok?: boolean; status?: number; json?: boolean } = {}) {
  const { ok = true, status = 200, json = true } = init;
  return {
    ok,
    status,
    json: json
      ? vi.fn().mockResolvedValue(body)
      : vi.fn().mockRejectedValue(new Error("bukan json")),
  };
}

describe("apiHelper token utils", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("mengembalikan null bila token belum ada", () => {
    expect(getAccessToken()).toBeNull();
  });

  it("menyimpan dan mengambil token", () => {
    putAccessToken("test-token-123");
    expect(getAccessToken()).toBe("test-token-123");
  });

  it("menghapus token saat nilai null", () => {
    putAccessToken("abc");
    putAccessToken(null);
    expect(getAccessToken()).toBeNull();
  });

  it("di sisi server (tanpa window): getAccessToken null dan putAccessToken tidak melakukan apa pun", () => {
    const setSpy = vi.spyOn(Storage.prototype, "setItem");
    vi.stubGlobal("window", undefined);

    expect(getAccessToken()).toBeNull();
    expect(() => putAccessToken("x")).not.toThrow();
    expect(setSpy).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
    setSpy.mockRestore();
  });
});

describe("fetchApi", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("GET default: menambah base URL, header Accept, dan mengembalikan data", async () => {
    const body = { status: "success", message: "ok", data: { a: 1 } };
    fetchMock.mockResolvedValue(mockResponse(body));

    const result = await fetchApi("/posts");

    expect(result).toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith(`${DELCOM_BASEURL}/posts`, {
      method: "GET",
      headers: { Accept: "application/json" },
      body: null,
    });
  });

  it("endpoint tanpa awalan '/' tetap menghasilkan URL yang benar", async () => {
    fetchMock.mockResolvedValue(mockResponse({ status: "success" }));

    await fetchApi("posts");

    expect(fetchMock.mock.calls[0][0]).toBe(`${DELCOM_BASEURL}/posts`);
  });

  it("menyertakan bearer token bila tersedia", async () => {
    putAccessToken("tok");
    fetchMock.mockResolvedValue(mockResponse({ status: "success" }));

    await fetchApi("/users/me");

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer tok");
  });

  it("auth=true tanpa token: tidak ada header Authorization", async () => {
    fetchMock.mockResolvedValue(mockResponse({ status: "success" }));

    await fetchApi("/users/me");

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it("auth=false: token tidak dikirim walau tersimpan", async () => {
    putAccessToken("tok");
    fetchMock.mockResolvedValue(mockResponse({ status: "success" }));

    await fetchApi("/auth/login", { auth: false });

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it("query params: nilai kosong/null/undefined dilewati", async () => {
    fetchMock.mockResolvedValue(mockResponse({ status: "success" }));

    await fetchApi("/posts", {
      params: { is_me: 1, q: "halo dunia", a: undefined, b: null, c: "" },
    });

    expect(fetchMock.mock.calls[0][0]).toBe(
      `${DELCOM_BASEURL}/posts?is_me=1&q=halo+dunia`
    );
  });

  it("query params yang semuanya kosong tidak menambah '?'", async () => {
    fetchMock.mockResolvedValue(mockResponse({ status: "success" }));

    await fetchApi("/posts", { params: { a: undefined } });

    expect(fetchMock.mock.calls[0][0]).toBe(`${DELCOM_BASEURL}/posts`);
  });

  it("body JSON: otomatis Content-Type application/json", async () => {
    fetchMock.mockResolvedValue(mockResponse({ status: "success" }));

    await fetchApi("/posts", { method: "POST", body: JSON.stringify({ a: 1 }) });

    const init = fetchMock.mock.calls[0][1];
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe('{"a":1}');
  });

  it("body JSON dengan Content-Type kustom: tidak ditimpa", async () => {
    fetchMock.mockResolvedValue(mockResponse({ status: "success" }));

    await fetchApi("/x", {
      method: "POST",
      body: "a=1",
      headers: { "Content-Type": "text/plain" },
    });

    expect(fetchMock.mock.calls[0][1].headers["Content-Type"]).toBe("text/plain");
  });

  it("body FormData: Content-Type tidak diset (dibiarkan browser)", async () => {
    fetchMock.mockResolvedValue(mockResponse({ status: "success" }));
    const form = new FormData();
    form.append("cover", new File(["x"], "c.png"));

    await fetchApi("/posts/1/cover", { method: "POST", body: form });

    expect(fetchMock.mock.calls[0][1].headers["Content-Type"]).toBeUndefined();
    expect(fetchMock.mock.calls[0][1].body).toBe(form);
  });

  it("respons bukan JSON: melempar pesan fallback", async () => {
    fetchMock.mockResolvedValue(mockResponse(null, { json: false }));

    await expect(fetchApi("/posts")).rejects.toThrow(
      "Gagal memproses respons server"
    );
  });

  it("respons gagal dengan message: melempar message dari server", async () => {
    fetchMock.mockResolvedValue(
      mockResponse(
        { status: "fail", message: "Kredensial akun tidak ditemukan" },
        { ok: false, status: 401 }
      )
    );

    await expect(fetchApi("/auth/login")).rejects.toThrow(
      "Kredensial akun tidak ditemukan"
    );
  });

  it("respons gagal tanpa message tetapi ada field validasi: menggabungkan pesan field", async () => {
    fetchMock.mockResolvedValue(
      mockResponse(
        { status: "fail", data: { field: ["Email wajib", "Sandi wajib"] } },
        { ok: false, status: 422 }
      )
    );

    await expect(fetchApi("/auth/register")).rejects.toThrow(
      "Email wajib, Sandi wajib"
    );
  });

  it("respons gagal tanpa message dan field: pesan dengan status HTTP", async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ data: {} }, { ok: false, status: 500 })
    );

    await expect(fetchApi("/posts")).rejects.toThrow("Request gagal (500)");
  });

  it("HTTP ok tetapi status 'fail': tetap dianggap gagal", async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ status: "fail", message: "Ditolak" }, { ok: true })
    );

    await expect(fetchApi("/posts")).rejects.toThrow("Ditolak");
  });
});
