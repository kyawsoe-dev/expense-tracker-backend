import bcrypt from "bcryptjs";
import { Prisma, PrismaClient } from "@prisma/client";
import { AppError } from "../../common/errors/AppError";

type PrismaLike = PrismaClient;

type Pagination = {
  take: number;
  skip: number;
  search?: string;
};

type ExpenseFilters = Pagination & {
  userId?: string;
  groupId?: string;
  category?: string;
};

type UserPayload = {
  email: string;
  password: string;
  name?: string;
};

type UserUpdatePayload = Partial<UserPayload>;

type GroupPayload = {
  name: string;
  ownerId: string;
  memberIds?: string[];
};

type GroupUpdatePayload = {
  name?: string;
};

type ExpensePayload = {
  title: string;
  amount: number;
  category: string;
  userId: string;
  groupId?: string | null;
  date: Date;
  note?: string;
};

type ExpenseUpdatePayload = Partial<ExpensePayload>;

export class AdminService {
  constructor(private readonly prisma: PrismaLike) {}

  async getOverview() {
    const [
      totalUsers,
      totalExpenses,
      totalGroups,
      totalMembers,
      totalAmount,
      recentUsers,
      recentExpenses,
      recentGroups
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.expense.count(),
      this.prisma.expenseGroup.count(),
      this.prisma.expenseGroupMember.count(),
      this.prisma.expense.aggregate({ _sum: { amount: true } }),
      this.prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          _count: {
            select: {
              expenses: true,
              ownedGroups: true,
              groupMemberships: true
            }
          }
        }
      }),
      this.prisma.expense.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          amount: true,
          category: true,
          date: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          group: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      this.prisma.expenseGroup.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          name: true,
          createdAt: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              members: true,
              expenses: true
            }
          }
        }
      })
    ]);

    return {
      totals: {
        users: totalUsers,
        expenses: totalExpenses,
        groups: totalGroups,
        members: totalMembers,
        amount: this.roundCurrency(Number(totalAmount._sum.amount ?? 0))
      },
      recentUsers: recentUsers.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        expenseCount: user._count.expenses,
        ownedGroupCount: user._count.ownedGroups,
        membershipCount: user._count.groupMemberships
      })),
      recentExpenses: recentExpenses.map((expense) => ({
        id: expense.id,
        title: expense.title,
        amount: Number(expense.amount),
        category: expense.category,
        date: expense.date,
        createdAt: expense.createdAt,
        user: expense.user,
        group: expense.group
      })),
      recentGroups: recentGroups.map((group) => ({
        id: group.id,
        name: group.name,
        createdAt: group.createdAt,
        owner: group.owner,
        memberCount: group._count.members,
        expenseCount: group._count.expenses
      }))
    };
  }

  async getAnalytics() {
    const [users, groups, expenses] = await Promise.all([
      this.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          _count: {
            select: {
              expenses: true,
              ownedGroups: true,
              groupMemberships: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      this.prisma.expenseGroup.findMany({
        select: {
          id: true,
          name: true,
          createdAt: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              members: true,
              expenses: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      this.prisma.expense.findMany({
        select: {
          id: true,
          amount: true,
          category: true,
          date: true,
          createdAt: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          groupId: true,
          group: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [{ date: "asc" }, { createdAt: "asc" }]
      })
    ]);

    const currentYear = new Date().getFullYear();
    const monthlyExpenses = expenses.filter(
      (expense) => expense.date.getFullYear() === currentYear
    );
    const amountByMonth = new Array(12).fill(0).map((_, index) => ({
      month: index + 1,
      label: new Date(currentYear, index, 1).toLocaleString("en-US", {
        month: "short"
      }),
      total: 0,
      transactionCount: 0
    }));
    const amountByCategory = new Map<string, { category: string; total: number; transactionCount: number }>();
    const amountByUser = new Map<
      string,
      { userId: string; name: string; email: string; total: number; expenseCount: number; ownedGroupCount: number; membershipCount: number }
    >();
    const amountByGroup = new Map<
      string,
      {
        groupId: string;
        name: string;
        total: number;
        expenseCount: number;
        memberCount: number;
        owner: { id: string; name: string | null; email: string };
      }
    >();

    for (const expense of monthlyExpenses) {
      const amount = Number(expense.amount);
      const monthIndex = expense.date.getMonth();
      amountByMonth[monthIndex].total = this.roundCurrency(
        amountByMonth[monthIndex].total + amount
      );
      amountByMonth[monthIndex].transactionCount += 1;
    }

    for (const expense of expenses) {
      const amount = Number(expense.amount);

      const categoryBucket = amountByCategory.get(expense.category) ?? {
        category: expense.category,
        total: 0,
        transactionCount: 0
      };
      categoryBucket.total = this.roundCurrency(categoryBucket.total + amount);
      categoryBucket.transactionCount += 1;
      amountByCategory.set(expense.category, categoryBucket);

      const userBucket = amountByUser.get(expense.userId) ?? {
        userId: expense.user.id,
        name: expense.user.name || "Unnamed User",
        email: expense.user.email,
        total: 0,
        expenseCount: 0,
        ownedGroupCount: 0,
        membershipCount: 0
      };
      userBucket.total = this.roundCurrency(userBucket.total + amount);
      userBucket.expenseCount += 1;
      amountByUser.set(expense.userId, userBucket);

      if (expense.group) {
        const groupBucket = amountByGroup.get(expense.groupId ?? expense.group.id) ?? {
          groupId: expense.group.id,
          name: expense.group.name,
          total: 0,
          expenseCount: 0,
          memberCount: 0,
          owner: {
            id: "",
            name: null,
            email: ""
          }
        };
        groupBucket.total = this.roundCurrency(groupBucket.total + amount);
        groupBucket.expenseCount += 1;
        amountByGroup.set(expense.group.id, groupBucket);
      }
    }

    for (const user of users) {
      const bucket = amountByUser.get(user.id);
      if (bucket) {
        bucket.ownedGroupCount = user._count.ownedGroups;
        bucket.membershipCount = user._count.groupMemberships;
      } else {
        amountByUser.set(user.id, {
          userId: user.id,
          name: user.name || "Unnamed User",
          email: user.email,
          total: 0,
          expenseCount: user._count.expenses,
          ownedGroupCount: user._count.ownedGroups,
          membershipCount: user._count.groupMemberships
        });
      }
    }

    for (const group of groups) {
      const bucket = amountByGroup.get(group.id);
      if (bucket) {
        bucket.memberCount = group._count.members;
        bucket.owner = {
          id: group.owner?.id ?? "",
          name: group.owner?.name ?? null,
          email: group.owner?.email ?? ""
        };
      } else {
        amountByGroup.set(group.id, {
          groupId: group.id,
          name: group.name,
          total: 0,
          expenseCount: group._count.expenses,
          memberCount: group._count.members,
          owner: {
            id: group.owner?.id ?? "",
            name: group.owner?.name ?? null,
            email: group.owner?.email ?? ""
          }
        });
      }
    }

    return {
      totals: {
        users: users.length,
        groups: groups.length,
        expenses: expenses.length,
        amount: this.roundCurrency(
          expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
        )
      },
      year: currentYear,
      byMonth: amountByMonth,
      byCategory: [...amountByCategory.values()].sort((a, b) => b.total - a.total),
      byUser: [...amountByUser.values()].sort((a, b) => b.total - a.total),
      byGroup: [...amountByGroup.values()].sort((a, b) => b.total - a.total),
      currency: "MMK"
    };
  }

  async listUsers(query: Pagination) {
    const where = this.buildUserWhere(query.search);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: query.take,
        skip: query.skip,
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              expenses: true,
              ownedGroups: true,
              groupMemberships: true
            }
          }
        }
      }),
      this.prisma.user.count({ where })
    ]);

    return {
      items: items.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        expenseCount: user._count.expenses,
        ownedGroupCount: user._count.ownedGroups,
        membershipCount: user._count.groupMemberships
      })),
      total,
      take: query.take,
      skip: query.skip,
      hasMore: query.skip + items.length < total,
      nextSkip: query.skip + items.length < total ? query.skip + items.length : null
    };
  }

  async createUser(payload: UserPayload) {
    const email = payload.email.trim().toLowerCase();
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) {
      throw new AppError(409, "Email already registered");
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: payload.name?.trim() || null
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return user;
  }

  async updateUser(userId: string, payload: UserUpdatePayload) {
    const current = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!current) {
      throw new AppError(404, "User not found");
    }

    const nextEmail = payload.email?.trim().toLowerCase();
    if (nextEmail && nextEmail !== current.email) {
      const exists = await this.prisma.user.findUnique({ where: { email: nextEmail } });
      if (exists) {
        throw new AppError(409, "Email already registered");
      }
    }

    const data: Prisma.UserUpdateInput = {
      ...(nextEmail ? { email: nextEmail } : {}),
      ...(payload.name !== undefined ? { name: payload.name.trim() || null } : {})
    };

    if (payload.password) {
      data.passwordHash = await bcrypt.hash(payload.password, 12);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async deleteUser(userId: string) {
    const result = await this.prisma.user.deleteMany({ where: { id: userId } });
    if (result.count === 0) {
      throw new AppError(404, "User not found");
    }
    return { success: true };
  }

  async listGroups(query: Pagination) {
    const where = this.buildGroupWhere(query.search);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.expenseGroup.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: query.take,
        skip: query.skip,
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              members: true,
              expenses: true
            }
          }
        }
      }),
      this.prisma.expenseGroup.count({ where })
    ]);

    return {
      items: items.map((group) => ({
        id: group.id,
        name: group.name,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        owner: group.owner,
        memberCount: group._count.members,
        expenseCount: group._count.expenses
      })),
      total,
      take: query.take,
      skip: query.skip,
      hasMore: query.skip + items.length < total,
      nextSkip: query.skip + items.length < total ? query.skip + items.length : null
    };
  }

  async createGroup(payload: GroupPayload) {
    const owner = await this.prisma.user.findUnique({ where: { id: payload.ownerId } });
    if (!owner) {
      throw new AppError(404, "Owner not found");
    }

    const name = payload.name.trim();
    const existing = await this.prisma.expenseGroup.findFirst({
      where: {
        ownerId: payload.ownerId,
        name: {
          equals: name,
          mode: "insensitive"
        }
      }
    });
    if (existing) {
      throw new AppError(409, "Group name already exists");
    }

    const memberIds = [...new Set((payload.memberIds ?? []).filter((id) => id !== payload.ownerId))];

    return this.prisma.expenseGroup.create({
      data: {
        ownerId: payload.ownerId,
        name,
        members: {
          create: [
            { userId: payload.ownerId, role: "owner" },
            ...memberIds.map((userId) => ({ userId, role: "member" }))
          ]
        }
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async updateGroup(groupId: string, payload: GroupUpdatePayload) {
    const current = await this.prisma.expenseGroup.findUnique({ where: { id: groupId } });
    if (!current) {
      throw new AppError(404, "Group not found");
    }

    return this.prisma.expenseGroup.update({
      where: { id: groupId },
      data: {
        ...(payload.name !== undefined ? { name: payload.name.trim() } : {})
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async deleteGroup(groupId: string) {
    const result = await this.prisma.expenseGroup.deleteMany({ where: { id: groupId } });
    if (result.count === 0) {
      throw new AppError(404, "Group not found");
    }
    return { success: true };
  }

  async listExpenses(query: ExpenseFilters) {
    const where = this.buildExpenseWhere(query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: query.take,
        skip: query.skip,
        select: {
          id: true,
          title: true,
          amount: true,
          category: true,
          date: true,
          note: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          group: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      this.prisma.expense.count({ where })
    ]);

    return {
      items: items.map((expense) => ({
        id: expense.id,
        title: expense.title,
        amount: Number(expense.amount),
        category: expense.category,
        date: expense.date,
        note: expense.note,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
        user: expense.user,
        group: expense.group
      })),
      total,
      take: query.take,
      skip: query.skip,
      hasMore: query.skip + items.length < total,
      nextSkip: query.skip + items.length < total ? query.skip + items.length : null
    };
  }

  async createExpense(payload: ExpensePayload) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      throw new AppError(404, "User not found");
    }

    if (payload.groupId) {
      const group = await this.prisma.expenseGroup.findUnique({ where: { id: payload.groupId } });
      if (!group) {
        throw new AppError(404, "Group not found");
      }
    }

    return this.prisma.expense.create({
      data: {
        title: payload.title.trim(),
        amount: payload.amount,
        category: payload.category.trim(),
        date: payload.date,
        note: payload.note?.trim(),
        userId: payload.userId,
        groupId: payload.groupId ?? null
      },
      select: {
        id: true,
        title: true,
        amount: true,
        category: true,
        date: true,
        note: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async updateExpense(expenseId: string, payload: ExpenseUpdatePayload) {
    const current = await this.prisma.expense.findUnique({ where: { id: expenseId } });
    if (!current) {
      throw new AppError(404, "Expense not found");
    }

    if (payload.userId) {
      const user = await this.prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) {
        throw new AppError(404, "User not found");
      }
    }

    if (payload.groupId) {
      const group = await this.prisma.expenseGroup.findUnique({ where: { id: payload.groupId } });
      if (!group) {
        throw new AppError(404, "Group not found");
      }
    }

    const updated = await this.prisma.expense.update({
      where: { id: expenseId },
      data: {
        ...(payload.title !== undefined ? { title: payload.title.trim() } : {}),
        ...(payload.amount !== undefined ? { amount: payload.amount } : {}),
        ...(payload.category !== undefined ? { category: payload.category.trim() } : {}),
        ...(payload.date !== undefined ? { date: payload.date } : {}),
        ...(payload.note !== undefined
          ? { note: payload.note?.trim() || null }
          : {}),
        ...(payload.groupId !== undefined ? { groupId: payload.groupId ?? null } : {}),
        ...(payload.userId !== undefined ? { userId: payload.userId } : {})
      },
      select: {
        id: true,
        title: true,
        amount: true,
        category: true,
        date: true,
        note: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      ...updated,
      amount: Number(updated.amount)
    };
  }

  async deleteExpense(expenseId: string) {
    const result = await this.prisma.expense.deleteMany({ where: { id: expenseId } });
    if (result.count === 0) {
      throw new AppError(404, "Expense not found");
    }
    return { success: true };
  }

  async getExpensesByUser(query: { year?: number; search?: string }) {
    const analytics = await this.getAnalytics();
    const search = query.search?.trim().toLowerCase();
    const items = search
      ? analytics.byUser.filter((item) =>
          item.name.toLowerCase().includes(search) ||
          item.email.toLowerCase().includes(search)
        )
      : analytics.byUser;

    return {
      year: query.year ?? new Date().getFullYear(),
      items,
      chart: items.map((item) => ({
        userId: item.userId,
        name: item.name,
        total: item.total
      })),
      totalExpenseAmount: this.roundCurrency(items.reduce((sum, item) => sum + item.total, 0)),
      totalExpenseCount: items.reduce((sum, item) => sum + item.expenseCount, 0),
      currency: "MMK"
    };
  }

  private buildUserWhere(search?: string): Prisma.UserWhereInput {
    const query = search?.trim();
    if (!query) {
      return {};
    }

    return {
      OR: [
        { email: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } }
      ]
    };
  }

  private buildGroupWhere(search?: string): Prisma.ExpenseGroupWhereInput {
    const query = search?.trim();
    if (!query) {
      return {};
    }

    return {
      name: {
        contains: query,
        mode: "insensitive"
      }
    };
  }

  private buildExpenseWhere(filters: ExpenseFilters): Prisma.ExpenseWhereInput {
    const search = filters.search?.trim();
    const category = filters.category?.trim();

    const where: Prisma.ExpenseWhereInput = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.groupId) {
      where.groupId = filters.groupId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { note: { contains: search, mode: "insensitive" } },
        {
          user: {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { name: { contains: search, mode: "insensitive" } }
            ]
          }
        },
        {
          group: {
            name: { contains: search, mode: "insensitive" }
          }
        }
      ];
    }

    if (category) {
      where.category = {
        equals: category,
        mode: "insensitive"
      };
    }

    return where;
  }

  private roundCurrency(value: number) {
    return Math.round(value * 100) / 100;
  }
}
