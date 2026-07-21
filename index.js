import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/mongodb.js";
import bookRouter from "./routes/bookRoutes.js";
import userRouter from "./routes/userRouter.js";
import planRouter from "./routes/subscriptionPlanRoutes.js";
import quizRouter from "./routes/quizRoutes.js";
import noticeRouter from "./routes/noticeRoutes.js";
import olympiadRouter from "./routes/olympiadRoutes.js";
import 
courseRoute from "./routes/courseoute.js";
import { seedUsers } from "./utils/seed.js";
import authRouter from "./routes/Authroute.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 7000;


app.use(cors({ origin: "*" }));
app.use(express.json()); 

// seedUsers() 
connectDB()  


app.use("/api/user" , userRouter)
app.use("/api/auth", authRouter);
app.use("/api/book", bookRouter);
app.use("/api/plan", planRouter);
app.use("/api/quiz", quizRouter);
app.use("/api/notice", noticeRouter)
app.use("/api/course" , courseRoute)

app.use("/api/olympiad", olympiadRouter)


app.get("/", async (req, res) => {
	res.send("Welcome to the  server!");
});

app.listen(port, () => console.log("My server is running on port:", port));
