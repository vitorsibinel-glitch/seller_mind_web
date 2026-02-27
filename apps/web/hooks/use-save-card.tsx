import { toast } from "sonner";
import { usePost } from "./use-api";
import type { CheckoutFormData } from "@/schemas/checkoutSchema";

export function useSaveCard() {
  const { mutateAsync, isPending } = usePost("/api/subscriptions/save-card", {
    onSuccess: () => {
      return true;
    },
    onError: () => {
      toast.error(
        "Erro ao efetuar pagamento. Verifique os dados do cartão e tente novamente.",
      );
      return false;
    },
  });

  async function saveCard(data: CheckoutFormData): Promise<boolean> {
    const ok = await mutateAsync(data);
    return ok as boolean;
  }

  return { saveCard, isPending };
}
