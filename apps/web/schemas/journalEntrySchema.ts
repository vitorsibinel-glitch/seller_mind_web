import z from "zod";

export const journalLineSchema = z
  .object({
    accountId: z.string().min(1, "Conta contábil é obrigatória"),

    description: z.string().optional(),

    debit: z.number().min(0).optional(),
    credit: z.number().min(0).optional(),

    invoiceId: z.string().nullable().optional(),
    documentRef: z.string().optional(),
  })
  .superRefine((line, ctx) => {
    const debit = line.debit ?? 0;
    const credit = line.credit ?? 0;

    if (debit > 0 && credit > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Uma linha não pode ter débito e crédito simultaneamente",
      });
    }

    if (debit === 0 && credit === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cada linha deve possuir débito ou crédito",
      });
    }
  });

export const createJournalEntrySchema = z
  .object({
    date: z.string().min(1, "Data é obrigatória"),
    description: z.string(),
    lines: z
      .array(journalLineSchema)
      .min(2, "O lançamento deve possuir ao menos duas linhas"),
  })
  .superRefine((entry, ctx) => {
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of entry.lines) {
      totalDebit += line.debit ?? 0;
      totalCredit += line.credit ?? 0;
    }

    const d = Math.round(totalDebit * 100);
    const c = Math.round(totalCredit * 100);

    if (d !== c) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Lançamento não balanceado: total de débitos difere do total de créditos",
        path: ["lines"],
      });
    }
  });

export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;

export type CreateJournalLineInput = z.infer<typeof journalLineSchema>;
