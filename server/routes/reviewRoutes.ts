import { Router, type NextFunction, type Response } from "express";
import { z } from "zod";
import {
  deleteUserReviewById,
  getUserReviewById,
  listUserReviews,
  saveSubmissionAndReview,
} from "../db/store.ts";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/auth.ts";
import { AppError } from "../middleware/errorHandler.ts";
import { analyzeCode } from "../services/aiService.js";

export const SUPPORTED_LANGUAGES = [
  "javascript",
  "python",
  "java",
  "cpp",
  "typescript",
  "go",
  "php",
] as const;

const createReviewSchema = z.object({
  code: z
    .string()
    .refine((val) => val.trim().length > 0, {
      message: "Please enter some code before running an analysis.",
    })
    .refine((val) => val.length <= 10000, {
      message: "Submitted code exceeds the 10,000 character limit.",
    }),
  language: z.enum(SUPPORTED_LANGUAGES, {
    message:
      "Unsupported language. Choose JavaScript, Python, Java, C++, TypeScript, Go, or PHP.",
  }),
});

export function createReviewRouter(reviewLimiter: ReturnType<typeof import("express-rate-limit").default>) {
  const router = Router();

  router.post(
    "/review",
    requireAuth,
    reviewLimiter,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const parsed = createReviewSchema.parse(req.body);
        const userId = req.user!.id;

        const analysis = await analyzeCode({
          code: parsed.code,
          language: parsed.language,
        });

        const saved = await saveSubmissionAndReview({
          userId,
          language: parsed.language,
          code: parsed.code,
          summary: analysis.summary,
          qualityScore: analysis.qualityScore,
          findings: analysis.findings,
          improvedCode: analysis.improvedCode,
        });

        res.status(201).json({
          submissionId: saved.submissionId,
          reviewId: saved.id,
          language: saved.language,
          code: saved.code,
          summary: saved.summary,
          qualityScore: saved.qualityScore,
          findings: saved.findings,
          improvedCode: saved.improvedCode,
          createdAt: saved.createdAt,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  router.get(
    "/reviews",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const userId = req.user!.id;
        const reviews = await listUserReviews(userId);
        res.json({
          reviews: reviews.map((r) => ({
            reviewId: r.id,
            submissionId: r.submissionId,
            language: r.language,
            code: r.code,
            summary: r.summary,
            qualityScore: r.qualityScore,
            findings: r.findings,
            improvedCode: r.improvedCode,
            createdAt: r.createdAt,
          })),
        });
      } catch (err) {
        next(err);
      }
    }
  );

  router.get(
    "/reviews/:id",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const userId = req.user!.id;
        const reviewId = String(req.params.id || "");
        const review = await getUserReviewById(userId, reviewId);
        if (!review) {
          throw new AppError(
            "Review not found or you do not have permission to view it.",
            404,
            "REVIEW_NOT_FOUND"
          );
        }

        res.json({
          reviewId: review.id,
          submissionId: review.submissionId,
          language: review.language,
          code: review.code,
          summary: review.summary,
          qualityScore: review.qualityScore,
          findings: review.findings,
          improvedCode: review.improvedCode,
          createdAt: review.createdAt,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  router.delete(
    "/reviews/:id",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const userId = req.user!.id;
        const reviewId = String(req.params.id || "");
        const deleted = await deleteUserReviewById(userId, reviewId);
        if (!deleted) {
          throw new AppError(
            "Review not found or you do not have permission to delete it.",
            404,
            "REVIEW_NOT_FOUND"
          );
        }
        res.json({ deleted: true, reviewId });
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}
