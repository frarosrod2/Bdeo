import { Document, Schema, Types, model } from "mongoose";

export enum Severity {
  LOW = "low",
  MID = "mid",
  HIGH = "high",
}

export interface IDamage {
  _id: Types.ObjectId;
  claimId: Types.ObjectId;
  part: string;
  severity: Severity;
  imageUrl: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDamageDocument extends IDamage, Document {}

const damageSchema = new Schema<IDamageDocument>(
  {
    claimId: {
      type: Schema.Types.ObjectId,
      ref: "Claim",
      required: true,
      index: true,
    },
    part: { type: String, required: true, trim: true, maxlength: 100 },
    severity: { type: String, enum: ["low", "mid", "high"], required: true },
    imageUrl: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

export const DamageModel = model<IDamageDocument>("Damage", damageSchema);
