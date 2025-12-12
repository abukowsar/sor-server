import mongoose from "mongoose";

const courseProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    completedModules: [{ type: mongoose.Schema.Types.ObjectId, ref: "Module" }],
    lastModulesId: { type: mongoose.Schema.Types.ObjectId, ref: "Modules" }
  },
  { timestamps: true }
);

export const CourseProgress = mongoose.model("CourseProgress", courseProgressSchema);
