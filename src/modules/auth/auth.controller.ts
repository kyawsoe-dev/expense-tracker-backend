import { NextFunction, Request, Response } from "express";
import { AuthService } from "./auth.service";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const out = await this.authService.register(req.body);
      res.status(201).json(out);
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const out = await this.authService.login(req.body);
      res.status(200).json(out);
    } catch (err) {
      next(err);
    }
  };

  socialLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const out = await this.authService.socialLogin(req.body);
      res.status(200).json(out);
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const out = await this.authService.refresh(req.body);
      res.status(200).json(out);
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const out = await this.authService.logout(req.user!.sub);
      res.status(200).json(out);
    } catch (err) {
      next(err);
    }
  };
}
