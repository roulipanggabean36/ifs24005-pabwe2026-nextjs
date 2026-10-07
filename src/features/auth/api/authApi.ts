import { fetchApi, putAccessToken } from "@/helpers/apiHelper";
import type { ApiResult, User } from "@/types";

export async function loginApi(email: string, password: string) {
  const result = await fetchApi<
    ApiResult<{ user: User; token: string }>
  >("/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ email, password }),
  });

  if (result.data?.token) {
    putAccessToken(result.data.token);
  }

  return result;
}

export async function registerApi(
  name: string,
  email: string,
  password: string
) {
  return fetchApi<ApiResult>("/auth/register", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ name, email, password }),
  });
}

export async function logoutApi() {
  try {
    await fetchApi<ApiResult>("/auth/logout", { method: "POST" });
  } finally {
    putAccessToken(null);
  }
}
