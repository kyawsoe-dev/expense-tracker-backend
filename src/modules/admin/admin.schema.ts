import { z } from "zod";

const paginationSchema = z.coerce.number().int().min(0);
const optionalUuidSchema = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().uuid().optional().nullable()
);

export const adminPaginationQuerySchema = z.object({
  take: z.coerce.number().int().min(1).max(100).default(20),
  skip: paginationSchema.default(0),
  search: z.string().trim().max(120).optional()
});

export const adminUserCreateSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(100),
  name: z.string().trim().min(1).max(100).optional()
});

export const adminUserUpdateSchema = z.object({
  email: z.string().trim().email().optional(),
  password: z.string().min(8).max(100).optional(),
  name: z.string().trim().min(1).max(100).optional()
});

export const adminGroupCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  ownerId: z.string().uuid(),
  memberIds: z.array(z.string().uuid()).max(50).optional()
});

export const adminGroupUpdateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional()
});

export const adminExpenseListQuerySchema = z.object({
  take: z.coerce.number().int().min(1).max(100).default(20),
  skip: paginationSchema.default(0),
  search: z.string().trim().max(120).optional(),
  userId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  category: z.string().trim().min(1).max(60).optional()
});

export const adminExpenseCreateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  amount: z.number().positive(),
  category: z.string().trim().min(1).max(60),
  userId: z.string().uuid(),
  groupId: optionalUuidSchema,
  date: z.coerce.date({
    invalid_type_error: "Invalid date"
  }),
  note: z.string().trim().max(500).optional()
});

export const adminExpenseUpdateSchema = adminExpenseCreateSchema.partial();

export const adminExpenseByUserQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  search: z.string().trim().max(120).optional()
});
