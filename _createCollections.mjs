import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { Book } from "./models/Book/bookModel.js";
import { BookProgress } from "./models/Book/bookProgressModel.js";
import { Chapter } from "./models/Book/chapterModel.js";
import { Course } from "./models/Course/courseModel.js";
import { CourseProgress } from "./models/Course/CourseProgressModel.js";
import { Module } from "./models/Course/moduleModel.js";
import { PaymentSession } from "./models/Subscription/paymentSessionModel.js";
import { SubscriptionPlan } from "./models/Subscription/subscriptionPlanModel.js";
import { Transaction } from "./models/Subscription/transactionModel.js";
import { User } from "./models/User/userModel.js";
import { Notice } from "./models/noticeModel.js";
import { Olympiad } from "./models/olympiadModel.js";
import { OTP } from "./models/otpModel.js";
import { Quiz } from "./models/quiz/QuizModel.js";
import { QuizSubmission } from "./models/quiz/quizsubmissoin.js";
import { TempUser } from "./models/tempUserModel.js";

const models = [
  Book, BookProgress, Chapter, Course, CourseProgress, Module,
  PaymentSession, SubscriptionPlan, Transaction, User, Notice,
  Olympiad, OTP, Quiz, QuizSubmission, TempUser,
];

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to database:", mongoose.connection.name);

  for (const Model of models) {
    try {
      await Model.createCollection();
      console.log(`Created/ensured collection: ${Model.collection.collectionName}`);
    } catch (err) {
      console.log(`Skip ${Model.modelName}: ${err.message}`);
    }
  }

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log("\nCollections in 'sor':");
  collections.forEach((c) => console.log(" -", c.name));

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
