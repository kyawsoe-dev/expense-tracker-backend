import { NextFunction, Request, Response } from "express";
import { AdminService } from "./admin.service";

export class AdminController {
  constructor(private readonly service: AdminService) {}

  overview = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const out = await this.service.getOverview();
      res.status(200).json(out);
    } catch (err) {
      next(err);
    }
  };

  analytics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const out = await this.service.getAnalytics();
      res.status(200).json(out);
    } catch (err) {
      next(err);
    }
  };

  listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const out = await this.service.listUsers(req.query as any);
      res.status(200).json(out);
    } catch (err) {
      next(err);
    }
  };

  createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const out = await this.service.createUser(req.body);
      res.status(201).json(out);
    } catch (err) {
      next(err);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const out = await this.service.updateUser(req.params.id, req.body);
      res.status(200).json(out);
    } catch (err) {
      next(err);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const out = await this.service.deleteUser(req.params.id);
      res.status(200).json(out);
    } catch (err) {
      next(err);
    }
  };

  listGroups = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const out = await this.service.listGroups(req.query as any);
      res.status(200).json(out);
    } catch (err) {
      next(err);
    }
  };

  createGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const out = await this.service.createGroup(req.body);
      res.status(201).json(out);
    } catch (err) {
      next(err);
    }
  };

  updateGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const out = await this.service.updateGroup(req.params.id, req.body);
      res.status(200).json(out);
    } catch (err) {
      next(err);
    }
  };

  deleteGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const out = await this.service.deleteGroup(req.params.id);
      res.status(200).json(out);
    } catch (err) {
      next(err);
    }
  };

  listExpenses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const out = await this.service.listExpenses(req.query as any);
      res.status(200).json(out);
    } catch (err) {
      next(err);
    }
  };

  createExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const out = await this.service.createExpense(req.body);
      res.status(201).json(out);
    } catch (err) {
      next(err);
    }
  };

  updateExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const out = await this.service.updateExpense(req.params.id, req.body);
      res.status(200).json(out);
    } catch (err) {
      next(err);
    }
  };

  deleteExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const out = await this.service.deleteExpense(req.params.id);
      res.status(200).json(out);
    } catch (err) {
      next(err);
    }
  };

  expensesByUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const out = await this.service.getExpensesByUser(req.query as any);
      res.status(200).json(out);
    } catch (err) {
      next(err);
    }
  };
}
