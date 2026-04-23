import { ExpenseRepository } from "./expense.repository";
import { AppError } from "../../common/errors/AppError";

export class ExpenseService {
  constructor(private readonly repo: ExpenseRepository) {}

  createExpense(
    userId: string,
    payload: { title: string; amount: number; category: string; date: Date; note?: string }
  ) {
    return this.repo.create({
      userId,
      title: payload.title.trim(),
      amount: payload.amount,
      category: payload.category.trim(),
      date: payload.date,
      note: payload.note?.trim()
    });
  }

  listExpenses(userId: string, take?: number, skip?: number) {
    return this.repo.findMany(userId, take, skip);
  }

  async updateExpense(
    userId: string,
    expenseId: string,
    payload: Partial<{ title: string; amount: number; category: string; date: Date; note: string | null }>
  ) {
    const exists = await this.repo.findById(expenseId, userId);
    if (!exists) throw new AppError(404, "Expense not found");

    const result = await this.repo.update(expenseId, userId, {
      ...payload
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
