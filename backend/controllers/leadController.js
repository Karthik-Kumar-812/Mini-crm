const validator = require("validator");
const mongoose = require("mongoose");
const Lead = require("../models/Lead");
const { LEAD_STATUSES } = require("../models/Lead");

async function createLead(req, res) {
  try {
    const { name, email, phone, source, message } = req.body || {};

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required.",
      });
    }

    if (name.trim().length < 2 || name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 100 characters.",
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (message && message.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Message must be under 2000 characters.",
      });
    }

    const lead = await Lead.create({
      name: validator.escape(name.trim()),
      email: email.trim().toLowerCase(),
      phone: phone ? validator.escape(phone.trim()) : "",
      source: source ? validator.escape(source.trim()) : "Website Contact Form",
      message: message ? validator.escape(message.trim()) : "",
      ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    });

    return res.status(201).json({
      success: true,
      message: "Thank you! Your message has been received.",
      data: { id: lead._id, createdAt: lead.createdAt },
    });
  } catch (error) {
    console.error("❌ createLead error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
}

async function getLeads(req, res) {
  try {
    const { status, search } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

    const filter = {};

    if (status && LEAD_STATUSES.includes(status)) {
      filter.status = status;
    }

    if (search && search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [{ name: regex }, { email: regex }, { message: regex }, { source: regex }];
    }

    const totalCount = await Lead.countDocuments(filter);
    const totalPages = Math.max(Math.ceil(totalCount / limit), 1);

    const leads = await Lead.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-notes"); 

    const leadsWithCounts = await Lead.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $project: {
          name: 1,
          email: 1,
          phone: 1,
          source: 1,
          message: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          notesCount: { $size: { $ifNull: ["$notes", []] } },
        },
      },
    ]);

    return res.json({
      success: true,
      message: "ok",
      data: {
        leads: leadsWithCounts,
        pagination: { page, limit, totalCount, totalPages },
      },
    });
  } catch (error) {
    console.error("❌ getLeads error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
}

// GET /api/leads/:id
async function getLeadById(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid lead id." });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found." });
    }

    return res.json({ success: true, message: "ok", data: lead });
  } catch (error) {
    console.error("❌ getLeadById error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
}

// PATCH /api/leads/:id/status
async function updateLeadStatus(req, res) {
  try {
    const { status } = req.body || {};

    if (!status || !LEAD_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${LEAD_STATUSES.join(", ")}.`,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid lead id." });
    }

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found." });
    }

    return res.json({ success: true, message: "Status updated.", data: lead });
  } catch (error) {
    console.error("❌ updateLeadStatus error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
}

// POST /api/leads/:id/notes
async function addNote(req, res) {
  try {
    const { note } = req.body || {};

    if (!note || !note.trim() || note.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Note text is required (at least 2 characters).",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid lead id." });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found." });
    }

    lead.notes.push({ note: note.trim(), createdBy: req.admin?.username || "admin" });
    await lead.save();

    return res.status(201).json({
      success: true,
      message: "Note added.",
      data: lead.notes[lead.notes.length - 1],
    });
  } catch (error) {
    console.error("❌ addNote error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
}

// DELETE /api/leads/:id
async function deleteLead(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid lead id." });
    }

    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found." });
    }

    return res.json({ success: true, message: "Lead deleted." });
  } catch (error) {
    console.error("❌ deleteLead error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
}

// GET /api/analytics
async function getAnalytics(req, res) {
  try {
    const counts = await Lead.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const byStatus = { new: 0, contacted: 0, converted: 0, lost: 0 };
    counts.forEach((c) => {
      byStatus[c._id] = c.count;
    });

    const totalLeads = Object.values(byStatus).reduce((sum, n) => sum + n, 0);
    const conversionRate =
      totalLeads > 0 ? Math.round((byStatus.converted / totalLeads) * 1000) / 10 : 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyRaw = await Lead.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]);
    const dailyMap = Object.fromEntries(dailyRaw.map((d) => [d._id, d.count]));
    const dailyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyTrend.push({ date: key, count: dailyMap[key] || 0 });
    }

    return res.json({
      success: true,
      message: "ok",
      data: {
        totalLeads,
        newCount: byStatus.new,
        contactedCount: byStatus.contacted,
        convertedCount: byStatus.converted,
        lostCount: byStatus.lost,
        conversionRate,
        dailyTrend,
      },
    });
  } catch (error) {
    console.error("❌ getAnalytics error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  createLead,
  getLeads,
  getLeadById,
  updateLeadStatus,
  addNote,
  deleteLead,
  getAnalytics,
};
