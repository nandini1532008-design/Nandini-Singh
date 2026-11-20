import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import mongoose from "mongoose";
import { UserModel } from "../models/User.ts";
import { CodeSubmissionModel } from "../models/CodeSubmission.ts";
import { ReviewResultModel, type IFinding } from "../models/ReviewResult.ts";

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface StoredSubmission {
  id: string;
  userId: string;
  language: string;
  code: string;
  createdAt: string;
}

export interface StoredReview {
  id: string;
  submissionId: string;
  userId: string;
  summary: string;
  qualityScore: number;
  findings: IFinding[];
  improvedCode: string;
  createdAt: string;
}

export interface ReviewWithSubmission extends StoredReview {
  language: string;
  code: string;
}

interface LocalDatabase {
  users: StoredUser[];
  submissions: StoredSubmission[];
  reviews: StoredReview[];
}

function resolveWritableDataDir(): string {
  const preferred = path.resolve(process.cwd(), ".data");
  try {
    if (!fs.existsSync(preferred)) {
      fs.mkdirSync(preferred, { recursive: true });
    }
    fs.accessSync(preferred, fs.constants.W_OK);
    return preferred;
  } catch {
    const tmpDir = path.join(os.tmpdir(), "codesense-data");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    return tmpDir;
  }
}

const DATA_DIR = resolveWritableDataDir();
const DATA_FILE = path.join(DATA_DIR, "codesense-store.json");

let usingMongo = false;

function generateObjectIdHex(): string {
  return crypto.randomBytes(12).toString("hex");
}

function readLocalDb(): LocalDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      const initial: LocalDatabase = { users: [], submissions: [], reviews: [] };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalDatabase>;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [],
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
    };
  } catch {
    return { users: [], submissions: [], reviews: [] };
  }
}

function writeLocalDb(data: LocalDatabase): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmpFile, DATA_FILE);
}

export async function connectDatabase(): Promise<void> {
  const mongoUri = process.env.MONGO_URI?.trim();
  if (!mongoUri) {
    usingMongo = false;
    console.log("[db] MONGO_URI not configured; using persistent local store at .data/codesense-store.json");
    return;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    usingMongo = true;
    console.log("[db] Connected to MongoDB via Mongoose");
  } catch (err) {
    usingMongo = false;
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[db] MongoDB unavailable (${msg}); falling back to persistent local store`);
  }
}

export function isMongoConnected(): boolean {
  return usingMongo && mongoose.connection.readyState === 1;
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const normalized = email.trim().toLowerCase();
  if (isMongoConnected()) {
    const doc = await UserModel.findOne({ email: normalized }).lean();
    if (!doc) return null;
    return {
      id: String(doc._id),
      name: doc.name,
      email: doc.email,
      passwordHash: doc.passwordHash,
      createdAt: new Date(doc.createdAt).toISOString(),
    };
  }

  const db = readLocalDb();
  return db.users.find((u) => u.email.toLowerCase() === normalized) || null;
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  if (isMongoConnected()) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const doc = await UserModel.findById(id).lean();
    if (!doc) return null;
    return {
      id: String(doc._id),
      name: doc.name,
      email: doc.email,
      passwordHash: doc.passwordHash,
      createdAt: new Date(doc.createdAt).toISOString(),
    };
  }

  const db = readLocalDb();
  return db.users.find((u) => u.id === id) || null;
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<StoredUser> {
  const normalizedEmail = input.email.trim().toLowerCase();
  if (isMongoConnected()) {
    const created = await UserModel.create({
      name: input.name.trim(),
      email: normalizedEmail,
      passwordHash: input.passwordHash,
    });
    return {
      id: String(created._id),
      name: created.name,
      email: created.email,
      passwordHash: created.passwordHash,
      createdAt: new Date(created.createdAt).toISOString(),
    };
  }

  const db = readLocalDb();
  const user: StoredUser = {
    id: generateObjectIdHex(),
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash: input.passwordHash,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  writeLocalDb(db);
  return user;
}

export async function saveSubmissionAndReview(input: {
  userId: string;
  language: string;
  code: string;
  summary: string;
  qualityScore: number;
  findings: IFinding[];
  improvedCode: string;
}): Promise<ReviewWithSubmission> {
  if (isMongoConnected()) {
    const submissionDoc = await CodeSubmissionModel.create({
      user: new mongoose.Types.ObjectId(input.userId),
      language: input.language,
      code: input.code,
    });

    const reviewDoc = await ReviewResultModel.create({
      submission: submissionDoc._id,
      user: new mongoose.Types.ObjectId(input.userId),
      summary: input.summary,
      qualityScore: input.qualityScore,
      findings: input.findings,
      improvedCode: input.improvedCode,
    });

    return {
      id: String(reviewDoc._id),
      submissionId: String(submissionDoc._id),
      userId: input.userId,
      language: submissionDoc.language,
      code: submissionDoc.code,
      summary: reviewDoc.summary,
      qualityScore: reviewDoc.qualityScore,
      findings: reviewDoc.findings,
      improvedCode: reviewDoc.improvedCode,
      createdAt: new Date(reviewDoc.createdAt).toISOString(),
    };
  }

  const db = readLocalDb();
  const now = new Date().toISOString();
  const submission: StoredSubmission = {
    id: generateObjectIdHex(),
    userId: input.userId,
    language: input.language,
    code: input.code,
    createdAt: now,
  };
  const review: StoredReview = {
    id: generateObjectIdHex(),
    submissionId: submission.id,
    userId: input.userId,
    summary: input.summary,
    qualityScore: input.qualityScore,
    findings: input.findings,
    improvedCode: input.improvedCode,
    createdAt: now,
  };

  db.submissions.push(submission);
  db.reviews.push(review);
  writeLocalDb(db);

  return {
    ...review,
    language: submission.language,
    code: submission.code,
  };
}

export async function listUserReviews(userId: string): Promise<ReviewWithSubmission[]> {
  if (isMongoConnected()) {
    if (!mongoose.Types.ObjectId.isValid(userId)) return [];
    const docs = await ReviewResultModel.find({
      user: new mongoose.Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .populate("submission")
      .lean();

    return docs.map((doc) => {
      const sub = doc.submission as unknown as {
        _id: mongoose.Types.ObjectId;
        language?: string;
        code?: string;
      } | null;
      return {
        id: String(doc._id),
        submissionId: sub ? String(sub._id) : String(doc.submission),
        userId: String(doc.user),
        language: sub?.language || "javascript",
        code: sub?.code || "",
        summary: doc.summary,
        qualityScore: doc.qualityScore,
        findings: doc.findings || [],
        improvedCode: doc.improvedCode,
        createdAt: new Date(doc.createdAt).toISOString(),
      };
    });
  }

  const db = readLocalDb();
  const submissionMap = new Map(db.submissions.map((s) => [s.id, s]));
  return db.reviews
    .filter((r) => r.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((r) => {
      const sub = submissionMap.get(r.submissionId);
      return {
        ...r,
        language: sub?.language || "javascript",
        code: sub?.code || "",
      };
    });
}

export async function getUserReviewById(
  userId: string,
  reviewId: string
): Promise<ReviewWithSubmission | null> {
  if (isMongoConnected()) {
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(reviewId)
    ) {
      return null;
    }
    const doc = await ReviewResultModel.findOne({
      _id: new mongoose.Types.ObjectId(reviewId),
      user: new mongoose.Types.ObjectId(userId),
    })
      .populate("submission")
      .lean();

    if (!doc) return null;
    const sub = doc.submission as unknown as {
      _id: mongoose.Types.ObjectId;
      language?: string;
      code?: string;
    } | null;
    return {
      id: String(doc._id),
      submissionId: sub ? String(sub._id) : String(doc.submission),
      userId: String(doc.user),
      language: sub?.language || "javascript",
      code: sub?.code || "",
      summary: doc.summary,
      qualityScore: doc.qualityScore,
      findings: doc.findings || [],
      improvedCode: doc.improvedCode,
      createdAt: new Date(doc.createdAt).toISOString(),
    };
  }

  const db = readLocalDb();
  const review = db.reviews.find((r) => r.id === reviewId && r.userId === userId);
  if (!review) return null;
  const sub = db.submissions.find((s) => s.id === review.submissionId);
  return {
    ...review,
    language: sub?.language || "javascript",
    code: sub?.code || "",
  };
}

export async function deleteUserReviewById(
  userId: string,
  reviewId: string
): Promise<boolean> {
  if (isMongoConnected()) {
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(reviewId)
    ) {
      return false;
    }
    const deleted = await ReviewResultModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(reviewId),
      user: new mongoose.Types.ObjectId(userId),
    }).lean();
    if (!deleted) return false;
    await CodeSubmissionModel.deleteOne({
      _id: deleted.submission,
      user: new mongoose.Types.ObjectId(userId),
    });
    return true;
  }

  const db = readLocalDb();
  const idx = db.reviews.findIndex((r) => r.id === reviewId && r.userId === userId);
  if (idx === -1) return false;
  const [removed] = db.reviews.splice(idx, 1);
  db.submissions = db.submissions.filter(
    (s) => !(s.id === removed.submissionId && s.userId === userId)
  );
  writeLocalDb(db);
  return true;
}
