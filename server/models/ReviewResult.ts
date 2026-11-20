import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IFinding {
  type: "bug" | "security" | "performance";
  title: string;
  severity: "low" | "medium" | "high";
  lineRef: string;
  description: string;
  whyItMatters: string;
}

export interface IReviewResult extends Document {
  submission: Types.ObjectId;
  user: Types.ObjectId;
  summary: string;
  qualityScore: number;
  findings: IFinding[];
  improvedCode: string;
  createdAt: Date;
}

const FindingSchema = new Schema<IFinding>(
  {
    type: {
      type: String,
      required: true,
      enum: ["bug", "security", "performance"],
    },
    title: { type: String, required: true },
    severity: {
      type: String,
      required: true,
      enum: ["low", "medium", "high"],
    },
    lineRef: { type: String, required: true },
    description: { type: String, required: true },
    whyItMatters: { type: String, required: true },
  },
  { _id: false }
);

const ReviewResultSchema = new Schema<IReviewResult>(
  {
    submission: {
      type: Schema.Types.ObjectId,
      ref: "CodeSubmission",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    summary: {
      type: String,
      required: true,
    },
    qualityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    findings: {
      type: [FindingSchema],
      default: [],
    },
    improvedCode: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

ReviewResultSchema.index({ user: 1, createdAt: -1 });

export const ReviewResultModel =
  mongoose.models.ReviewResult ||
  mongoose.model<IReviewResult>("ReviewResult", ReviewResultSchema);
