import { fetchApi } from "@/helpers/apiHelper";
import type { ApiResult, User } from "@/types";

export async function getAllUsersApi() {
  return fetchApi<ApiResult<{ users: User[] }>>("/users");
}

export async function getProfileApi() {
  return fetchApi<ApiResult<{ user: User }>>("/users/me");
}

export async function updateProfileApi(name: string, email: string) {
  return fetchApi<ApiResult<{ user: User }>>("/users/me", {
    method: "PUT",
    body: JSON.stringify({ name, email }),
  });
}

export async function changePhotoApi(file: File) {
  const formData = new FormData();
  formData.append("photo", file);
  return fetchApi<ApiResult>("/users/me/photo", {
    method: "POST",
    body: formData,
  });
}

export async function changePasswordApi(
  password: string,
  new_password: string,
  new_password_confirmation: string
) {
  return fetchApi<ApiResult>("/users/password", {
    method: "PUT",
    body: JSON.stringify({
      password,
      new_password,
      new_password_confirmation,
    }),
  });
}
