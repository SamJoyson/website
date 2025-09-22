const mongoose = require("mongoose");
const doctorSchema = new mongoose.Schema({
  doctorID: String,
  name: String,
  password: String,
  email: String
});
module.exports = mongoose.model("Doctor", doctorSchema);