const mongoose = require("mongoose");

const importErrorSchema = new mongoose.Schema(
  {
    row: { type: Number, required: true },
    sku: { type: String, default: "" },
    messages: { type: [String], default: [] }
  },
  { _id: false }
);

const importHistorySchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    fileHash: { type: String, required: true, unique: true },
    totalRows: { type: Number, required: true, default: 0 },
    imported: { type: Number, required: true, default: 0 },
    updated: { type: Number, required: true, default: 0 },
    failed: { type: Number, required: true, default: 0 },
    rowErrors: { type: [importErrorSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ImportHistory", importHistorySchema);
