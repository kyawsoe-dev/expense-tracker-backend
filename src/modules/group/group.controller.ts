import { NextFunction, Request, Response } from "express";
import { GroupService } from "./group.service";

export class GroupController {
  constructor(private readonly service: GroupService) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const group = await this.service.createGroup(req.user!.sub, req.body);
      res.status(201).json(group);
    } catch (err) {
      next(err);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const groups = await this.service.listGroups(req.user!.sub);
      res.status(200).json(groups);
    } catch (err) {
      next(err);
    }
  };

  detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const group = await this.service.getGroupDetail(req.user!.sub, req.params.id);
      res.status(200).json(group);
    } catch (err) {
      next(err);
    }
  };

  addMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const group = await this.service.addMember(req.user!.sub, req.params.id, req.body);
      res.status(200).json(group);
    } catch (err) {
      next(err);
    }
  };
}
