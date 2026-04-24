import { PrismaClient } from "@prisma/client";

export class GroupRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private includeGroupSummary() {
    return {
      owner: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      members: {
        orderBy: { createdAt: "asc" as const },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    };
  }

  private includeGroupDetail() {
    return {
      ...this.includeGroupSummary(),
      expenses: {
        orderBy: [
          { date: "desc" as const },
          { createdAt: "desc" as const }
        ],
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    };
  }

  create(data: { ownerId: string; name: string; memberIds?: string[] }) {
    return this.prisma.expenseGroup.create({
      data: {
        ownerId: data.ownerId,
        name: data.name,
        members: {
          create: [
            { userId: data.ownerId, role: "owner" },
            ...(data.memberIds ?? [])
              .filter((memberId) => memberId !== data.ownerId)
              .map((userId) => ({ userId, role: "member" }))
          ]
        }
      },
      include: this.includeGroupSummary()
    });
  }

  listByUser(userId: string) {
    return this.prisma.expenseGroup.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }]
      },
      include: this.includeGroupSummary(),
      orderBy: [{ createdAt: "desc" }]
    });
  }

  findByIdForUser(id: string, userId: string) {
    return this.prisma.expenseGroup.findFirst({
      where: {
        id,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }]
      },
      include: this.includeGroupSummary()
    });
  }

  findByNameForOwner(name: string, ownerId: string) {
    return this.prisma.expenseGroup.findFirst({
      where: {
        ownerId,
        name: {
          equals: name,
          mode: "insensitive"
        }
      }
    });
  }

  findDetailByIdForUser(id: string, userId: string) {
    return this.prisma.expenseGroup.findFirst({
      where: {
        id,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }]
      },
      include: this.includeGroupDetail()
    });
  }

  findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true
      }
    });
  }

  addMember(groupId: string, userId: string) {
    return this.prisma.expenseGroupMember.upsert({
      where: {
        groupId_userId: {
          groupId,
          userId
        }
      },
      update: {},
      create: {
        groupId,
        userId,
        role: "member"
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  searchUsersByEmail(query: string, excludeUserIds: string[] = []) {
    return this.prisma.user.findMany({
      where: {
        email: {
          contains: query.toLowerCase(),
          mode: "insensitive"
        },
        ...(excludeUserIds.length > 0
          ? {
              id: {
                notIn: excludeUserIds
              }
            }
          : {})
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: [
        {
          email: "asc"
        }
      ],
      take: 8
    });
  }
}
