import { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { useErrorHandler } from "./use-error-handler";
import { AxiosError } from "axios";
import api from "@/lib/http-client";
import { authorizedRequest } from "@/utils/authorized-request";

export function useGet<T>(url: string, options = {}) {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: [url],
    queryFn: async () => {
      try {
        const response = await authorizedRequest({ method: "get", url });
        return response.data as T;
      } catch (error) {
        if (error instanceof AxiosError) handleError(error);
        throw error;
      }
    },
    ...options,
  });
}

interface UsePostOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  headers?: Record<string, string>;
}

export function usePost<T>(url: string, options: UsePostOptions<T> = {}) {
  const { handleError } = useErrorHandler();
  const { headers: extraHeaders, ...mutationOptions } = options;

  return useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await authorizedRequest({
          method: "post",
          url,
          data,
          headers: extraHeaders,
        });
        return response.data as T;
      } catch (error) {
        if (error instanceof AxiosError) handleError(error);
        throw error;
      }
    },
    ...mutationOptions,
  });
}

export function usePut<T>(url: string, options = {}) {
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await api.put(url, data);
        return response.data as T;
      } catch (error) {
        if (error instanceof AxiosError) handleError(error);
        throw error;
      }
    },
    ...options,
  });
}

export function usePatch<T = unknown>(options: {
  onSuccess: (data: T) => void;
  onError: () => void;
}) {
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async ({ url, data }: { url: string; data?: any }) => {
      try {
        const response = await api.patch(url, data);
        return response.data as T;
      } catch (error) {
        if (error instanceof AxiosError) handleError(error);
        throw error;
      }
    },
    onSuccess: options.onSuccess,
    onError: options.onError,
  });
}

export function useDelete<T>() {
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async ({ url, data }: { url: string; data?: any }) => {
      try {
        const response = await api.delete(url, data);
        return response.data as T;
      } catch (error) {
        if (error instanceof AxiosError) handleError(error);
        throw error;
      }
    },
  });
}
