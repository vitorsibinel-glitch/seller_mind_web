import { addMonths, addWeeks, addDays, addYears, setDate } from "date-fns";
import type { ExpenseRecurrence } from "@workspace/mongodb/models/expense";

interface RecurringExpenseParams {
  dueDate: Date;
  recurrence: ExpenseRecurrence;
}

export function generateRecurringDueDates({
  dueDate,
  recurrence,
}: RecurringExpenseParams): Date[] {
  const dueDates: Date[] = [];
  const interval = recurrence.interval || 1;

  const maxDate = recurrence.endDate
    ? recurrence.endDate
    : addMonths(new Date(), 6);

  let currentDate = new Date(dueDate);

  while (currentDate <= maxDate) {
    if (currentDate > dueDate) {
      dueDates.push(new Date(currentDate));
    }

    switch (recurrence.type) {
      case "daily":
        currentDate = addDays(currentDate, interval);
        break;

      case "weekly":
        currentDate = addWeeks(currentDate, interval);
        break;

      case "monthly":
        currentDate = addMonths(currentDate, interval);
        if (recurrence.dueDay) {
          const targetDay = recurrence.dueDay;
          const lastDayOfMonth = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            0,
          ).getDate();
          const validDay = Math.min(targetDay, lastDayOfMonth);
          currentDate = setDate(currentDate, validDay);
        }
        break;

      case "yearly":
        currentDate = addYears(currentDate, interval);
        break;

      default:
        return dueDates;
    }
  }

  return dueDates;
}

export function createRecurringExpensesData(
  originalExpense: {
    description: string;
    category: string;
    amount: number;
    dueDate: Date;
    recurrence?: ExpenseRecurrence;
    documentRef?: string;
    notes?: string;
    tags?: string[];
    storeId: any;
    createdByUserId: any;
  },
  recurringId: any,
): any[] {
  if (!originalExpense.recurrence) {
    return [];
  }

  const futureDates = generateRecurringDueDates({
    dueDate: originalExpense.dueDate,
    recurrence: originalExpense.recurrence,
  });

  return futureDates.map((dueDate) => ({
    description: originalExpense.description,
    category: originalExpense.category,
    amount: originalExpense.amount,
    dueDate,
    isRecurring: true,
    recurrence: originalExpense.recurrence,
    recurringId,
    documentRef: originalExpense.documentRef,
    notes: originalExpense.notes,
    tags: originalExpense.tags,
    storeId: originalExpense.storeId,
    createdByUserId: originalExpense.createdByUserId,
  }));
}
