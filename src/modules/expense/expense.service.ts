import { ExpenseRepository } from "./expense.repository";
import { AppError } from "../../common/errors/AppError";
import { GroupService } from "../group/group.service";

export class ExpenseService {
  constructor(
    private readonly repo: ExpenseRepository,
    private readonly groupService: GroupService
  ) {}

  createExpense(
    userId: string,
    payload: {
      title: string;
      amount: number;
      category: string;
      date: Date;
      note?: string;
      groupId?: string | null;
    }
  ) {
    return this.createExpenseInternal(userId, payload);
  }

  private async createExpenseInternal(
    userId: string,
    payload: {
      title: string;
      amount: number;
      category: string;
      date: Date;
      note?: string;
      groupId?: string | null;
    }
  ) {
    const groupId = payload.groupId?.trim() ?? null;
    if (groupId) {
      await this.groupService.ensureAccessibleGroup(groupId, userId);
    }

    return this.repo.create({
      userId,
      title: payload.title.trim(),
      amount: payload.amount,
      category: payload.category.trim(),
      date: payload.date,
      note: payload.note?.trim(),
      groupId
    });
  }

  listExpenses(userId: string, take?: number, skip?: number) {
    return this.repo.findMany(userId, take, skip);
  }

  listExpensesByGroup(userId: string, groupId: string, take?: number, skip?: number) {
    return this.listExpensesByGroupInternal(userId, groupId, take, skip);
  }

  private async listExpensesByGroupInternal(
    userId: string,
    groupId: string,
    take?: number,
    skip?: number
  ) {
    await this.groupService.ensureAccessibleGroup(groupId, userId);
    return this.repo.findByGroup(groupId, take, skip);
  }

  async updateExpense(
    userId: string,
    expenseId: string,
    payload: Partial<{
      title: string;
      amount: number;
      category: string;
      date: Date;
      note: string | null;
      groupId: string | null;
    }>
  ) {
    const exists = await this.repo.findById(expenseId, userId);
    if (!exists) throw new AppError(404, "Expense not found");

    let groupId = payload.groupId;
    if (typeof groupId === "string") {
      groupId = groupId.trim();
      if (groupId) {
        await this.groupService.ensureAccessibleGroup(groupId, userId);
      } else {
        groupId = null;
      }
    }

    const result = await this.repo.update(expenseId, userId, {
      ...payload,
      title: payload.title?.trim(),
      category: payload.category?.trim(),
      note: typeof payload.note === "string" ? payload.note.trim() : payload.note,
      groupId
    });

    if (result.count === 0) throw new AppError(404, "Expense not found");
    return this.repo.findById(expenseId, userId);
  }

  async deleteExpense(userId: string, expenseId: string) {
    const result = await this.repo.delete(expenseId, userId);
    if (result.count === 0) throw new AppError(404, "Expense not found");
    return { success: true };
  }

  async getCurrentMonthSummary(userId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const byCategory = await this.repo.monthlySummaryByCategory(userId, monthStart, monthEnd);
    const total = byCategory.reduce((sum, item) => sum + item.total, 0);

    return {
      monthStart,
      monthEnd,
      total,
      byCategory
    };
  }
}
