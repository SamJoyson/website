const mongoose = require("mongoose");

const vitalSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true
  },
  heartRate: {
    type: Number,
    required: true,
    min: 30,
    max: 250
  },
  spo2: {
    type: Number,
    required: true,
    min: 70,
    max: 100
  },
  temperature: {
    type: Number,
    required: true,
    min: 35,
    max: 42
  },
  respiratoryRate: {
    type: Number,
    required: true,
    min: 10,
    max: 40
  },
  stressLevel: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "low"
  },
  movement: {
    type: String,
    enum: ["resting", "moderate", "agitated", "exit_bed"],
    default: "resting"
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

vitalSchema.index({ patient: 1, timestamp: -1 });
vitalSchema.index({ timestamp: -1 });

vitalSchema.statics.findLatestByPatient = function(patientId, limit = 1) {
  return this.find({ patient: patientId })
             .sort({ timestamp: -1 })
             .limit(limit)
             .populate('patient', 'name patientID');
};


vitalSchema.statics.findHistoryByPatient = function(patientId, hours = 24) {
  const startTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
  return this.find({ 
    patient: patientId,
    timestamp: { $gte: startTime }
  }).sort({ timestamp: 1 }).populate('patient', 'name patientID');
};

module.exports = mongoose.model("Vital", vitalSchema);