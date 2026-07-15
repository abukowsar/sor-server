import express from "express";
import { changePassword, createAdmin, forgotPassword, getAllAdmins, loginUser, registerUser, removeAdmin, resetPassword, verifyOtp } from "../controllers/authController.js";
import auth from "../middleware/authMiddleware.js";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const authRouter = express.Router();

// Register a new user
authRouter.post("/register", registerUser);

// Login user
authRouter.post("/login", loginUser);
authRouter.post("/verify-otp", verifyOtp)

authRouter.post("/create-admin", auth("admin"), createAdmin)

authRouter.get("/admins", auth("admin"), getAllAdmins
)
authRouter.delete("/remove-admin/:id", auth("admin"), removeAdmin);


authRouter.post("/change-password", auth("student", "admin"), changePassword);

// Forgot Password Routes
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);

export default authRouter;