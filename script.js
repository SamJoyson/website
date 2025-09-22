const API_URL = "http://localhost:3000";
let currentUser = null;
let userType = null;
let assignedDoctors = [];
let assignedPatients = [];
let selectedPatient = null;
let heartRateChart = null;
let spo2Chart = null;
let tempChart = null;
let respiratoryChart = null;
let doctorHeartRateChart = null;
let doctorSpo2Chart = null;
let doctorTempChart = null;
let doctorRespiratoryChart = null;
let heartRateData = [];
let spo2Data = [];
let tempData = [];
let respiratoryData = [];
let doctorHeartRateData = [];
let doctorSpo2Data = [];
let doctorTempData = [];
let doctorRespiratoryData = [];
const MAX_DATA_POINTS = 15;
let heartbeatInterval = null;
let doctorHeartbeatInterval = null;
let monitoringStartTime = null;
let monitoringInterval = null;
let animationInitialized = false;
let doctorChartsInitialized = false;

function destroyChartIfExists(chart) {
  if (chart) {
    chart.destroy();
  }
}

function destroyAllDoctorCharts() {
  destroyChartIfExists(doctorHeartRateChart);
  destroyChartIfExists(doctorSpo2Chart);
  destroyChartIfExists(doctorTempChart);
  destroyChartIfExists(doctorRespiratoryChart);
  
  doctorHeartRateChart = null;
  doctorSpo2Chart = null;
  doctorTempChart = null;
  doctorRespiratoryChart = null;
  
  doctorHeartRateData = [];
  doctorSpo2Data = [];
  doctorTempData = [];
  doctorRespiratoryData = [];
  
  doctorChartsInitialized = false;
}

function destroyAllPatientCharts() {
  destroyChartIfExists(heartRateChart);
  destroyChartIfExists(spo2Chart);
  destroyChartIfExists(tempChart);
  destroyChartIfExists(respiratoryChart);
  
  heartRateChart = null;
  spo2Chart = null;
  tempChart = null;
  respiratoryChart = null;
  
  heartRateData = [];
  spo2Data = [];
  tempData = [];
  respiratoryData = [];
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const mainContent = document.getElementById("mainContent");
  sidebar.classList.toggle("open");
  mainContent.classList.toggle("shifted");
}

function toggleDoctorSidebar() {
  const sidebar = document.getElementById("doctorSidebar");
  const mainContent = document.getElementById("doctorMainContent");
  sidebar.classList.toggle("open");
  mainContent.classList.toggle("shifted");
}

document.addEventListener("DOMContentLoaded", function() {
  const sidebarToggle = document.getElementById("sidebarToggle");
  const doctorSidebarToggle = document.getElementById("doctorSidebarToggle");
  
  if (sidebarToggle) sidebarToggle.addEventListener("click", toggleSidebar);
  if (doctorSidebarToggle) doctorSidebarToggle.addEventListener("click", toggleDoctorSidebar);
});

function showDoctorLogin() {
  document.getElementById("doctorSection").style.display = "block";
  document.getElementById("patientSection").style.display = "none";
  document.getElementById("mainSection").style.display = "none";
  document.getElementById("patientRegistrationSection").style.display = "none";
}

function showPatientLogin() {
  document.getElementById("patientSection").style.display = "block";
  document.getElementById("doctorSection").style.display = "none";
  document.getElementById("mainSection").style.display = "none";
  document.getElementById("patientRegistrationSection").style.display = "none";
}

function showPatientRegistration() {
  document.getElementById("patientRegistrationSection").style.display = "block";
  document.getElementById("patientSection").style.display = "none";
  document.getElementById("doctorSection").style.display = "none";
  document.getElementById("mainSection").style.display = "none";
}

async function patientRegistration(event) {
  event.preventDefault();
  
  const name = document.getElementById("regPatientName").value;
  const age = parseInt(document.getElementById("regPatientAge").value);
  const weight = parseFloat(document.getElementById("regPatientWeight").value);
  const height = parseInt(document.getElementById("regPatientHeight").value);
  const email = document.getElementById("regPatientEmail").value;
  const password = document.getElementById("regPatientPassword").value;
  const confirmPassword = document.getElementById("regPatientConfirmPassword").value;

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  if (age < 1 || age > 150) {
    alert("Please enter a valid age between 1 and 150");
    return;
  }

  if (weight < 1 || weight > 500) {
    alert("Please enter a valid weight between 1 and 500 kg");
    return;
  }

  if (height < 30 || height > 300) {
    alert("Please enter a valid height between 30 and 300 cm");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/patient/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        age,
        weight,
        height,
        email,
        password
      })
    });

    const data = await res.json();
    if (res.ok) {
      alert(`Registration successful! Your Patient ID is: ${data.patient.patientID}. Please login with your credentials.`);
      document.getElementById("regPatientName").value = "";
      document.getElementById("regPatientAge").value = "";
      document.getElementById("regPatientWeight").value = "";
      document.getElementById("regPatientHeight").value = "";
      document.getElementById("regPatientEmail").value = "";
      document.getElementById("regPatientPassword").value = "";
      document.getElementById("regPatientConfirmPassword").value = "";
      showPatientLogin();
    } else {
      alert(data.message || "Registration failed");
    }
  } catch (err) {
    alert("Error connecting to server");
    console.error(err);
  }
}

async function doctorLogin(event) {
  event.preventDefault();
  const email = document.getElementById("doctorEmail").value;
  const password = document.getElementById("doctorPassword").value;

  try {
    const res = await fetch(`${API_URL}/doctor/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (res.ok) {
      currentUser = data.doctor;
      userType = 'doctor';
      showDoctorDashboard();
      populateDoctorProfile();
      loadDoctorPatients();
    } else {
      alert(data.message || "Login failed");
    }
  } catch (err) {
    alert("Error connecting to server");
    console.error(err);
  }
}

async function patientLogin(event) {
  event.preventDefault();
  const email = document.getElementById("patientEmail").value;
  const password = document.getElementById("patientPassword").value;

  try {
    const res = await fetch(`${API_URL}/patient/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (res.ok) {
      currentUser = data.patient;
      userType = 'patient';
      showPatientDashboard();
      populatePatientProfile();
      loadPatientDoctors();
      startVitalMonitoring();
    } else {
      alert(data.message || "Login failed");
    }
  } catch (err) {
    alert("Error connecting to server");
    console.error(err);
  }
}

function showDoctorDashboard() {
  document.getElementById("doctorDashboard").style.display = "flex";
  document.getElementById("doctorSection").style.display = "none";
  document.getElementById("patientSection").style.display = "none";
  document.getElementById("mainSection").style.display = "none";
  document.getElementById("patientRegistrationSection").style.display = "none";
  if (!doctorChartsInitialized) {
    initializeDoctorVitalCharts();
  }
  initializeDoctorStatusCards();
}

function showPatientDashboard() {
  document.getElementById("patientDashboard").style.display = "flex";
  document.getElementById("doctorSection").style.display = "none";
  document.getElementById("patientSection").style.display = "none";
  document.getElementById("mainSection").style.display = "none";
  document.getElementById("patientRegistrationSection").style.display = "none";
}

function populatePatientProfile() {
  if (currentUser) {
    document.getElementById("profilePatientID").textContent = currentUser.patientID || "-";
    document.getElementById("profileName").textContent = currentUser.name || "-";
    document.getElementById("profileAge").textContent = currentUser.age || "-";
    document.getElementById("profileWeight").textContent = currentUser.weight || "-";
    document.getElementById("profileHeight").textContent = currentUser.height || "-";
    document.getElementById("profileEmail").textContent = currentUser.email || "-";
    document.getElementById("welcomeName").textContent = currentUser.name || "Patient";
  }
}

function populateDoctorProfile() {
  if (currentUser) {
    document.getElementById("profileDoctorID").textContent = currentUser.doctorID || "-";
    document.getElementById("profileDoctorName").textContent = currentUser.name || "-";
    document.getElementById("profileDoctorEmail").textContent = currentUser.email || "-";
    document.getElementById("welcomeDoctorName").textContent = currentUser.name || "Doctor";
  }
}

async function assignDoctorFromSidebar() {
  const doctorID = document.getElementById("sidebarDoctorID").value;
  const patientEmail = currentUser.email;

  if (!doctorID) {
    document.getElementById("sidebarAssignmentMessage").textContent = "Please enter a Doctor ID";
    document.getElementById("sidebarAssignmentMessage").style.color = "#ff6b6b";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/assign-doctor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientEmail, doctorID })
    });

    const data = await res.json();
    if (res.ok) {
      document.getElementById("sidebarAssignmentMessage").textContent = "Doctor assigned successfully!";
      document.getElementById("sidebarAssignmentMessage").style.color = "#51cf66";
      document.getElementById("sidebarDoctorID").value = "";
      loadPatientDoctors();
    } else {
      document.getElementById("sidebarAssignmentMessage").textContent = data.message || "Failed to assign doctor";
      document.getElementById("sidebarAssignmentMessage").style.color = "#ff6b6b";
    }
  } catch (err) {
    document.getElementById("sidebarAssignmentMessage").textContent = "Error connecting to server";
    document.getElementById("sidebarAssignmentMessage").style.color = "#ff6b6b";
  }
}

async function loadPatientDoctors() {
  try {
    const res = await fetch(`${API_URL}/patient-doctors/${currentUser.email}`);
    const data = await res.json();
    
    if (res.ok) {
      assignedDoctors = data.doctors;
      showAssignedDoctorsInfo();
    }
  } catch (err) {
    console.error("Error loading doctors:", err);
  }
}

function showAssignedDoctorsInfo() {
  const container = document.getElementById("currentDoctorsInfo");
  if (assignedDoctors.length > 0) {
    container.style.display = "block";
    container.innerHTML = `
      <h3>Your Assigned Doctors</h3>
      ${assignedDoctors.map(doctor => `
        <div style="margin: 10px 0; padding: 10px; background: #e8f5e8; border-radius: 5px;">
          <p><strong>Doctor ID:</strong> ${doctor.doctorID || '-'}</p>
          <p><strong>Name:</strong> ${doctor.name || '-'}</p>
          <p><strong>Email:</strong> ${doctor.email || '-'}</p>
        </div>
      `).join('')}
    `;
  } else {
    container.style.display = "none";
    container.innerHTML = "";
  }
}

async function loadDoctorPatients() {
  try {
    const res = await fetch(`${API_URL}/doctor-patients/${currentUser.doctorID}`);
    const data = await res.json();
    
    if (res.ok) {
      assignedPatients = data.patients;
      showAssignedPatientsList();
      updatePatientCount();
    }
  } catch (err) {
    console.error("Error loading patients:", err);
  }
}

function showAssignedPatientsList() {
  const container = document.getElementById("patientList");
  if (assignedPatients.length > 0) {
    container.innerHTML = assignedPatients.map(patient => `
      <div style="padding: 8px; margin: 5px 0; background: #34495e; border-radius: 4px; cursor: pointer; border: 2px solid transparent;" 
           onclick="selectPatient('${patient._id}')"
           onmouseover="this.style.borderColor='#3498db'" 
           onmouseout="this.style.borderColor='transparent'">
        <p style="color: white; margin: 0; font-size: 14px;"><strong>${patient.name || 'Unknown'}</strong></p>
        <p style="color: #bdc3c7; margin: 0; font-size: 12px;">ID: ${patient.patientID || '-'}</p>
      </div>
    `).join('');
  } else {
    container.innerHTML = '<p style="color: #bdc3c7; text-align: center; font-size: 12px;">No patients assigned</p>';
  }
}

function selectPatient(patientId) {
  if (doctorHeartbeatInterval) {
    clearInterval(doctorHeartbeatInterval);
    doctorHeartbeatInterval = null;
  }
  
  selectedPatient = assignedPatients.find(p => p._id === patientId);
  if (selectedPatient) {
    showSelectedPatientInfo();
    updateDoctorStatusCards(null, null, null, null);
    if (animationInitialized && typeof HealthCareAnimations !== 'undefined') {
        HealthCareAnimations.animatePatientStatus(false);
    }
    startDoctorHeartbeatMonitoring();
  }
}

function showSelectedPatientInfo() {
  const container = document.getElementById("selectedPatientInfo");
  const detailsContainer = document.getElementById("patientDetails");
  
  if (selectedPatient) {
    container.style.display = "block";
    detailsContainer.innerHTML = `
      <p><strong>Patient ID:</strong> ${selectedPatient.patientID || '-'}</p>
      <p><strong>Name:</strong> ${selectedPatient.name || '-'}</p>
      <p><strong>Age:</strong> ${selectedPatient.age || '-'}</p>
      <p><strong>Weight:</strong> ${selectedPatient.weight || '-'} kg</p>
      <p><strong>Height:</strong> ${selectedPatient.height || '-'} cm</p>
      <p><strong>Email:</strong> ${selectedPatient.email || '-'}</p>
      <p><strong>Status:</strong> <span id="patientOnlineStatus" style="color: #e74c3c;">Offline</span></p>
    `;
  } else {
    container.style.display = "none";
  }
}

function updatePatientCount() {
  document.getElementById("profilePatientCount").textContent = assignedPatients.length;
}

function initializeVitalCharts() {
  destroyAllPatientCharts();
  
  heartRateChart = initializeChart('heartRateChart', '#e74c3c', 'Heart Rate (BPM)', 50, 120);
  spo2Chart = initializeChart('spo2Chart', '#3498db', 'SPO2 (%)', 85, 100);
  tempChart = initializeChart('tempChart', '#f39c12', 'Temperature (°C)', 35, 40);
  respiratoryChart = initializeChart('respiratoryChart', '#9b59b6', 'Respiratory Rate', 12, 25);
}

function initializeDoctorVitalCharts() {
  if (doctorChartsInitialized) return;
  
  doctorHeartRateChart = initializeChart('doctorHeartRateChart', '#e74c3c', 'Heart Rate (BPM)', 50, 120);
  doctorSpo2Chart = initializeChart('doctorSpo2Chart', '#3498db', 'SPO2 (%)', 85, 100);
  doctorTempChart = initializeChart('doctorTempChart', '#f39c12', 'Temperature (°C)', 35, 40);
  doctorRespiratoryChart = initializeChart('doctorRespiratoryChart', '#9b59b6', 'Respiratory Rate', 12, 25);
  
  initializeChartWithEmptyData();
  doctorChartsInitialized = true;
}

function initializeChartWithEmptyData() {
  const emptyData = Array(MAX_DATA_POINTS).fill(null);
  
  if (doctorHeartRateChart) {
    doctorHeartRateChart.data.datasets[0].data = emptyData;
    doctorHeartRateChart.update('none');
  }
  if (doctorSpo2Chart) {
    doctorSpo2Chart.data.datasets[0].data = emptyData;
    doctorSpo2Chart.update('none');
  }
  if (doctorTempChart) {
    doctorTempChart.data.datasets[0].data = emptyData;
    doctorTempChart.update('none');
  }
  if (doctorRespiratoryChart) {
    doctorRespiratoryChart.data.datasets[0].data = emptyData;
    doctorRespiratoryChart.update('none');
  }
  
  document.getElementById('doctorCurrentBPM').textContent = '--';
  document.getElementById('doctorCurrentSPO2').textContent = '--';
  document.getElementById('doctorCurrentTemp').textContent = '--';
  document.getElementById('doctorCurrentResp').textContent = '--';
}

function initializeChart(canvasId, color, label, min, max) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    console.error(`Canvas element ${canvasId} not found`);
    return null;
  }
  
  const existingChart = Chart.getChart(ctx);
  if (existingChart) {
    return existingChart;
  }
  
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array(MAX_DATA_POINTS).fill(''),
      datasets: [{
        label: label,
        data: Array(MAX_DATA_POINTS).fill(null),
        borderColor: color,
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 0
      },
      scales: {
        y: { 
          min: min,
          max: max,
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: {
            color: '#ecf0f1',
            font: { size: 10 }
          }
        },
        x: { 
          grid: { display: false },
          ticks: { display: false }
        }
      },
      plugins: { 
        legend: { display: false }
      },
      elements: {
        line: {
          tension: 0.4
        }
      }
    }
  });
}

function startVitalMonitoring() {
  initializeVitalCharts();
  startMonitoringTimer();
  
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  
  heartbeatInterval = setInterval(() => {
    updateVitalCharts();
  }, 1000);
}

function startDoctorHeartbeatMonitoring() {
  if (!doctorChartsInitialized) {
    initializeDoctorVitalCharts();
  }
  
  if (doctorHeartbeatInterval) clearInterval(doctorHeartbeatInterval);
  
  doctorHeartbeatInterval = setInterval(() => {
    updateDoctorVitalCharts();
  }, 500);
}

async function updateVitalCharts() {
  const randomBPM = Math.floor(Math.random() * 40) + 60;
  const randomSPO2 = Math.floor(Math.random() * 5) + 95;
  const randomTemp = (Math.random() * 1.5) + 36.5;
  const randomResp = Math.floor(Math.random() * 8) + 12;

  try {
    const response = await fetch(`${API_URL}/api/vitals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientEmail: currentUser.email,
        heartRate: randomBPM,
        spo2: randomSPO2,
        temperature: randomTemp,
        respiratoryRate: randomResp
      })
    });
  } catch (err) {
    console.error("Network error sending vitals:", err);
  }

  updateChartData(heartRateChart, heartRateData, randomBPM, 'currentBPM');
  updateChartData(spo2Chart, spo2Data, randomSPO2, 'currentSPO2');
  updateChartData(tempChart, tempData, randomTemp, 'currentTemp');
  updateChartData(respiratoryChart, respiratoryData, randomResp, 'currentResp');
  
  updateHealthDashboard();
}

async function updateDoctorVitalCharts() {
    if (!selectedPatient) return;
    
    let bpm = null, spo2 = null, temp = null, resp = null;
    
    try {
        const timestamp = Date.now();
        const res = await fetch(`${API_URL}/api/doctor/patient-vitals/${selectedPatient.email}?t=${timestamp}`);
        const data = await res.json();
        
        if (res.ok && data.vitals) {
            const vitals = data.vitals;
            bpm = vitals.heartRate;
            spo2 = vitals.spo2;
            temp = vitals.temperature;
            resp = vitals.respiratoryRate;
            
            updateChartData(doctorHeartRateChart, doctorHeartRateData, bpm, 'doctorCurrentBPM');
            updateChartData(doctorSpo2Chart, doctorSpo2Data, spo2, 'doctorCurrentSPO2');
            updateChartData(doctorTempChart, doctorTempData, temp, 'doctorCurrentTemp');
            updateChartData(doctorRespiratoryChart, doctorRespiratoryData, resp, 'doctorCurrentResp');
            
            if (document.getElementById('patientOnlineStatus')) {
                document.getElementById('patientOnlineStatus').textContent = 'Online';
                document.getElementById('patientOnlineStatus').style.color = '#27ae60';
            }
        } else {
            if (document.getElementById('patientOnlineStatus')) {
                document.getElementById('patientOnlineStatus').textContent = 'Offline';
                document.getElementById('patientOnlineStatus').style.color = '#e74c3c';
            }
        }
    } catch (err) {
        console.error("Doctor could not fetch patient vitals:", err);
        if (document.getElementById('patientOnlineStatus')) {
            document.getElementById('patientOnlineStatus').textContent = 'Offline';
            document.getElementById('patientOnlineStatus').style.color = '#e74c3c';
        }
    }
    
    updateDoctorStatusCards(bpm, spo2, temp, resp);
}

function updateChartData(chart, dataArray, newValue, displayElementId) {
  if (!chart) return;
  
  if (newValue !== 0 && newValue !== null) {
    dataArray.push(newValue);
    if (dataArray.length > MAX_DATA_POINTS) {
      dataArray.shift();
    }
    
    chart.data.datasets[0].data = dataArray;
    chart.update('none');
  }
  
  if (displayElementId) {
    const displayElement = document.getElementById(displayElementId);
    if (displayElement) {
      displayElement.textContent = (newValue === 0 || newValue === null) ? '--' : 
                                  (displayElementId.includes('Temp') ? newValue.toFixed(1) : Math.round(newValue));
    }
  }
}

function updateHealthDashboard() {
  updateStatusIndicators();
  updateStatistics();
  updateLastUpdateTime();
  checkForAlerts();
}

function updateStatusIndicators() {
  const currentBPM = heartRateData[heartRateData.length - 1] || 0;
  const currentSPO2 = spo2Data[spo2Data.length - 1] || 0;
  const currentTemp = tempData[tempData.length - 1] || 0;

  document.getElementById('heartStatus').textContent = 
    currentBPM >= 60 && currentBPM <= 100 ? 'NORMAL' : 'ALERT';
  
  document.getElementById('oxygenStatus').textContent = 
    currentSPO2 >= 95 ? 'NORMAL' : 'LOW';
  
  document.getElementById('tempStatus').textContent = 
    currentTemp >= 36.5 && currentTemp <= 37.5 ? 'NORMAL' : 'FEVER';

  const overallStatus = (currentBPM >= 60 && currentBPM <= 100 && 
                        currentSPO2 >= 95 && 
                        currentTemp >= 36.5 && currentTemp <= 37.5) ? 'STABLE' : 'WARNING';
  
  document.getElementById('overallStatus').textContent = overallStatus;

  updateStatusCardColors();
}

function updateStatusCardColors() {
  const statusCards = {
    heartStatusCard: document.getElementById('heartStatus').textContent,
    oxygenStatusCard: document.getElementById('oxygenStatus').textContent,
    tempStatusCard: document.getElementById('tempStatus').textContent,
    overallStatusCard: document.getElementById('overallStatus').textContent
  };

  Object.entries(statusCards).forEach(([cardId, status]) => {
    const card = document.getElementById(cardId);
    if (card) {
      if (status === 'NORMAL' || status === 'STABLE') {
        card.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
      } else {
        card.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
      }
    }
  });
}

function initializeDoctorStatusCards() {
    const statusContainer = document.getElementById('doctorStatusCards');
    if (statusContainer) {
        statusContainer.style.display = 'grid';
    }
    
    updateDoctorStatusCards(null, null, null, null);
}

function updateDoctorStatusCards(bpm, spo2, temp, resp) {
    const isOnline = bpm !== null && bpm !== 0;
    
    const bpmElement = document.getElementById('doctorCurrentBPMValue');
    const spo2Element = document.getElementById('doctorCurrentSPO2Value');
    const tempElement = document.getElementById('doctorCurrentTempValue');
    
    if (bpmElement) bpmElement.textContent = isOnline ? `${Math.round(bpm || 0)} BPM` : '-- BPM';
    if (spo2Element) spo2Element.textContent = isOnline ? `${Math.round(spo2 || 0)}%` : '--%';
    if (tempElement) tempElement.textContent = isOnline ? `${(temp || 0).toFixed(1)}°C` : '--°C';
    
    const heartStatus = isOnline ? (bpm >= 60 && bpm <= 100 ? 'NORMAL' : 'ALERT') : 'OFFLINE';
    const oxygenStatus = isOnline ? (spo2 >= 95 ? 'NORMAL' : 'LOW') : 'OFFLINE';
    const tempStatus = isOnline ? (temp >= 36.5 && temp <= 37.5 ? 'NORMAL' : 'FEVER') : 'OFFLINE';
    const overallStatus = isOnline ? 
        (heartStatus === 'NORMAL' && oxygenStatus === 'NORMAL' && tempStatus === 'NORMAL' ? 'STABLE' : 'WARNING') : 
        'OFFLINE';
    
    const heartStatusElement = document.getElementById('doctorHeartStatus');
    const oxygenStatusElement = document.getElementById('doctorOxygenStatus');
    const tempStatusElement = document.getElementById('doctorTempStatus');
    const overallStatusElement = document.getElementById('doctorOverallStatus');
    
    if (heartStatusElement) heartStatusElement.textContent = heartStatus;
    if (oxygenStatusElement) oxygenStatusElement.textContent = oxygenStatus;
    if (tempStatusElement) tempStatusElement.textContent = tempStatus;
    if (overallStatusElement) overallStatusElement.textContent = overallStatus;
    
    updateDoctorStatusCardColors(heartStatus, oxygenStatus, tempStatus, overallStatus);
}

function updateDoctorStatusCardColors(heartStatus, oxygenStatus, tempStatus, overallStatus) {
    const cards = {
        'doctorHeartStatusCard': heartStatus,
        'doctorOxygenStatusCard': oxygenStatus,
        'doctorTempStatusCard': tempStatus,
        'doctorOverallStatusCard': overallStatus
    };
    
    Object.entries(cards).forEach(([cardId, status]) => {
        const card = document.getElementById(cardId);
        if (card) {
            card.classList.remove('status-normal', 'status-warning', 'status-critical', 'status-offline');
            
            if (status === 'OFFLINE') {
                card.classList.add('status-offline');
            } else if (status === 'NORMAL' || status === 'STABLE') {
                card.classList.add('status-normal');
            } else if (status === 'ALERT' || status === 'LOW' || status === 'FEVER') {
                card.classList.add('status-warning');
            } else if (status === 'WARNING') {
                card.classList.add('status-critical');
            }
        }
    });
}

function updateStatistics() {
  const avgBPM = heartRateData.length ? 
    Math.round(heartRateData.reduce((a, b) => a + b) / heartRateData.length) : '--';
  const avgSPO2 = spo2Data.length ? 
    Math.round(spo2Data.reduce((a, b) => a + b) / spo2Data.length) : '--';
  const avgTemp = tempData.length ? 
    (tempData.reduce((a, b) => a + b) / tempData.length).toFixed(1) : '--';

  document.getElementById('avgHeartRate').textContent = avgBPM;
  document.getElementById('avgSPO2').textContent = avgSPO2;
  document.getElementById('avgTemp').textContent = avgTemp;
}

function updateLastUpdateTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString();
  document.getElementById('lastUpdateTime').textContent = timeString;
}

function startMonitoringTimer() {
  monitoringStartTime = new Date();
  if (monitoringInterval) clearInterval(monitoringInterval);
  
  monitoringInterval = setInterval(() => {
    const elapsed = Math.floor((new Date() - monitoringStartTime) / 60000);
    document.getElementById('monitoringTime').textContent = elapsed;
  }, 60000);
}

function checkForAlerts() {
  const currentBPM = heartRateData[heartRateData.length - 1] || 0;
  const currentSPO2 = spo2Data[spo2Data.length - 1] || 0;
  const currentTemp = tempData[tempData.length - 1] || 0;

  const criticalAlert = document.getElementById('criticalAlert');
  const warningAlert = document.getElementById('warningAlert');
  const now = new Date().toLocaleTimeString();

  if (currentBPM < 50 || currentBPM > 140 || currentSPO2 < 90 || currentTemp > 39) {
    criticalAlert.classList.add('critical');
    criticalAlert.innerHTML = `
      <span class="alert-icon">🚨</span>
      <span class="alert-message">CRITICAL: Abnormal vital signs detected!</span>
      <span class="alert-time">${now}</span>
    `;
  } else {
    criticalAlert.classList.remove('critical');
    criticalAlert.innerHTML = `
      <span class="alert-icon">🚨</span>
      <span class="alert-message">No critical alerts</span>
      <span class="alert-time">--:--:--</span>
    `;
  }

  if ((currentBPM >= 50 && currentBPM < 60) || (currentBPM > 100 && currentBPM <= 140) || 
      (currentSPO2 >= 90 && currentSPO2 < 95) || (currentTemp >= 37.6 && currentTemp <= 39)) {
    warningAlert.innerHTML = `
      <span class="alert-icon">⚠️</span>
      <span class="alert-message">Warning: Slightly abnormal readings</span>
      <span class="alert-time">${now}</span>
    `;
  } else {
    warningAlert.innerHTML = `
      <span class="alert-icon">⚠️</span>
      <span class="alert-message">No warnings</span>
      <span class="alert-time">--:--:--</span>
    `;
  }
}

function triggerEmergencyAlert() {
  if (animationInitialized && typeof HealthCareAnimations !== 'undefined') {
    HealthCareAnimations.triggerEmergencyAnimation();
  }
  alert("Emergency alert sent to your assigned doctors!");
}

function shareHealthReport() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
    heartRate: heartRateData,
    spo2: spo2Data,
    temperature: tempData,
    respiratoryRate: respiratoryData,
    patient: currentUser
  }, null, 2));
  
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "health_report.txt");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

function downloadHealthData() {
  shareHealthReport();
}

function contactDoctor() {
  if (assignedDoctors.length > 0) {
    alert(`Contacting Dr. ${assignedDoctors[0].name}...`);
  } else {
    alert("No doctors assigned to your account.");
  }
}

function logout() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  if (doctorHeartbeatInterval) clearInterval(doctorHeartbeatInterval);
  if (monitoringInterval) clearInterval(monitoringInterval);
  
  destroyAllDoctorCharts();
  destroyAllPatientCharts();
  
  heartRateData = [];
  spo2Data = [];
  tempData = [];
  respiratoryData = [];
  doctorHeartRateData = [];
  doctorSpo2Data = [];
  doctorTempData = [];
  doctorRespiratoryData = [];
  
  currentUser = null;
  userType = null;
  assignedDoctors = [];
  assignedPatients = [];
  selectedPatient = null;
  doctorChartsInitialized = false;
  
  document.getElementById("mainSection").style.display = "block";
  document.getElementById("doctorSection").style.display = "none";
  document.getElementById("patientSection").style.display = "none";
  document.getElementById("patientDashboard").style.display = "none";
  document.getElementById("doctorDashboard").style.display = "none";
  document.getElementById("patientRegistrationSection").style.display = "none";
  
  document.getElementById("doctorEmail").value = "";
  document.getElementById("doctorPassword").value = "";
  document.getElementById("patientEmail").value = "";
  document.getElementById("patientPassword").value = "";
}

window.testSendVitals = function() {
  const testData = {
    patientEmail: "patient@example.com",
    heartRate: Math.floor(Math.random() * 40) + 60,
    spo2: Math.floor(Math.random() * 5) + 95,
    temperature: (Math.random() * 1.5) + 36.5,
    respiratoryRate: Math.floor(Math.random() * 8) + 12
  };

  fetch(`${API_URL}/api/vitals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testData)
  })
  .then(response => response.json())
  .then(data => console.log("Test vitals sent:", data))
  .catch(err => console.error("Test failed:", err));
}

document.addEventListener("DOMContentLoaded", function() {
    console.log("Smart Health Care Dashboard initialized");
    
    if (typeof HealthCareAnimations !== 'undefined') {
        HealthCareAnimations.init();
        animationInitialized = true;
    }
});