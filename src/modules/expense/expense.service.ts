import { ExpenseRepository } from "./expense.repository";
import { AppError } from "../../common/errors/AppError";
import { GroupService } from "../group/group.service";

type ExpenseListFilters = {
  take: number;
  skip: number;
  search?: string;
  category?: string;
  year?: number;
  month?: number;
};

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

  async listExpenses(userId: string, filters: ExpenseListFilters) {
    const normalized = this.normalizeListFilters(filters);
    const { items, total } = await this.repo.findManyPage(userId, normalized);

    return {
      items,
      total,
      take: normalized.take,
      skip: normalized.skip,
      hasMore: normalized.skip + items.length < total,
      nextSkip: normalized.skip + items.length < total
        ? normalized.skip + items.length
        : null,
      filters: {
        search: normalized.search,
        category: normalized.category,
        year: normalized.year,
        month: normalized.month
      }
    };
  }

  async getExpense(userId: string, expenseId: string) {
    const expense = await this.repo.findById(expenseId, userId);
    if (!expense) {
      throw new AppError(404, "Expense not found");
    }
    return expense;
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
    return this.getMonthSummary(userId, {});
  }

  async getAllTimeSummary(userId: string) {
    const expenses = await this.repo.findAllForUser(userId);
    const byCategoryMap = new Map<string, number>();

    let total = 0;
    for (const expense of expenses) {
      const amount = Number(expense.amount);
      total += amount;
      byCategoryMap.set(
        expense.category,
        this.roundCurrency((byCategoryMap.get(expense.category) ?? 0) + amount)
      );
    }

    const byCategory = [...byCategoryMap.entries()]
      .map(([category, categoryTotal]) => ({
        category,
        total: this.roundCurrency(categoryTotal)
      }))
      .sort((a, b) => b.total - a.total);

    return {
      total: this.roundCurrency(total),
      transactionCount: expenses.length,
      topCategory: byCategory[0]?.category ?? null,
      byCategory,
      currency: "MMK"
    };
  }

  async getMonthSummary(userId: string, filters: { year?: number; month?: number }) {
    const { year, month, startDate, endDate } = this.resolveMonthRange(filters);
    const expenses = await this.repo.findForDateRange(userId, startDate, endDate);
    const byCategoryMap = new Map<string, number>();

    let total = 0;
    for (const expense of expenses) {
      const amount = Number(expense.amount);
      total += amount;
      byCategoryMap.set(
        expense.category,
        this.roundCurrency((byCategoryMap.get(expense.category) ?? 0) + amount)
      );
    }

    const byCategory = [...byCategoryMap.entries()]
      .map(([category, categoryTotal]) => ({
        category,
        total: this.roundCurrency(categoryTotal)
      }))
      .sort((a, b) => b.total - a.total);

    return {
      year,
      month,
      monthStart: startDate,
      monthEnd: endDate,
      total: this.roundCurrency(total),
      transactionCount: expenses.length,
      topCategory: byCategory[0]?.category ?? null,
      byCategory,
      currency: "MMK"
    };
  }

  async getYearAnalytics(userId: string, filters: { year?: number }) {
    const year = filters.year ?? new Date().getFullYear();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);
    const expenses = await this.repo.findForDateRange(userId, startDate, endDate);
    const totalsByMonth = new Array<number>(12).fill(0);
    const categoryTotals = new Map<string, number>();
    let total = 0;

    for (const expense of expenses) {
      const amount = Number(expense.amount);
      const monthIndex = expense.date.getMonth();

      totalsByMonth[monthIndex] = this.roundCurrency(totalsByMonth[monthIndex] + amount);
      categoryTotals.set(
        expense.category,
        this.roundCurrency((categoryTotals.get(expense.category) ?? 0) + amount)
      );
      total += amount;
    }

    const byMonth = totalsByMonth.map((monthTotal, index) => ({
      month: index + 1,
      label: new Date(year, index, 1).toLocaleString("en-US", { month: "short" }),
      total: this.roundCurrency(monthTotal)
    }));

    const byCategory = [...categoryTotals.entries()]
      .map(([category, categoryTotal]) => ({
        category,
        total: this.roundCurrency(categoryTotal)
      }))
      .sort((a, b) => b.total - a.total);

    return {
      year,
      yearStart: startDate,
      yearEnd: endDate,
      total: this.roundCurrency(total),
      averageMonthly: this.roundCurrency(total / 12),
      topCategory: byCategory[0]?.category ?? null,
      byMonth,
      byCategory,
      currency: "MMK"
    };
  }

  private normalizeListFilters(filters: ExpenseListFilters) {
    const take = Number.isFinite(filters.take) ? filters.take : 20;
    const skip = Number.isFinite(filters.skip) ? filters.skip : 0;
    const search = filters.search?.trim() || undefined;
    const category = filters.category?.trim() || undefined;
    const year = filters.year;
    const month = filters.month;
    const { startDate, endDate } = this.resolveOptionalDateRange({ year, month });

    return {
      take,
      skip,
      search,
      category,
      year,
      month,
      startDate,
      endDate
    };
  }

  private resolveOptionalDateRange(filters: { year?: number; month?: number }) {
    if (filters.year == null && filters.month == null) {
      return { startDate: undefined, endDate: undefined };
    }

    if (filters.month != null) {
      const year = filters.year ?? new Date().getFullYear();
      return {
        startDate: new Date(year, filters.month - 1, 1),
        endDate: new Date(year, filters.month, 1)
      };
    }

    const year = filters.year!;
    return {
      startDate: new Date(year, 0, 1),
      endDate: new Date(year + 1, 0, 1)
    };
  }

  private resolveMonthRange(filters: { year?: number; month?: number }) {
    const now = new Date();
    const year = filters.year ?? now.getFullYear();
    const month = filters.month ?? now.getMonth() + 1;

    return {
      year,
      month,
      startDate: new Date(year, month - 1, 1),
      endDate: new Date(year, month, 1)
    };
  }

  private roundCurrency(value: number) {
    return Math.round(value * 100) / 100;
  }
}
