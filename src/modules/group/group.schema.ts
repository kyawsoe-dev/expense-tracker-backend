import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  memberEmails: z.array(z.string().trim().email()).max(20).optional()
});

export const renameGroupSchema = z.object({
  name: z.string().trim().min(1).max(80)
});

export const addGroupMemberSchema = z.object({
  email: z.string().trim().email()
});

export const memberSuggestionQuerySchema = z.object({
  query: z.string().trim().min(1).max(100),
  groupId: z.string().uuid().optional()
});
