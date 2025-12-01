import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  image: String,
  tutor: String,



  plan: { type: String, enum: ["basic", "standard", "premium"] },  // Plan-based access
  modules: [{ type: mongoose.Schema.Types.ObjectId, ref: "Module" }]  // Relation with Modules
}, { timestamps: true });

export const Course = mongoose.model("Course", courseSchema);
