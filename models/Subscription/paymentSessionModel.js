import mongoose from "mongoose";

const paymentSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubscriptionPlan",
    required: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["PENDING", "COMPLETED", "FAILED", "CANCELLED"],
    default: "PENDING"
  },
  paymentSessionData: {
    type: Object,
    required: true
  },
  gatewayPageURL: {
    type: String,
    required: false,
    default: ''
  }
}, { timestamps: true });

export const PaymentSession = mongoose.model("PaymentSession", paymentSessionSchema);