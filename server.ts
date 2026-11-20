import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { connectDatabase, isMongoConnected } from "./server/db/store.ts";
import { errorHandler } from "./server/middleware/errorHandler.ts";
import { authRouter } from "./server/routes/authRoutes.ts";
import { createReviewRouter } from "./server/routes/reviewRoutes.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  await connectDatabase();

  const app = express();
  const PORT = Number(process.env.PORT || 3000);
  const distPath = path.resolve(__dirname, "dist");
  const distIndexPath = path.join(distPath, "index.html");
  const isRunningViaTsx = process.execArgv.some((arg) => arg.includes("tsx"));
  const isDevLifecycle =
    process.env.npm_lifecycle_event === "dev" || isRunningViaTsx;
  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.npm_lifecycle_event === "start" ||
    (!isDevLifecycle && fs.existsSync(distIndexPath));

  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      frameguard: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
    })
  );

  app.use(
    cors({
      origin: true,
    })
  );

  app.use(express.json({ limit: "64kb" }));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 40,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: "Too many authentication attempts. Please wait a few minutes and try again.",
      code: "RATE_LIMIT_EXCEEDED",
    },
  });

  const reviewLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: "Rate limit reached for AI code reviews. Please pause briefly before analyzing more code.",
      code: "RATE_LIMIT_EXCEEDED",
    },
  });

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      database: isMongoConnected() ? "mongodb" : "local-store",
      aiConfigured: Boolean(
        process.env.GEMINI_API_KEY &&
          process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"
      ),
    });
  });

  // Mount exact REST API routes specified in architecture AND /api/* aliases
  app.use("/auth", authLimiter, authRouter);
  app.use("/api/auth", authLimiter, authRouter);

  const reviewRouter = createReviewRouter(reviewLimiter);
  app.use("/", reviewRouter);
  app.use("/api", reviewRouter);

  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(
      "/assets",
      express.static(path.join(distPath, "assets"), {
        maxAge: "1y",
        immutable: true,
      })
    );
    app.use("/assets", (_req, res) => {
      res.status(404).end();
    });
    app.use(
      express.static(distPath, {
        index: false,
      })
    );
    app.get("*", (_req, res) => {
      res.setHeader("Cache-Control", "no-store, must-revalidate");
      res.sendFile(distIndexPath);
    });
  }

  app.use(errorHandler);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[server] CodeSense AI running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[server] Fatal startup error:", err);
  process.exit(1);
});
