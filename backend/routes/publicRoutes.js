const express = require("express");
const { createLead } = require("../controllers/leadController");
const { publicLeadLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// POST /api/public/leads
router.post("/leads", publicLeadLimiter, createLead);

module.exports = router;
