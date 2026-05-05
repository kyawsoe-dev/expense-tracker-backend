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
}
