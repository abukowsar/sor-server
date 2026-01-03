import mongoose from "mongoose";

const bookSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  author:{type : String  },
  description: {
    type: String,
    required: true
  },
  thumbnail: String,
  plan: { 
    type: String, 
    enum: ["free", "basic", "standard", "premium"],
    required: true
  },
  chapters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chapter" }]  
}, { timestamps: true });

export const Book = mongoose.model("Book", bookSchema);
