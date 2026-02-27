export interface InvoiceDTO {
  _id: string;
  number: string;
  type: "entry" | "exit";
  emittedAt: string;
  totalAmount: number;
  cnpjCpf: string;
  partnerName?: string;
  status: "pending" | "booked" | "canceled";
  note?: string;
}

export interface InvoiceDataDTO {
  invoices: InvoiceDTO[];
  stats: {
    totalInvoices: number;
    exitTotalAmount: number;
    entryTotalAmount: number;
  };
}
