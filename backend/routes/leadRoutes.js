const express = require("express");
const {
  getLeads,
  getLeadById,
  updateLeadStatus,
  addNote,
  deleteLead,
  getAnalytics,
} = require("../controllers/leadController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// Every route below requires a valid admin JWT.
router.use(requireAuth);

router.get("/analytics", getAnalytics);

router.get("/", getLeads);
router.get("/:id", getLeadById);
router.patch("/:id/status", updateLeadStatus);
router.post("/:id/notes", addNote);
router.delete("/:id", deleteLead);

module.exports = router;
