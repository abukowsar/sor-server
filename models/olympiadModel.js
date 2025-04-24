import mongoose from "mongoose";

const olympiadSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  registrationLink: {
    type: String,
    required: true
  },
  eventDate: {
    type: Date,
    required: true
  },
  registrationDeadline: {
    type: Date,
    required: true
  },
  venue: String,
  organizer: String,
  category: {
    type: String,
    enum: ['robotics', 'programming', 'science', 'mathematics', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['upcoming', 'running', 'closed'],
    default: 'upcoming'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Add pre-save middleware to automatically set status based on dates
olympiadSchema.pre('save', function(next) {
  const now = new Date();
  if (this.registrationDeadline > now) {
    this.status = 'upcoming';
  } else if (this.eventDate < now) {
    this.status = 'closed';
  } else {
    this.status = 'running';
  }
  next();
});

export const Olympiad = mongoose.model("Olympiad", olympiadSchema);