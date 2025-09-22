const mongoose = require("mongoose");
const patientSchema = new mongoose.Schema({
  patientID: String,
  name: String,
  age: Number,
  weight: Number,
  height: Number,
  email: String,
  password: String
});
module.exports = mongoose.model("Patient", patientSchema);