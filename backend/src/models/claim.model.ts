import { Document, Schema, Types, model } from "mongoose";

export enum ClaimStatus {
  PENDING = "Pending",
  IN_REVIEW = "InReview",
  FINISHED = "Finished",
}

export interface IClaim extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  status: ClaimStatus;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const claimSchema = new Schema<IClaim>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
      type: String,
      required: true,
      enum: Object.values(ClaimStatus),
      default: ClaimStatus.PENDING,
    },
    totalAmount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

export const ClaimModel = model<IClaim>("Claim", claimSchema);
