import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { AppError } from "../../common/errors/AppError";
import { env } from "../../config/env";
import axios from "axios";

type JwtPair = { accessToken: string; refreshToken: string };

export class AuthService {
  private signTokens(user: Pick<User, "id" | "email" | "name">): JwtPair {
    const payload = { sub: user.id, email: user.email, name: user.name };
    const accessToken = jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.jwtAccessExpires as jwt.SignOptions["expiresIn"] });
    const refreshToken = jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpires as jwt.SignOptions["expiresIn"] });
    return { accessToken, refreshToken };
  }

  async register(input: { email: string; password: string; name?: string }) {
    const exists = await prisma.user.findUnique({ where: { email: input.email } });
    if (exists) throw new AppError(409, "Email already registered");

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash
      }
    });

    const tokens = this.signTokens(user);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash } });

    return {
      user: { id: user.id, email: user.email, name: user.name },
      ...tokens
    };
  }

  async login(input: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new AppError(401, "Invalid credentials");

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw new AppError(401, "Invalid credentials");

    const tokens = this.signTokens(user);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash } });

    return {
      user: { id: user.id, email: user.email, name: user.name },
      ...tokens
    };
  }

  async socialLogin(input: { provider: 'google' | 'github'; token: string }) {
    let email: string | undefined;
    let name: string | undefined;

    if (input.provider === 'google') {
      // Verify Google ID token by calling Google's tokeninfo endpoint
      try {
        const res = await axios.get(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${input.token}`
        );
        email = res.data.email;
        name = res.data.name;
        
        if (!email) {
          throw new AppError(401, "Invalid Google ID token: no email");
        }
      } catch (err) {
        throw new AppError(401, "Invalid Google ID token");
      }
    } else if (input.provider === 'github') {
      // Verify GitHub access token and get user info
      try {
        const userRes = await axios.get('https://api.github.com/user', {
          headers: { Authorization: `token ${input.token}` }
        });
        email = userRes.data.email;
        name = userRes.data.name || userRes.data.login;

        // GitHub might not return email in user profile, fetch emails separately
        if (!email) {
          const emailsRes = await axios.get('https://api.github.com/user/emails', {
            headers: { Authorization: `token ${input.token}` }
          });
          const primaryEmail = emailsRes.data.find((e: any) => e.primary) || emailsRes.data[0];
          email = primaryEmail?.email;
        }

        if (!email) {
          throw new AppError(401, "Unable to get email from GitHub");
        }
      } catch (err) {
        throw new AppError(401, "Invalid GitHub access token");
      }
    } else {
      throw new AppError(400, "Unsupported provider");
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || 'User',
          passwordHash: '',
        }
      });
    }

    const tokens = this.signTokens(user);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash } });

    return {
      user: { id: user.id, email: user.email, name: user.name },
      ...tokens
    };
  }

  async refresh(input: { refreshToken: string }) {
    let payload: { sub: string; email: string };
    try {
      payload = jwt.verify(input.refreshToken, env.jwtRefreshSecret) as { sub: string; email: string };
    } catch {
      throw new AppError(401, "Invalid refresh token");
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user?.refreshTokenHash) throw new AppError(401, "Refresh token not active");

    const ok = await bcrypt.compare(input.refreshToken, user.refreshTokenHash);
    if (!ok) throw new AppError(401, "Refresh token mismatch");

    const tokens = this.signTokens(user);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash } });

    return tokens;
  }

  async logout(userId: string) {
    await prisma.user.update({ where: { id: userId }, data: { refreshTokenHash: null } });
    return { success: true };
  }
}
