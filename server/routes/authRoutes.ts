import bcrypt from "bcryptjs";
import { Router, type NextFunction, type Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { createUser, findUserByEmail } from "../db/store.ts";
import {
  getJwtSecret,
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/auth.ts";
import { AppError } from "../middleware/errorHandler.ts";

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(100, "Full name cannot exceed 100 characters."),
  email: z.string().trim().email("Please enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .max(128, "Password cannot exceed 128 characters."),
});

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

function signAccessToken(userId: string, email: string): string {
  return jwt.sign({ email }, getJwtSecret(), {
    subject: userId,
    expiresIn: "7d",
  });
}

export const authRouter = Router();

authRouter.post("/register", async (req, res: Response, next: NextFunction) => {
  try {
    const parsed = registerSchema.parse(req.body);
    const existing = await findUserByEmail(parsed.email);
    if (existing) {
      throw new AppError(
        "An account with this email address already exists.",
        409,
        "EMAIL_ALREADY_EXISTS"
      );
    }

    const passwordHash = await bcrypt.hash(parsed.password, 10);
    const created = await createUser({
      name: parsed.name,
      email: parsed.email,
      passwordHash,
    });

    const token = signAccessToken(created.id, created.email);
    res.status(201).json({
      token,
      user: {
        id: created.id,
        name: created.name,
        email: created.email,
        createdAt: created.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", async (req, res: Response, next: NextFunction) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const user = await findUserByEmail(parsed.email);
    if (!user) {
      throw new AppError(
        "Invalid email or password.",
        401,
        "INVALID_CREDENTIALS"
      );
    }

    const passwordMatches = await bcrypt.compare(
      parsed.password,
      user.passwordHash
    );
    if (!passwordMatches) {
      throw new AppError(
        "Invalid email or password.",
        401,
        "INVALID_CREDENTIALS"
      );
    }

    const token = signAccessToken(user.id, user.email);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.get(
  "/me",
  requireAuth,
  (req: AuthenticatedRequest, res: Response) => {
    res.json({ user: req.user });
  }
);
