import bcrypt from "bcrypt";
import { User } from "../models/User/userModel.js";

export const seedUsers = async () => {
    try {
        const users = [
            {
                name: "Student",
                phone: "01756217997",
                password: "12345678",
                role: "student",
                isVerified: true,
            },
            {
                name: "Admin",
                phone: "01715004006",
                password: "12345678",
                role: "admin",
                isVerified: true,
            },
        ];

        for (const user of users) {
            const exists = await User.findOne({ phone: user.phone });

            if (exists) continue;

            const hashedPassword = await bcrypt.hash(user.password, 10);

            await User.create({
                ...user,
                password: hashedPassword,
            });
        }

        console.log("✅ Users seeded successfully.");
    } catch (err) {
        console.error("❌ Seed failed:", err);
    }
};