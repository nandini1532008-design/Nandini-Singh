import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { findUserById } from "../db/store.ts";
import { AppError } from "./errorHandler.ts";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

let cachedFallbackSecret: string | null = null;

export function getJwtSecret(): string {
  const envSecret = process.env.JWT_SECRET?.trim();
  if (envSecret && envSecret.length >= 16) {
    return envSecret;
  }
  if (!cachedFallbackSecret) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[auth] JWT_SECRET is missing or short; generating ephemeral runtime secret."
      );
    }
    cachedFallbackSecret = crypto.randomBytes(32).toString("hex");
  }
  return cachedFallbackSecret;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(
        "Authentication required. Please sign in to continue.",
        401,
        "AUTH_MISSING_TOKEN"
      );
    }

    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) {
      throw new AppError(
        "Authentication token is empty.",
        401,
        "AUTH_INVALID_TOKEN"
      );
    }

    let decoded: jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new AppError(
          "Your session has expired. Please sign in again.",
          401,
          "AUTH_TOKEN_EXPIRED"
        );
      }
      throw new AppError(
        "Invalid authentication token. Please sign in again.",
        401,
        "AUTH_INVALID_TOKEN"
      );
    }

    const userId = typeof decoded.sub === "string" ? decoded.sub : "";
    if (!userId) {
      throw new AppError("Invalid token subject.", 401, "AUTH_INVALID_TOKEN");
    }

    const user = await findUserById(userId);
    if (!user) {
      throw new AppError(
        "Account not found for this token. Please sign in again.",
        401,
        "AUTH_USER_NOT_FOUND"
      );
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
    };
    next();
  } catch (err) {
    next(err);
  }
}
