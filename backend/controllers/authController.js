const bcrypt = require("bcryptjs");
const AdminUser = require("../models/AdminUser");
const generateToken = require("../utils/generateToken");

// POST /api/auth/login
async function login(req, res) {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required.",
      });
    }

    const admin = await AdminUser.findOne({ username: username.trim().toLowerCase() });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(password, admin.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    const token = generateToken(admin);

    return res.json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        username: admin.username,
        fullName: admin.fullName,
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
}

async function me(req, res) {
  return res.json({
    success: true,
    message: "ok",
    data: { username: req.admin.username, fullName: req.admin.fullName },
  });
}

// PATCH /api/auth/change-password
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters.",
      });
    }

    const admin = await AdminUser.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin account not found." });
    }

    const passwordMatches = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }

    admin.passwordHash = await bcrypt.hash(newPassword, 10);
    await admin.save();

    return res.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("❌ Change password error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
}

module.exports = { login, me, changePassword };
