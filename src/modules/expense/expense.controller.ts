import { NextFunction, Request, Response } from "express";
import { ExpenseService } from "./expense.service";

export class ExpenseController {
  constructor(private readonly service: ExpenseService) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const expense = await this.service.createExpense(req.user!.sub, req.body);
      res.status(201).json(expense);
    } catch (err) {
      next(err);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const take = Number(req.query.take ?? 20);
      const skip = Number(req.query.skip ?? 0);
      const items = await this.service.listExpenses(req.user!.sub, take, skip);
      res.status(200).json(items);
    } catch (err) {
      next(err);
    }
  };

  listByGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { groupId } = req.params;
      const take = Number(req.query.take ?? 20);
      const skip = Number(req.query.skip ?? 0);
      const items = await this.service.listExpensesByGroup(req.user!.sub, groupId, take, skip);
      res.status(200).json(items);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const updated = await this.service.updateExpense(req.user!.sub, req.params.id, req.body);
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const out = await this.service.deleteExpense(req.user!.sub, req.params.id);
      res.status(200).json(out);
    } catch (err) {
      next(err);
    }
  };

  summary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const out = await this.service.getCurrentMonthSummary(req.user!.sub);
      res.status(200).json(out);
    } catch (err) {
      next(err);
    }
  };
}
