// Variables globales para los gráficos
let chartBPm, chartTeMp, chartSpO2;

// Obtener datos desde la API
async function obtenerDatos() {
  const resp = await fetch('/api/sensores');
  const datos = await resp.json();
  return datos.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

// Calcular AUC entre dos puntos
function calcularAUCentre(datos, field, index1, index2) {
  let auc = 0;
  const start = Math.min(index1, index2);
  const end = Math.max(index1, index2);
  for (let i = start + 1; i <= end; i++) {
    const x0 = new Date(datos[i - 1].created_at).getTime() / 1000;
    const x1 = new Date(datos[i].created_at).getTime() / 1000;
    const y0 = datos[i - 1][field];
    const y1 = datos[i][field];
    auc += ((y0 + y1) / 2) * (x1 - x0);
  }
  return auc;
}

// Crear dataset para el área seleccionada
function crearDatasetAreaEntre(datos, field, index1, index2) {
  const start = Math.min(index1, index2);
  const end = Math.max(index1, index2);
  return datos.map((d, i) => (i >= start && i <= end ? d[field] : null));
}

// Función para crear o actualizar un gráfico
function crearOActualizarGrafico(chartRef, id, datos, field, color, labelY) {
  const labels = datos.map(d => new Date(d.created_at).toLocaleTimeString());
  let selectedPoints = [];
  let aucValue = null;

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: field.toUpperCase(),
        data: datos.map(d => d[field]),
        fill: true,
        borderColor: color,
        backgroundColor: color.replace('1)', '0.2)'),
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6
      },
      {
        label: 'Área seleccionada',
        data: new Array(datos.length).fill(null),
        fill: true,
        backgroundColor: 'rgba(0,255,0,0.3)',
        borderColor: 'rgba(0,0,0,0)',
        tension: 0.4,
        pointRadius: 0
      },
      {
        label: 'Puntos seleccionados',
        data: new Array(datos.length).fill(null),
        type: 'scatter',
        pointBackgroundColor: 'red',
        pointBorderColor: 'darkred',
        pointRadius: 0,
        pointHoverRadius: 8,
        showLine: false
      }
    ]
  };

  // Plugin para mostrar AUC
  const aucPlugin = {
    id: 'aucPlugin_' + id,
    afterDraw(chart) {
      if (selectedPoints.length === 2 && aucValue !== null) {
        const ctx = chart.ctx;
        ctx.save();
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = 'green';
        ctx.textAlign = 'center';
        const xPix =
          (chart.scales.x.getPixelForValue(selectedPoints[0]) +
            chart.scales.x.getPixelForValue(selectedPoints[1])) /
          2;
        const yPix = chart.scales.y.getPixelForValue(
          Math.max(...datos.map(d => d[field])) / 2
        );
        ctx.fillText(`Area = ${aucValue.toFixed(2)}`, xPix, yPix);
        ctx.restore();
      }
    }
  };

  const config = {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      interaction: { mode: 'nearest', intersect: true },
      scales: {
        x: { display: true, title: { display: true, text: 'Tiempo' } },
        y: { display: true, title: { display: true, text: labelY } }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              const index = context.dataIndex;
              const valor = context.dataset.data[index];
              return `${context.dataset.label}: ${valor}`;
            }
          }
        }
      },
      onClick: (evt, chartElements, chart) => {
        if (!chartElements.length) return;
        const index = chartElements[0].index;

        // Reiniciar si ya había dos puntos
        if (selectedPoints.length === 2) {
          selectedPoints = [];
          aucValue = null;
          chart.data.datasets[1].data = new Array(datos.length).fill(null);
          chart.data.datasets[2].data = new Array(datos.length).fill(null);
          chart.update('active');
        }

        selectedPoints.push(index);

        if (selectedPoints.length === 2) {
          aucValue = calcularAUCentre(datos, field, selectedPoints[0], selectedPoints[1]);
          chart.data.datasets[1].data = crearDatasetAreaEntre(datos, field, selectedPoints[0], selectedPoints[1]);

          const puntos = new Array(datos.length).fill(null);
          puntos[selectedPoints[0]] = datos[selectedPoints[0]][field];
          puntos[selectedPoints[1]] = datos[selectedPoints[1]][field];
          chart.data.datasets[2].data = puntos;

          chart.update('active');
        }
      }
    },
    plugins: [aucPlugin]
  };

  const ctx = document.getElementById(id).getContext('2d');

  if (!chartRef.value) {
    chartRef.value = new Chart(ctx, config);
  } else {
    // Actualizar datos manteniendo interacciones
    chartRef.value.data.labels = labels;
    chartRef.value.data.datasets[0].data = datos.map(d => d[field]);
    chartRef.value.update();
  }
}

// Función principal
async function main() {
  const datos = await obtenerDatos();
  if (!datos.length) return;

  crearOActualizarGrafico({ value: chartBPm }, 'chartBPm', datos, 'bpm', 'rgba(0,0,255,1)', 'Pulso (BPM)');
  crearOActualizarGrafico({ value: chartTeMp }, 'chartTeMp', datos, 'temp', 'rgba(255,165,0,1)', 'Temperatura (°C)');
  crearOActualizarGrafico({ value: chartSpO2 }, 'chartSpO2', datos, 'spo2', 'rgba(0,128,0,1)', 'Oxigenación (SpO₂)');
}

// Primera ejecución
main();

// Actualización automática cada 30 segundos
setInterval(main, 1000);
