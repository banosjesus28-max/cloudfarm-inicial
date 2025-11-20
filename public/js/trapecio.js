// Función para obtener los datos desde tu API
async function obtenerDatos() {
    const response = await fetch('/api/calculo');
    const data = await response.json();
    return data;
}

async function crearGrafico() {
    const data = await obtenerDatos();

    // Sacar timestamps
    const labels = data.datos.map(d => d.timestamp);

    // Columnas que queremos graficar
    const columnas = Object.keys(data.auc); // ['bpm','spo2','temp','speed','alt','sats']

    // Crear datasets para Chart.js
    const colores = ['red','blue','green','orange','purple','brown']; // colores para cada columna
    const datasets = columnas.map((col, i) => ({
    label: col,
    data: data.datos.map(d => d[col]),
    borderColor: colores[i],
    backgroundColor: 'transparent',
    tension: 0.3 // suavizado de la curva
    }));

    const ctx = document.getElementById('sensorChart').getContext('2d');
    new Chart(ctx, {
    type: 'line',
    data: {
        labels: labels,
        datasets: datasets
    },
    options: {
        responsive: true,
        interaction: {
        mode: 'index',
        intersect: false
        },
        plugins: {
        title: {
            display: true,
            text: 'Distancia con respecto al tiempo'
        },
        tooltip: {
            mode: 'index',
            intersect: false
        }
        },
        scales: {
        x: {
            title: { display: true, text: 'Tiempo' }
        },
        y: {
            title: { display: true, text: 'Valores' }
        }
        }
    }
    });
}

crearGrafico();