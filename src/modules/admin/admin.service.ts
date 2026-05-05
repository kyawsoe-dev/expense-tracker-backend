import { PrismaClient } from "@prisma/client";

type PrismaLike = PrismaClient;

export class AdminService {
  constructor(private readonly prisma: PrismaLike) {}

  async getOverview() {
    const [
      totalUsers,
      totalExpenses,
      totalGroups,
      totalMembers,
      recentUsers,
      recentExpenses,
      recentGroups
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.expense.count(),
      this.prisma.expenseGroup.count(),
      this.prisma.expenseGroupMember.count(),
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
        members: totalMembers
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
}
