const mongoose = require("mongoose");
const assignmentSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  }
});
module.exports = mongoose.model("Assignment", assignmentSchema);