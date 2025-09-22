const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Doctor = require("./models/doctor");
const Patient = require("./models/patient");
const Assignment = require("./models/assignment");
const Vital = require("./models/vitals");

const app = express();
app.use(cors());
app.use(express.json());

const mongoURI = "mongodb+srv://samjoyson:samjoyson5806@smarthealthcluster.aof2ekj.mongodb.net/SmartHealthCare?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
  .then(() => console.log("✅ Database connected"))
  .catch(err => console.error("❌ Database connection error:", err));

app.post("/doctor/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const doctor = await Doctor.findOne({ email, password });
    if (!doctor) return res.status(401).json({ message: "Invalid credentials" });
    res.json({ message: "Login successful", doctor });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/patient/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const patient = await Patient.findOne({ email, password });
    if (!patient) return res.status(401).json({ message: "Invalid credentials" });
    res.json({ message: "Login successful", patient });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

function generatePatientID() {
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `PAT-${random}`;
}

app.post("/patient/register", async (req, res) => {
  try {
    const { name, age, weight, height, email, password } = req.body;

    if (!name || !age || !weight || !height || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingEmail = await Patient.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already registered" });
    }

    if (age < 1 || age > 150) {
      return res.status(400).json({ message: "Age must be between 1 and 150" });
    }

    if (weight < 1 || weight > 500) {
      return res.status(400).json({ message: "Weight must be between 1 and 500 kg" });
    }

    if (height < 30 || height > 300) {
      return res.status(400).json({ message: "Height must be between 30 and 300 cm" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    let patientID;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      patientID = generatePatientID();
      const existingPatient = await Patient.findOne({ patientID });
      if (!existingPatient) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ message: "Unable to generate unique Patient ID. Please try again." });
    }

    const patient = await Patient.create({
      patientID,
      name: name.trim(),
      age: parseInt(age),
      weight: parseFloat(weight),
      height: parseInt(height),
      email: email.toLowerCase().trim(),
      password
    });

    res.status(201).json({ 
      message: "Patient registered successfully", 
      patient: {
        patientID: patient.patientID,
        name: patient.name,
        email: patient.email
      }
    });

  } catch (err) {
    console.error("Registration error:", err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({ message: `${field} already exists` });
    }
    res.status(500).json({ message: "Server error during registration" });
  }
});

app.post("/assign-doctor", async (req, res) => {
  const { patientEmail, doctorID } = req.body;
  
  try {
    const patient = await Patient.findOne({ email: patientEmail });
    const doctor = await Doctor.findOne({ doctorID: doctorID });
    
    if (!patient || !doctor) {
      return res.status(404).json({ message: "Patient or Doctor not found" });
    }

    const existingAssignment = await Assignment.findOne({
      patient: patient._id,
      doctor: doctor._id
    });

    if (existingAssignment) {
      return res.status(400).json({ message: "Doctor already assigned to this patient" });
    }

    const assignment = await Assignment.create({
      patient: patient._id,
      doctor: doctor._id
    });

    res.json({ 
      message: "Doctor assigned successfully", 
      assignment 
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/patient-doctors/:patientEmail", async (req, res) => {
  try {
    const patient = await Patient.findOne({ email: req.params.patientEmail });
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    
    const assignments = await Assignment.find({ patient: patient._id }).populate('doctor');
    res.json({ doctors: assignments.map(a => a.doctor) });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/doctor-patients/:doctorID", async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ doctorID: req.params.doctorID });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    
    const assignments = await Assignment.find({ doctor: doctor._id }).populate('patient');
    res.json({ patients: assignments.map(a => a.patient) });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/vitals", async (req, res) => {
  try {
    const { patientEmail, heartRate, spo2, temperature, respiratoryRate, stressLevel, movement } = req.body;

    const patient = await Patient.findOne({ email: patientEmail });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const vital = await Vital.create({
      patient: patient._id,
      heartRate,
      spo2,
      temperature,
      respiratoryRate,
      stressLevel: stressLevel || "low",
      movement: movement || "resting"
    });

    await vital.populate('patient', 'name patientID email');

    res.status(201).json({
      message: "Vitals stored successfully",
      vital
    });

  } catch (err) {
    console.error("Error storing vitals:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.get("/api/vitals/latest/:patientEmail", async (req, res) => {
  try {
    const patient = await Patient.findOne({ email: req.params.patientEmail });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const vitals = await Vital.find({ patient: patient._id })
                             .sort({ timestamp: -1 })
                             .limit(15)
                             .populate('patient', 'name patientID email');

    res.json({
      patient: {
        name: patient.name,
        patientID: patient.patientID,
        email: patient.email
      },
      vitals
    });

  } catch (err) {
    console.error("Error fetching vitals:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/vitals/history/:patientEmail", async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const startTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    
    const patient = await Patient.findOne({ email: req.params.patientEmail });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const vitals = await Vital.find({ 
      patient: patient._id,
      timestamp: { $gte: startTime }
    }).sort({ timestamp: 1 }).populate('patient', 'name patientID');

    res.json({
      patient: {
        name: patient.name,
        patientID: patient.patientID
      },
      vitals
    });

  } catch (err) {
    console.error("Error fetching vitals history:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/doctor/vitals/:doctorID", async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ doctorID: req.params.doctorID });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const assignments = await Assignment.find({ doctor: doctor._id }).populate('patient');
    
    const patientsWithVitals = await Promise.all(
      assignments.map(async (assignment) => {
        const latestVital = await Vital.findOne({ patient: assignment.patient._id })
          .sort({ timestamp: -1 })
          .populate('patient', 'name patientID age weight height');
        
        return {
          patient: assignment.patient,
          latestVital: latestVital || null
        };
      })
    );

    res.json({ patientsWithVitals });

  } catch (err) {
    console.error("Error fetching doctor's patient vitals:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/doctor/patient-vitals/:patientEmail", async (req, res) => {
  try {
    const patient = await Patient.findOne({ email: req.params.patientEmail });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const latestVitals = await Vital.find({ patient: patient._id })
                                  .sort({ timestamp: -1 })
                                  .limit(1)
                                  .populate('patient', 'name patientID');

    if (latestVitals.length === 0) {
      return res.status(404).json({ message: "No vitals data found for patient" });
    }

    res.json({ vitals: latestVitals[0] });

  } catch (err) {
    console.error("Error fetching patient vitals:", err);
    res.status(500).json({ message: "Server error" });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
console.log(`📊 Vitals will be stored in: SmartHealthCare database -> vitals collection`);