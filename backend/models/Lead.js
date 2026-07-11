const mongoose = require("mongoose");

const LEAD_STATUSES = ["new", "contacted", "converted", "lost"];

const noteSchema = new mongoose.Schema(
  {
    note: {
      type: String,
      required: [true, "Note text is required"],
      trim: true,
      maxlength: [2000, "Note must be under 2000 characters"],
    },
    createdBy: {
      type: String,
      default: "admin",
    },
  },
  { timestamps: { createdAt: true, updatedAt: false }, _id: true }
);

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name must be under 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      maxlength: [150, "Email must be under 150 characters"],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [30, "Phone must be under 30 characters"],
      default: "",
    },
    source: {
      type: String,
      trim: true,
      maxlength: [100, "Source must be under 100 characters"],
      default: "Website Contact Form",
    },
    message: {
      type: String,
      trim: true,
      maxlength: [2000, "Message must be under 2000 characters"],
      default: "",
    },
    status: {
      type: String,
      enum: LEAD_STATUSES,
      default: "new",
    },
    ipAddress: {
      type: String,
      default: null,
    },
    notes: [noteSchema],
  },
  { timestamps: true } 
);

leadSchema.index({ status: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ name: "text", email: "text", message: "text" });

module.exports = mongoose.model("Lead", leadSchema);
module.exports.LEAD_STATUSES = LEAD_STATUSES;
