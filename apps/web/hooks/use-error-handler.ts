import { AxiosError } from "axios";
import { toast } from "@workspace/ui/lib/utils";

export function useErrorHandler() {
  const handleError = (error: AxiosError | Error) => {
    console.error("API Error:", error);

    // Erros da API
    if ((error as AxiosError).response?.data) {
      const response = (error as AxiosError).response!;
      const data = response.data;

      const message =
        typeof data === "object" && data !== null && "message" in data
          ? (data as { message?: string }).message
          : undefined;

      switch (response.status) {
        case 401:
          toast.error("Sessão expirada", {
            description: "Por favor, faça login novamente",
          });
          break;

        case 403:
          toast.error("Sem permissão", {
            description: "Você não tem permissão para esta ação",
          });
          break;

        case 404:
          toast.error("Não encontrado", {
            description: message || "O recurso solicitado não existe",
          });
          break;

        case 422:
          toast.error("Dados inválidos", {
            description: message || "Verifique os dados e tente novamente",
          });
          break;

        default:
          toast.error("Erro inesperado", {
            description: message || "Tente novamente em alguns instantes",
          });
      }
      return;
    }

    // Erros de rede
    if (error.message === "Network Error") {
      toast.error("Erro de conexão", {
        description: "Verifique sua conexão com a internet",
      });
      return;
    }

    // Outros erros
    toast.error("Erro inesperado", {
      description: "Por favor, tente novamente",
    });
  };

  return { handleError };
}
