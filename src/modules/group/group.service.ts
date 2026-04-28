import { AppError } from "../../common/errors/AppError";
import { GroupRepository } from "./group.repository";

export class GroupService {
  constructor(private readonly repo: GroupRepository) {}

  async createGroup(ownerId: string, payload: { name: string; memberEmails?: string[] }) {
    const name = payload.name.trim();
    const existing = await this.repo.findByNameForOwner(name, ownerId);
    if (existing) {
      throw new AppError(409, "Group name already exists");
    }

    const memberIds = await this.resolveMemberIds(payload.memberEmails ?? [], ownerId);

    return this.repo.create({
      ownerId,
      name,
      memberIds
    });
  }

  listGroups(userId: string) {
    return this.repo.listByUser(userId);
  }

  async ensureAccessibleGroup(groupId: string, userId: string) {
    const group = await this.repo.findByIdForUser(groupId, userId);
    if (!group) {
      throw new AppError(404, "Group not found");
    }
    return group;
  }

  async getGroupDetail(userId: string, groupId: string) {
    const group = await this.repo.findDetailByIdForUser(groupId, userId);
    if (!group) {
      throw new AppError(404, "Group not found");
    }

    const members = group.members.map((member) => ({
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      role: member.role,
      joinedAt: member.createdAt
    }));

    const memberIds = members.map((member) => member.id);
    const memberCount = memberIds.length;
    const balances = members.map((member) => ({
      userId: member.id,
      name: member.name,
      email: member.email,
      paid: 0,
      owes: 0,
      balance: 0
    }));
    const balanceByUserId = new Map(balances.map((item) => [item.userId, item]));

    if (memberCount > 0) {
      for (const expense of group.expenses) {
        const paidBy = balanceByUserId.get(expense.userId);
        if (paidBy) {
          paidBy.paid = this.roundCurrency(paidBy.paid + Number(expense.amount));
        }

        const share = Number(expense.amount) / memberCount;
        for (const memberId of memberIds) {
          const balance = balanceByUserId.get(memberId);
          if (balance) {
            balance.owes = this.roundCurrency(balance.owes + share);
          }
        }
      }
    }

    for (const balance of balances) {
      balance.balance = this.roundCurrency(balance.paid - balance.owes);
    }

    return {
      id: group.id,
      name: group.name,
      createdAt: group.createdAt,
      owner: {
        id: group.owner.id,
        name: group.owner.name,
        email: group.owner.email
      },
      members,
      balances
    };
  }

  async addMember(requestUserId: string, groupId: string, payload: { email: string }) {
    const group = await this.ensureAccessibleGroup(groupId, requestUserId);
    if (group.ownerId !== requestUserId) {
      throw new AppError(403, "Only the group owner can add members");
    }

    const user = await this.repo.findUserByEmail(payload.email.trim().toLowerCase());
    if (!user) {
      throw new AppError(404, "No user found with that email");
    }

    await this.repo.addMember(groupId, user.id);
    return this.getGroupDetail(requestUserId, groupId);
  }

  async suggestMembers(
    requestUserId: string,
    payload: { query: string; groupId?: string }
  ) {
    const query = payload.query.trim().toLowerCase();
    if (query.length === 0) {
      return [];
    }

    const excludeUserIds = [requestUserId];

    if (payload.groupId) {
      const group = await this.ensureAccessibleGroup(payload.groupId, requestUserId);
      for (const member of group.members) {
        excludeUserIds.push(member.user.id);
      }
    }

    const users = await this.repo.searchUsersByEmail(query, [...new Set(excludeUserIds)]);
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email
    }));
  }

  async renameGroup(requestUserId: string, groupId: string, payload: { name: string }) {
    const group = await this.ensureAccessibleGroup(groupId, requestUserId);
    if (group.ownerId !== requestUserId) {
      throw new AppError(403, "Only the group owner can rename the group");
    }

    const name = payload.name.trim();
    const existing = await this.repo.findByNameForOwner(name, requestUserId);
    if (existing && existing.id !== groupId) {
      throw new AppError(409, "Group name already exists");
    }

    return this.repo.renameGroup(groupId, name);
  }

  async removeMember(requestUserId: string, groupId: string, memberId: string) {
    const group = await this.ensureAccessibleGroup(groupId, requestUserId);
    if (group.ownerId !== requestUserId) {
      throw new AppError(403, "Only the group owner can remove members");
    }

    if (memberId === requestUserId) {
      throw new AppError(400, "You cannot remove yourself from the group");
    }

    await this.repo.removeMember(groupId, memberId);
    return this.getGroupDetail(requestUserId, groupId);
  }

  private async resolveMemberIds(memberEmails: string[], ownerId: string) {
    const normalizedEmails = [...new Set(
      memberEmails
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
    )];

    const memberIds: string[] = [];
    for (const email of normalizedEmails) {
      const user = await this.repo.findUserByEmail(email);
      if (!user) {
        throw new AppError(404, `No user found with email ${email}`);
      }
      if (user.id !== ownerId) {
        memberIds.push(user.id);
      }
    }
    return memberIds;
  }

  private roundCurrency(value: number) {
    return Math.round(value * 100) / 100;
  }
}
