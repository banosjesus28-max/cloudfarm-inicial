/* =======================================================
     CARGA DE DATOS
======================================================= */
async function cargarDatos() {
  const res = await fetch('/api/sensores');
  return await res.json();
}

/* =======================================================
     FUNCIONES DE ESTADÍSTICA
======================================================= */
const prom = arr => arr.reduce((a,b)=>a+b,0) / arr.length;
const tendencia = arr => arr[arr.length-1] - arr[0];
const min = arr => Math.min(...arr);
const max = arr => Math.max(...arr);

function formatearFecha(f) { return new Date(f).toLocaleString(); }

/* =======================================================
     ALERTAS
======================================================= */
function detectarAlertas(data) {
  const alertas = [];

  data.forEach((d, i) => {
    const n = i + 1;
    if (d.bpm > 120) alertas.push(`Registro ${n}: BPM muy alto (${d.bpm}).`);
    if (d.bpm < 50) alertas.push(`Registro ${n}: BPM muy bajo (${d.bpm}).`);
    if (d.spo2 < 92) alertas.push(`Registro ${n}: SpO₂ bajo (${d.spo2}).`);
    if (d.temp > 37.8) alertas.push(`Registro ${n}: Temperatura alta (${d.temp} °C).`);
    if (d.temp < 35) alertas.push(`Registro ${n}: Temperatura muy baja (${d.temp} °C).`);
    if (d.sats < 4) alertas.push(`Registro ${n}: Señal GPS baja (${d.sats}).`);
  });

  return alertas;
}

function mostrarAlertas(alertas) {
  const alertDiv = document.getElementById("alerts");
  const list = document.getElementById("alerts-list");

  if (alertas.length === 0) {
    alertDiv.style.display = "none";
    return;
  }

  alertDiv.style.display = "block";
  list.innerHTML = alertas.map(a => `<li>${a}</li>`).join("");
}

/* =======================================================
     PANEL DE ESTADÍSTICAS
======================================================= */
function mostrarEstadisticas({ bpm, spo2, temp, speed }) {
  const stats = [
    { nombre: "BPM", valor: bpm, color: "primary" },
    { nombre: "SpO₂", valor: spo2, color: "info" },
    { nombre: "Temperatura", valor: temp, color: "warning" },
    { nombre: "Velocidad", valor: speed, color: "success" }
  ];

  const html = stats.map(s => `
      <div class="col-md-6 col-xl-3 mb-3">
        <div class="card shadow-sm border-${s.color}">
          <div class="card-body">
            <h6 class="card-title fw-bold text-${s.color}">${s.nombre}</h6>
            <p class="card-text mb-1">
              <b>Promedio:</b> ${prom(s.valor).toFixed(2)}
            </p>
            <p class="card-text mb-1">
              <b>Mínimo:</b> ${min(s.valor)}
            </p>
            <p class="card-text mb-1">
              <b>Máximo:</b> ${max(s.valor)}
            </p>
            <p class="card-text">
              <b>Tendencia:</b> ${tendencia(s.valor).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
  `).join("");

  document.getElementById("stats-content").innerHTML = `
    <div class="row">
      ${html}
    </div>
  `;
}


/* =======================================================
     LÍNEA DE PROMEDIO CHART.JS
======================================================= */
function lineaPromedio(valor) {
  return {
    id: 'promLine',
    beforeDraw(chart) {
      const { ctx, chartArea, scales: { y } } = chart;
      const yPos = y.getPixelForValue(valor);

      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([5,5]);
      ctx.moveTo(chartArea.left, yPos);
      ctx.lineTo(chartArea.right, yPos);
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.stroke();
      ctx.restore();
    }
  };
}

/* =======================================================
     INICIO DEL DASHBOARD
======================================================= */
async function main() {
  const data = await cargarDatos();

  // Extraer columnas
  const labels = data.map(d => formatearFecha(d.created_at));
  const bpm   = data.map(d => d.bpm);
  const spo2  = data.map(d => d.spo2);
  const temp  = data.map(d => d.temp);
  const speed = data.map(d => d.speed);
  const sats  = data.map(d => d.sats);
  const coords = data.map(d => ({ x: d.lon, y: d.lat }));

  // Mostrar estadísticas
  mostrarEstadisticas({ bpm, spo2, temp, speed });

  // Detectar alertas
  const alertas = detectarAlertas(data);
  mostrarAlertas(alertas);

  // Helper para colorear puntos con alerta
  const colorAlertas = (arr, low, high) =>
    arr.map(v => (v < low || v > high ? "red" : "blue"));

  /* ==============================
        GRÁFICAS
  ============================== */
 new Chart(chartBpm, {
    type: 'line', // Línea para BPM
    data: { labels, datasets: [{
      label: 'BPM',
      data: bpm,
      borderColor: 'red',
      pointBackgroundColor: colorAlertas(bpm, 50, 120),
      tension: 0.3
    }]},
    plugins: [lineaPromedio(prom(bpm))]
});

new Chart(chartSpo2, {
    type: 'pie', // Cambiado a pastel
    data: { labels, datasets: [{
      label: 'SpO₂',
      data: spo2,
      backgroundColor: colorAlertas(spo2, 92, 200), // colores por porción
      borderColor: 'white',
      borderWidth: 1
    }]}
});

new Chart(chartTemp, {
    type: 'bar', // Cambiado a barras
    data: { labels, datasets: [{
      label: 'Temperatura (°C)',
      data: temp,
      backgroundColor: colorAlertas(temp, 35, 37.8)
    }]}
});

new Chart(chartSpeed, {
    type: 'line', // Mantiene línea
    data: { labels, datasets: [{
      label: 'Velocidad (m/s)',
      data: speed,
      borderColor: 'green',
      tension: 0.3
    }]},
    plugins: [lineaPromedio(prom(speed))]
});

new Chart(chartSats, {
    type: 'bar', // Mantiene barras
    data: { labels, datasets: [{
      label: 'Satélites',
      data: sats,
      backgroundColor: sats.map(s => s < 4 ? "red" : "purple")
    }]}
});

new Chart(chartCoords, {
    type: 'scatter', // Mantiene scatter
    data: { datasets: [{
      label: 'Coordenadas GPS',
      data: coords,
      pointRadius: 5,
      backgroundColor: 'brown'
    }]},
    options: {
      scales: {
        x: { title: { display: true, text: "Longitud" }},
        y: { title: { display: true, text: "Latitud" }}
      }
    }
});

}

main();