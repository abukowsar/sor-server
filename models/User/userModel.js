import mongoose from "mongoose";
import { Chapter } from "../Book/chapterModel.js";

const userSchema = new mongoose.Schema(
  {
    // Existing fields
    name: {
      type: String,
      required: true,
      trim: true,
    },
    photoURL: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      unique: true,
      trim: true,
    },
    phone: {
      type: Number,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },

    subscription: {
      plan: {
        type: String,
        enum: ["free", "basic", "standard", "premium"],
        default: "free",
      },
      startDate: { type: Date, default: Date.now },
      endDate: { type: Date },
      transactionId: String,
      validationId: String,
      amount: Number,
      status: String,
    },

    progress: [
      {
        chapterId: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter" },
        moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Module" },
        completed: { type: Boolean, default: false },
      },
    ],

    gender: {
      type: String,
      default: "other",
    },

    className: {
      type: String,
      trim: true,
    },

    institute: {
      type: String,
      trim: true,
    },

    address: {
      district: { type: String, trim: true },
      upazila: { type: String, trim: true },
    },

    permanentAddress: {
      district: { type: String, trim: true },
      upazila: { type: String, trim: true },
    },

    // ------------------------------------------------
    // NEW FIELDS ADDED FROM THE FORM
    // ------------------------------------------------

    fatherName: { type: String, trim: true },
    motherName: { type: String, trim: true },

    dateOfBirth: { type: Date },

    nationalIdOrBirthCert: { type: String, trim: true },

    educationQualification: { type: String, trim: true },

    // Laptop/Desktop availability
    hasComputer: {
      type: Boolean,
      default: null,
    },

    // Training Fields
    trainingFields: [String], // array of selected items

    // Skills
    skills: [String], // array of selected items

    // Previous training
    previousTraining: {
      type: Boolean,
      default: null,
    },

    // Marketplace experience
    marketplaceExperience: {
      type: Boolean,
      default: null,
    },

    // File uploads
    nationalIdFile: { type: String },
    educationCertificateFile: { type: String },
    trainingCertificates: [String],

    // Comments
    comment: { type: String, trim: true },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
