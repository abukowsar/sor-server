import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    image: String,
    tutor: String,
    outlinePdf: {
      type: String,
      required: true,
    },

    plan: { type: String, enum: ["free", "basic", "standard", "premium"] }, // Plan-based access
    modules: [{ type: mongoose.Schema.Types.ObjectId, ref: "Module" }], // Relation with Modules
  },
  { timestamps: true }
);

export const Course = mongoose.model("Course", courseSchema);
