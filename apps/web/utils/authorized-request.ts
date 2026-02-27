import api from "@/lib/http-client";

export async function authorizedRequest<T = any>(
  config: Parameters<typeof api.request>[0]
) {
  const headers = {
    ...(config.headers || {}),
    ...(config.data instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
  };

  return api.request<T>({
    ...config,
    headers,
  });
}
