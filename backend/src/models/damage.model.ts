import { Schema, model, Document, Types } from 'mongoose';

export type Severity = 'low' | 'mid' | 'high';

export interface IDamage extends Document {
  _id: Types.ObjectId;
  claimId: Types.ObjectId;
  part: string;
  severity: Severity;
  imageUrl: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

const damageSchema = new Schema<IDamage>(
  {
    claimId: { type: Schema.Types.ObjectId, ref: 'Claim', required: true, index: true },
    part: { type: String, required: true, trim: true, maxlength: 100 },
    severity: { type: String, enum: ['low', 'mid', 'high'], required: true },
    imageUrl: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

export const DamageModel = model<IDamage>('Damage', damageSchema);