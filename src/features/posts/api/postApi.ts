import { fetchApi } from "@/helpers/apiHelper";
import type { ApiResult, Post } from "@/types";

export async function getAllPostsApi(isMe?: boolean) {
  return fetchApi<ApiResult<{ posts: Post[] }>>("/posts", {
    params: isMe ? { is_me: 1 } : undefined,
  });
}

export async function getDetailPostApi(id: number | string) {
  return fetchApi<ApiResult<{ post: Post }>>(`/posts/${id}`);
}

export async function addPostApi(description: string) {
  return fetchApi<ApiResult<{ post_id: number }>>("/posts", {
    method: "POST",
    body: JSON.stringify({ description }),
  });
}

export async function updatePostApi(id: number | string, description: string) {
  return fetchApi<ApiResult>(`/posts/${id}`, {
    method: "PUT",
    body: JSON.stringify({ description }),
  });
}

export async function changeCoverPostApi(id: number | string, file: File) {
  const formData = new FormData();
  formData.append("cover", file);
  return fetchApi<ApiResult>(`/posts/${id}/cover`, {
    method: "POST",
    body: formData,
  });
}

export async function deletePostApi(id: number | string) {
  return fetchApi<ApiResult>(`/posts/${id}`, { method: "DELETE" });
}

export async function likePostApi(id: number | string, like: 0 | 1) {
  return fetchApi<ApiResult>(`/posts/${id}/likes`, {
    method: "POST",
    body: JSON.stringify({ like }),
  });
}

export async function addCommentApi(id: number | string, comment: string) {
  return fetchApi<ApiResult>(`/posts/${id}/comments`, {
    method: "POST",
    body: JSON.stringify({ comment }),
  });
}

export async function deleteCommentApi(id: number | string) {
  return fetchApi<ApiResult>(`/posts/${id}/comments`, {
    method: "DELETE",
  });
}

export async function deleteAllPostsApi() {
  return fetchApi<ApiResult>("/posts", { method: "DELETE" });
}
