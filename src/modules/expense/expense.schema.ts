import { z } from "zod";

const expenseDateSchema = z.coerce.date({
  invalid_type_error: "Invalid date"
});

const paginationSchema = z.coerce.number().int().min(0);

export const createExpenseSchema = z.object({
  title: z.string().trim().min(1).max(120),
  amount: z.number().positive(),
  category: z.string().trim().min(1).max(60),
  groupId: z.string().uuid().optional().nullable(),
  date: expenseDateSchema,
  note: z.string().trim().max(500).optional()
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const expenseListQuerySchema = z.object({
  take: z.coerce.number().int().min(1).max(100).default(20),
  skip: paginationSchema.default(0),
  search: z.string().trim().max(120).optional(),
  category: z.string().trim().min(1).max(60).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional()
});

export const expenseGroupListQuerySchema = z.object({
  take: z.coerce.number().int().min(1).max(100).default(20),
  skip: paginationSchema.default(0)
});

export const expenseMonthSummaryQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional()
});

export const expenseYearAnalyticsQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional()
});
