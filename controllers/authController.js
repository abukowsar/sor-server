import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User/userModel.js";
import { OTP } from "../models/otpModel.js";
import { TempUser } from "../models/tempUserModel.js";
import { sendSMS } from "../utils/sendSmsService.js";

// Register a new user
export const registerUser = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    // Validate input
    if (!name || !phone || !password) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "User with this phone number already exists" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const message = `Your verification code is: ${otp} -School of Robotics  `;

    // Store OTP in separate collection
    await OTP.findOneAndUpdate(
      { phone },
      { 
        phone,
        otp: otp.toString(),
        createdAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Store user data temporarily
    await TempUser.findOneAndUpdate(
      { phone },
      { name, phone, password },
      { upsert: true, new: true }
    );

    // Send OTP via SMS
    await sendSMS(phone, message);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully. Please verify to complete registration."
    });

  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Validate input
    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone number and OTP are required" });
    }

    // Verify OTP
    const otpData = await OTP.findOne({ phone });
    if (!otpData) {
      return res.status(400).json({ message: "OTP expired or not found" });
    }

    if (otpData.otp !== otp.toString()) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Get temporary user data
    const tempUserData = await TempUser.findOne({ phone });
    if (!tempUserData) {
      return res.status(400).json({ message: "Registration session expired. Please register again." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempUserData.password, salt);

    // Create verified user
    const newUser = new User({
      name: tempUserData.name,
      phone: tempUserData.phone,
      password: hashedPassword,
      role: "student",
      isVerified: true
    });

    await newUser.save();

    // Cleanup OTP and temporary data
    await OTP.deleteOne({ phone });
    await TempUser.deleteOne({ phone });

    res.status(201).json({
      success: true,
      message: "User registered successfully"
    });

  } catch (error) {
    console.error("OTP Verification error:", error);
    res.status(500).json({ message: "Server error during OTP verification" });
  }
};

// Login user
export const loginUser = async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    
    // Return user data and token (without password)
    const userObject = user.toObject();
    delete userObject.password;
    
    res.status(200).json({
      message: "Login successful",
      user: userObject,
      token
    });
    
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};



export const createAdmin = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    // Check if the requester is an admin
    const requestingUser = req.user;
    if (!requestingUser || requestingUser.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Only administrators can create new admins" 
      });
    }

    // Validate input
    if (!name || !phone || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide all required fields" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "User with this phone number already exists" 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new admin user
    const newAdmin = new User({
      name,
      phone,
      password: hashedPassword,
      role: "admin",
      subscription: {
        plan: "premium",
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      }
    });

    await newAdmin.save();

    // Remove password from response
    const adminResponse = newAdmin.toObject();
    delete adminResponse.password;

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: adminResponse
    });

  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error creating admin" 
    });
  }
};


 

export const getAllAdmins = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    let query = { role: "admin" };

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ];
    }

    const admins = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "Admins fetched successfully",
      data: {
        admins,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        totalAdmins: total
      }
    });

  } catch (error) {
    console.error("Get all admins error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admins",
      error: error.message
    });
  }
};

export const removeAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if admin exists
    const admin = await User.findById(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    // Verify it's an admin account
    if (admin.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: "This user is not an admin"
      });
    }

    // Prevent self-deletion
    if (admin._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot remove yourself"
      });
    }

    // Remove the admin
    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Admin removed successfully"
    });

  } catch (error) {
    console.error("Remove admin error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove admin",
      error: error.message
    });
  }
};


export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Validation
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Both old and new passwords are required"
      });
    }

    // Check password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long"
      });
    }

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect"
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await User.findByIdAndUpdate(userId, {
      password: hashedPassword
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: error.message
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    // Check if user exists
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with this phone number"
      });
    }

    // Generate OTP same as registration
    const otp = Math.floor(100000 + Math.random() * 900000);
    const message = `Your verification code is: ${otp} -School of Robotics`;

    // Store OTP in OTP collection
    await OTP.findOneAndUpdate(
      { phone },
      { 
        phone,
        otp: otp.toString(),
        createdAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Send OTP via SMS
    await sendSMS(phone, message);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully for password reset"
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process forgot password request"
    });
  }
};


export const resetPassword = async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;

    // Validate input
    if (!phone || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Phone, OTP and new password are required"
      });
    }

    // Verify OTP
    const otpData = await OTP.findOne({ phone });
    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or not found"
      });
    }

    if (otpData.otp !== otp.toString()) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    // Find user
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword
    });

    // Cleanup OTP
    await OTP.deleteOne({ phone });

    return res.status(200).json({
      success: true,
      message: "Password reset successfully"
    });

  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset password"
    });
  }
};