import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/helpers/apiHelper", () => ({
  fetchApi: vi.fn(),
  putAccessToken: vi.fn(),
  getAccessToken: vi.fn(),
}));

import { fetchApi } from "@/helpers/apiHelper";
import {
  getAllPostsApi,
  getDetailPostApi,
  addPostApi,
  updatePostApi,
  changeCoverPostApi,
  deletePostApi,
  likePostApi,
  addCommentApi,
  deleteCommentApi,
  deleteAllPostsApi,
} from "./postApi";

const fetchMock = vi.mocked(fetchApi);

describe("postApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockResolvedValue({ status: "success", message: "ok" });
  });

  it("getAllPostsApi tanpa filter: tidak mengirim params", async () => {
    await getAllPostsApi();
    expect(fetchMock).toHaveBeenCalledWith("/posts", { params: undefined });
  });

  it("getAllPostsApi dengan isMe: mengirim is_me=1", async () => {
    await getAllPostsApi(true);
    expect(fetchMock).toHaveBeenCalledWith("/posts", { params: { is_me: 1 } });
  });

  it("getDetailPostApi: GET /posts/:id", async () => {
    await getDetailPostApi(7);
    expect(fetchMock).toHaveBeenCalledWith("/posts/7");
  });

  it("addPostApi: POST /posts dengan description", async () => {
    await addPostApi("halo");
    expect(fetchMock).toHaveBeenCalledWith("/posts", {
      method: "POST",
      body: JSON.stringify({ description: "halo" }),
    });
  });

  it("updatePostApi: PUT /posts/:id", async () => {
    await updatePostApi(3, "baru");
    expect(fetchMock).toHaveBeenCalledWith("/posts/3", {
      method: "PUT",
      body: JSON.stringify({ description: "baru" }),
    });
  });

  it("changeCoverPostApi: POST /posts/:id/cover dengan FormData field 'cover'", async () => {
    const file = new File(["x"], "c.png", { type: "image/png" });

    await changeCoverPostApi(3, file);

    const [endpoint, options] = fetchMock.mock.calls[0];
    expect(endpoint).toBe("/posts/3/cover");
    expect(options?.method).toBe("POST");
    expect((options?.body as FormData).get("cover")).toBe(file);
  });

  it("deletePostApi: DELETE /posts/:id", async () => {
    await deletePostApi("9");
    expect(fetchMock).toHaveBeenCalledWith("/posts/9", { method: "DELETE" });
  });

  it("likePostApi: POST /posts/:id/likes dengan nilai like", async () => {
    await likePostApi(1, 0);
    expect(fetchMock).toHaveBeenCalledWith("/posts/1/likes", {
      method: "POST",
      body: JSON.stringify({ like: 0 }),
    });
  });

  it("addCommentApi: POST /posts/:id/comments", async () => {
    await addCommentApi(1, "bagus");
    expect(fetchMock).toHaveBeenCalledWith("/posts/1/comments", {
      method: "POST",
      body: JSON.stringify({ comment: "bagus" }),
    });
  });

  it("deleteCommentApi: DELETE /posts/:id/comments", async () => {
    await deleteCommentApi(1);
    expect(fetchMock).toHaveBeenCalledWith("/posts/1/comments", {
      method: "DELETE",
    });
  });

  it("deleteAllPostsApi: DELETE /posts", async () => {
    await deleteAllPostsApi();
    expect(fetchMock).toHaveBeenCalledWith("/posts", { method: "DELETE" });
  });
});
