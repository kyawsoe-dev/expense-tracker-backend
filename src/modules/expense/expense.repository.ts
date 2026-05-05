import { Prisma, PrismaClient } from "@prisma/client";

type ExpenseListFilters = {
  take: number;
  skip: number;
  search?: string;
  category?: string;
  startDate?: Date;
  endDate?: Date;
};

export class ExpenseRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private readonly includeGroup = {
    group: {
      select: {
        id: true,
        name: true
      }
    },
    user: {
      select: {
        id: true,
        name: true,
        email: true
      }
    }
  } as const;

  create(data: {
    userId: string;
    title: string;
    amount: number;
    category: string;
    date: Date;
    note?: string;
    groupId?: string | null;
  }) {
    return this.prisma.expense.create({
      data,
      include: this.includeGroup
    });
  }

  findById(id: string, userId: string) {
    return this.prisma.expense.findFirst({
      where: { id, userId },
      include: this.includeGroup
    });
  }

  async findManyPage(userId: string, filters: ExpenseListFilters) {
    const where = this.buildWhere(userId, filters);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        include: this.includeGroup,
        take: filters.take,
        skip: filters.skip
      }),
      this.prisma.expense.count({ where })
    ]);

    return { items, total };
  }

  findByGroup(groupId: string, take = 20, skip = 0) {
    return this.prisma.expense.findMany({
      where: { groupId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: this.includeGroup,
      take,
      skip
    });
  }

  update(
    id: string,
    userId: string,
    data: Partial<{
      title: string;
      amount: number;
      category: string;
      date: Date;
      note: string | null;
      groupId: string | null;
    }>
  ) {
    return this.prisma.expense.updateMany({ where: { id, userId }, data });
  }

  delete(id: string, userId: string) {
    return this.prisma.expense.deleteMany({ where: { id, userId } });
  }

  findForDateRange(userId: string, startDate: Date, endDate: Date) {
    return this.prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lt: endDate
        }
      },
      select: {
        id: true,
        amount: true,
        category: true,
        date: true
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }]
    });
  }

  findAllForUser(userId: string) {
    return this.prisma.expense.findMany({
      where: { userId },
      select: {
        id: true,
        amount: true,
        category: true,
        date: true
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }]
    });
  }

  private buildWhere(userId: string, filters: ExpenseListFilters): Prisma.ExpenseWhereInput {
    const search = filters.search?.trim();
    const category = filters.category?.trim();

    const where: Prisma.ExpenseWhereInput = {
      userId
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { note: { contains: search, mode: "insensitive" } },
        { group: { name: { contains: search, mode: "insensitive" } } }
      ];
    }

    if (category) {
      where.category = {
        equals: category,
        mode: "insensitive"
      };
    }

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.date.lt = filters.endDate;
      }
    }

    return where;
  }
}
