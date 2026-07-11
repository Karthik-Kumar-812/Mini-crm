const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const AdminUser = require("../models/AdminUser");

async function seedDefaultAdmin() {
  if (mongoose.connection.readyState !== 1) {
    console.warn("⚠️  Skipping admin seed — database is not connected.");
    return;
  }

  const existingCount = await AdminUser.countDocuments();
  if (existingCount > 0) {
    return; // At least one admin already exists — nothing to do.
  }

  const username = (process.env.DEFAULT_ADMIN_USERNAME || "admin").toLowerCase();
  const password = process.env.DEFAULT_ADMIN_PASSWORD || "Admin@12345";
  const fullName = process.env.DEFAULT_ADMIN_FULLNAME || "Admin User";

  const passwordHash = await bcrypt.hash(password, 10);

  await AdminUser.create({ username, passwordHash, fullName });

  console.log("============================================================");
  console.log("🔑 Default admin account created:");
  console.log(`   username: ${username}`);
  console.log(`   password: ${password}`);
  console.log("   Please log in and change this password / user for production.");
  console.log("============================================================");
}

module.exports = seedDefaultAdmin;
