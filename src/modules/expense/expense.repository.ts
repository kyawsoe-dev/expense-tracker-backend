import { PrismaClient } from "@prisma/client";

export class ExpenseRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: {
    userId: string;
    title: string;
    amount: number;
    category: string;
    date: Date;
    note?: string;
  }) {
    return this.prisma.expense.create({ data });
  }

  findById(id: string, userId: string) {
    return this.prisma.expense.findFirst({ where: { id, userId } });
  }

  findMany(userId: string, take = 20, skip = 0) {
    return this.prisma.expense.findMany({
      where: { userId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take,
      skip
    });
  }

  update(
    id: string,
    userId: string,
    data: Partial<{ title: string; amount: number; category: string; date: Date; note: string | null }>
  ) {
    return this.prisma.expense.updateMany({ where: { id, userId }, data });
  }

  delete(id: string, userId: string) {
    return this.prisma.expense.deleteMany({ where: { id, userId } });
  }

  async monthlySummaryByCategory(userId: string, monthStart: Date, monthEnd: Date) {
    const grouped = await this.prisma.expense.groupBy({
      by: ["category"],
      where: {
        userId,
        date: {
          gte: monthStart,
          lt: monthEnd
        }
      },
      _sum: {
        amount: true
      }
    });

    return grouped.map((g) => ({
      category: g.category,
      total: Number(g._sum.amount ?? 0)
    }));
  }
}
