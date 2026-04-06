export interface StockMovementDTO {
  _id: string;
  productSku: string;
  type:
    | "LOCAL_TO_FBA_TRANSIT"
    | "CANCEL_FBA_TRANSIT"
    | "CANCEL_ADD_TO_LOCAL_STOCK"
    | "CONFIRM_FBA_RECEIPT"
    | "ADD_TO_LOCAL_STOCK";
  quantity: number;
  createdAt: string;
  before: {
    localQuantity: number;
    inTransitToFBA: number;
  };
  after: {
    localQuantity: number;
    inTransitToFBA: number;
  };
  status?: "pending" | "confirmed";
  product?: {
    name: string;
    imageUrl?: string;
  };
  notes?: string;
  relatedMovementId?: string;
  cancelled?: boolean;
  cancelledAt?: Date;
  confirmed: boolean;
  confirmedAt: Date;
}

export interface StockMovementDataDTO {
  movements: StockMovementDTO[];
}
