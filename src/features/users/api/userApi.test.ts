import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchApi } from "@/helpers/apiHelper";
import {
  getAllUsersApi,
  getProfileApi,
  updateProfileApi,
  changePhotoApi,
  changePasswordApi,
} from "./userApi";

vi.mock("@/helpers/apiHelper", () => ({
  fetchApi: vi.fn(),
  putAccessToken: vi.fn(),
  getAccessToken: vi.fn(),
}));

const mockFetchApi = vi.mocked(fetchApi);

describe("userApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAllUsersApi: GET /users dan mengembalikan respons apa adanya", async () => {
    const response = {
      status: "success",
      message: "ok",
      data: { users: [{ id: 1, name: "A", email: "a@a.com" }] },
    };
    mockFetchApi.mockResolvedValue(response);

    const result = await getAllUsersApi();

    expect(mockFetchApi).toHaveBeenCalledTimes(1);
    expect(mockFetchApi).toHaveBeenCalledWith("/users");
    expect(result).toBe(response);
  });

  it("getProfileApi: GET /users/me", async () => {
    const response = {
      status: "success",
      message: "ok",
      data: { user: { id: 1, name: "A", email: "a@a.com" } },
    };
    mockFetchApi.mockResolvedValue(response);

    const result = await getProfileApi();

    expect(mockFetchApi).toHaveBeenCalledWith("/users/me");
    expect(result).toBe(response);
  });

  it("updateProfileApi: PUT /users/me dengan body JSON {name, email}", async () => {
    mockFetchApi.mockResolvedValue({ status: "success", message: "diubah" });

    const result = await updateProfileApi("Rouli", "rouli@del.ac.id");

    expect(mockFetchApi).toHaveBeenCalledWith("/users/me", {
      method: "PUT",
      body: JSON.stringify({ name: "Rouli", email: "rouli@del.ac.id" }),
    });
    expect(result.message).toBe("diubah");
  });

  it("changePhotoApi: POST /users/me/photo dengan FormData berisi field 'photo'", async () => {
    mockFetchApi.mockResolvedValue({ status: "success", message: "foto diubah" });
    const file = new File(["bytes"], "foto.png", { type: "image/png" });

    const result = await changePhotoApi(file);

    expect(mockFetchApi).toHaveBeenCalledTimes(1);
    const [endpoint, options] = mockFetchApi.mock.calls[0];
    expect(endpoint).toBe("/users/me/photo");
    expect(options?.method).toBe("POST");
    expect(options?.body).toBeInstanceOf(FormData);
    const sent = (options?.body as FormData).get("photo") as File;
    expect(sent).toBeInstanceOf(File);
    expect(sent.name).toBe("foto.png");
    expect(result.message).toBe("foto diubah");
  });

  it("changePasswordApi: PUT /users/password dengan tiga field kata sandi", async () => {
    mockFetchApi.mockResolvedValue({ status: "success", message: "sandi diubah" });

    const result = await changePasswordApi("lama123", "baru1234", "baru1234");

    expect(mockFetchApi).toHaveBeenCalledWith("/users/password", {
      method: "PUT",
      body: JSON.stringify({
        password: "lama123",
        new_password: "baru1234",
        new_password_confirmation: "baru1234",
      }),
    });
    expect(result.message).toBe("sandi diubah");
  });

  it("meneruskan error dari fetchApi (tidak ditelan)", async () => {
    mockFetchApi.mockRejectedValue(new Error("Unauthorized"));

    await expect(getAllUsersApi()).rejects.toThrow("Unauthorized");
    await expect(getProfileApi()).rejects.toThrow("Unauthorized");
    await expect(updateProfileApi("a", "b")).rejects.toThrow("Unauthorized");
    await expect(changePhotoApi(new File([], "x.png"))).rejects.toThrow("Unauthorized");
    await expect(changePasswordApi("a", "b", "c")).rejects.toThrow("Unauthorized");
  });
});
