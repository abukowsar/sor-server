import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema({
  title: String,
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },  
  moduleNo: {
    type: Number,
    required: true
  },
  videoLinks: [{
    title: String ,
    link: String
  }],   
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },   
}, { timestamps: true });

export const Module = mongoose.model("Module", moduleSchema);
