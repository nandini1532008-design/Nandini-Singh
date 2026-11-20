import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface ICodeSubmission extends Document {
  user: Types.ObjectId;
  language: string;
  code: string;
  createdAt: Date;
}

const CodeSubmissionSchema = new Schema<ICodeSubmission>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    language: {
      type: String,
      required: true,
      enum: ["javascript", "python", "java", "cpp", "typescript", "go", "php"],
    },
    code: {
      type: String,
      required: true,
      maxlength: 10000,
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

CodeSubmissionSchema.index({ user: 1, createdAt: -1 });

export const CodeSubmissionModel =
  mongoose.models.CodeSubmission ||
  mongoose.model<ICodeSubmission>("CodeSubmission", CodeSubmissionSchema);
