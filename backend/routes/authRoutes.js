const express = require("express");
const { login, me, changePassword } = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");
const { loginLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.post("/login", loginLimiter, login);
router.get("/me", requireAuth, me);
router.patch("/change-password", requireAuth, changePassword);

module.exports = router;
