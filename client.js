// public/client.js
const socket = io();

// UI refs
const tempValue = document.getElementById("tempValue");
const humValue = document.getElementById("humValue");
const sensorState = document.getElementById("sensorState");
const lastAt = document.getElementById("lastAt");
const logBox = document.getElementById("logBox");

// charts
let labels = [], tdata = [], hdata = [];
const maxPoints = 30;

const dashCtx = document.getElementById("dashChart").getContext("2d");
const dashChart = new Chart(dashCtx, {
  type: "line",
  data: {
    labels, datasets: [
      { label: "Temp °C", data: tdata, borderWidth:2, borderColor:"#ff7875", backgroundColor:"rgba(255,120,117,0.12)", fill:true, tension:0.35 },
      { label: "Hum %", data: hdata, borderWidth:2, borderColor:"#4dd0e1", backgroundColor:"rgba(77,208,225,0.08)", fill:true, tension:0.35 }
    ]
  },
  options: { responsive:true, plugins:{legend:{display:false}}, scales:{ y:{ beginAtZero:false } } }
});

const tCtx = document.getElementById("tempChart").getContext("2d");
const tempChart = new Chart(tCtx, { type:"line", data:{ labels:[], datasets:[{label:"Temp °C", data:[], borderColor:"#ff6b6b", backgroundColor:"rgba(255,107,107,0.2)", fill:true, tension:0.35 }] }, options:{responsive:true, scales:{ y:{beginAtZero:false}}}});

const hCtx = document.getElementById("humChart").getContext("2d");
const humChart = new Chart(hCtx, { type:"line", data:{ labels:[], datasets:[{label:"Hum %", data:[], borderColor:"#6ee7b7", backgroundColor:"rgba(110,231,183,0.12)", fill:true, tension:0.35 }] }, options:{responsive:true, scales:{ y:{beginAtZero:true}}}});

// handle incoming sensor data
socket.on("sensor-data", (p) => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString();
  // show raw log
  appendLog(`[${timeStr}] ${p.raw}`);

  // update numbers
  if (p.temp !== null) {
    tempValue.innerText = p.temp.toFixed(1) + " °C";
    pushAndTrim(labels, timeStr);
    pushAndTrim(tdata, p.temp);
    tempChart.data.labels = labels;
    tempChart.data.datasets[0].data = tdata;
    tempChart.update();
  }
  if (p.hum !== null) {
    humValue.innerText = p.hum.toFixed(1) + " %";
    pushAndTrim(hdata, p.hum);
    humChart.data.labels = labels;
    humChart.data.datasets[0].data = hdata;
    humChart.update();
  }
  // dashboard combined
  dashChart.data.labels = labels;
  dashChart.data.datasets[0].data = tdata;
  dashChart.data.datasets[1].data = hdata;
  dashChart.update();

  // sensor status
  sensorState.innerText = "Online ✅";
  lastAt.innerText = timeStr;

  // alarms (visual)
  checkAlarms(p);
});

socket.on("connect", () => appendLog("Socket conectado ✅"));
socket.on("disconnect", () => { appendLog("Socket desconectado ❌"); sensorState.innerText = "Offline"; });

// helpers
function appendLog(txt){
  logBox.innerHTML = txt + "<br>" + logBox.innerHTML;
}
function pushAndTrim(arr, v){
  arr.push(v);
  if (arr.length > maxPoints) arr.shift();
}

// simple alarm: temperatura > 30 or hum > 80
function checkAlarms(p){
  const cardTemp = document.getElementById("tempValue");
  if (p.temp !== null && p.temp > 30) {
    cardTemp.style.color = "#ff6b6b";
    appendLog("⚠️ Alerta: Temperatura alta: " + p.temp.toFixed(1));
  } else {
    cardTemp.style.color = "";
  }
  const cardHum = document.getElementById("humValue");
  if (p.hum !== null && p.hum > 85){
    cardHum.style.color = "#ffd166";
    appendLog("⚠️ Alerta: Umidade alta: " + p.hum.toFixed(1));
  } else { cardHum.style.color = ""; }
}

// theme toggle / logout
document.getElementById("btnTheme").onclick = () => {
  document.documentElement.classList.toggle("light");
};
document.getElementById("btnLogout").onclick = async () => {
  await fetch("/logout");
  window.location.href = "/";
};
