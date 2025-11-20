// Gráficas
const tempChart = new Chart(document.getElementById('tempChart'), {
    type: 'line', data: { labels: [], datasets: [{ label: "°C", data: [], borderColor: '#dc3545', fill: true, backgroundColor: 'rgba(220,53,69,0.1)' }] },
    options: { responsive: true, plugins: { legend: { display: false } } }
});

const pulsoChart = new Chart(document.getElementById('pulsoChart'), {
    type: 'line', data: { labels: [], datasets: [{ label: "BPM", data: [], borderColor: '#0d6efd', fill: true, backgroundColor: 'rgba(13,110,253,0.1)' }] },
    options: { responsive: true, plugins: { legend: { display: false } } }
});

const spo2Chart = new Chart(document.getElementById('spo2Chart'), {
    type: 'line', data: { labels: [], datasets: [{ label: "%", data: [], borderColor: '#17a2b8', fill: true, backgroundColor: 'rgba(23,162,184,0.1)' }] },
    options: { responsive: true, plugins: { legend: { display: false } } }
});

const speedChart = new Chart(document.getElementById('speedChart'), {
    type: 'line', data: { labels: [], datasets: [{ label: "m/s", data: [], borderColor: '#ffc107', fill: true, backgroundColor: 'rgba(255,193,7,0.1)' }] },
    options: { responsive: true, plugins: { legend: { display: false } } }
});

// Mapa
const map = L.map('map').setView([20.967, -89.623], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);

const vacaIcon = L.divIcon({ html: '<i class="fa-solid fa-cow fa-2x" style="color:brown;"></i>', className: '', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] });

let marker = L.marker([20.967, -89.623], { icon: vacaIcon }).addTo(map).bindPopup("Esperando datos...").openPopup();

// WebSocket
const socket = io();

socket.on('nuevos_datos', (data) => {
    const hora = new Date().toLocaleTimeString();

    // Actualizar métricas
    document.getElementById('valTemp').textContent = `${data.temperatura}°C`;
    document.getElementById('valPulso').textContent = `${data.pulso} BPM`;
    document.getElementById('valSpO2').textContent = `${data.spo2}%`;
    document.getElementById('valSpeed').textContent = `${data.speed} m/s`;
    document.getElementById('valSats').textContent = `${data.sats}`;
    document.getElementById('valAlt').textContent = `${data.gps.alt} m`;

    // Actualizar gráficas
    function updateChart(chart, value) {
    chart.data.labels.push(hora);
    chart.data.datasets[0].data.push(value);
    if (chart.data.labels.length > 10) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }
    chart.update();
    }

    updateChart(tempChart, data.temperatura);
    updateChart(pulsoChart, data.pulso);
    updateChart(spo2Chart, data.spo2);
    updateChart(speedChart, data.speed);

    // Actualizar mapa
    marker.setLatLng([data.gps.lat, data.gps.lng]);
    map.panTo([data.gps.lat, data.gps.lng]);
    marker.bindPopup(`📍 Nueva ubicación<br>Lat: ${data.gps.lat.toFixed(5)}<br>Lng: ${data.gps.lng.toFixed(5)}<br>Alt: ${data.gps.alt} m`).openPopup();
});