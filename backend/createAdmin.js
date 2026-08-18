const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

const User = require("./models/User");

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect MongoDB
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB Connected");

    const adminEmail = "admin@quizmaster.com";
    const adminPassword = "Admin@12345";

    // Check existing admin
    const existingAdmin = await User.findOne({
      email: adminEmail,
    });

    if (existingAdmin) {
      console.log("⚠️ Admin account already exists");

      await mongoose.connection.close();
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Create admin
    const admin = await User.create({
      name: "QuizMaster Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      isActive: true,
    });

    console.log("🎉 Admin created successfully!");
    console.log("--------------------------------");
    console.log("Email:", admin.email);
    console.log("Role:", admin.role);
    console.log("Password:", adminPassword);
    console.log("--------------------------------");

    await mongoose.connection.close();

    process.exit(0);
  } catch (error) {
    console.error("❌ Admin creation failed:");
    console.error(error.message);

    await mongoose.connection.close();

    process.exit(1);
  }
};

createAdmin();