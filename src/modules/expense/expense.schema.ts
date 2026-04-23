import { z } from "zod";

const expenseDateSchema = z.coerce.date({
  invalid_type_error: "Invalid date"
});

export const createExpenseSchema = z.object({
  title: z.string().trim().min(1).max(120),
  amount: z.number().positive(),
  category: z.string().trim().min(1).max(60),
  date: expenseDateSchema,
  note: z.string().trim().max(500).optional()
});

export const updateExpenseSchema = createExpenseSchema.partial();
