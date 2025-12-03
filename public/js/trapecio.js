// ---------------------------
// FETCH DE DATOS
// ---------------------------
async function fetchSensorData() {
  try {
    const res = await fetch('/api/sensores');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Error al obtener sensores:', err);
    return [
      { bpm: 80, temp: 36.5, spo2: 97, created_at: new Date().toISOString() },
      { bpm: 95, temp: 37.2, spo2: 96, created_at: new Date(Date.now() + 60000).toISOString() },
      { bpm: 120, temp: 38.0, spo2: 92, created_at: new Date(Date.now() + 120000).toISOString() }
    ];
  }
}

// ---------------------------
// FUNCIONES GENERALES
// ---------------------------
function calcularArea(values, timestamps) {
  const combined = values.map((v,i)=>({ val:v, ts: new Date(timestamps[i]).getTime()/1000 }));
  combined.sort((a,b)=>a.ts-b.ts);
  let area=0;
  for(let i=0;i<combined.length-1;i++){
    const dt = combined[i+1].ts - combined[i].ts;
    area += ((combined[i].val + combined[i+1].val)/2) * dt;
  }
  return area;
}

function promedioPonderado(values, timestamps) {
  const combined = values.map((v,i)=>({ val:v, ts: new Date(timestamps[i]).getTime()/1000 }));
  combined.sort((a,b)=>a.ts-b.ts);
  let total=0, tiempoTotal=0;
  for(let i=0;i<combined.length-1;i++){
    const dt = combined[i+1].ts - combined[i].ts;
    total += ((combined[i].val + combined[i+1].val)/2) * dt;
    tiempoTotal+=dt;
  }
  return tiempoTotal>0? total/tiempoTotal:0;
}

// ---------------------------
// RENDER PRINCIPAL
// ---------------------------
async function renderChart() {
  const data = await fetchSensorData();
  if(!data || data.length===0){
    document.getElementById('info').innerText='No hay datos para graficar';
    document.getElementById('interpretacion').innerText='';
    return;
  }

  const labels = data.map(d=>new Date(d.created_at).toLocaleTimeString());
  const bpmValues = data.map(d=>d.bpm);
  const tempValues = data.map(d=>d.temp);
  const spo2Values = data.map(d=>d.spo2);
  const timestamps = data.map(d=>d.created_at);

  // ---------------------------
  // BPM
  // ---------------------------
  function getBpmColor(bpm){ if(bpm<100) return 'rgba(0,200,0,0.4)'; if(bpm<140) return 'rgba(255,200,0,0.4)'; return 'rgba(255,0,0,0.4)'; }
  const areaBpm = calcularArea(bpmValues, timestamps);
  const alertaBpm = promedioPonderado(bpmValues,timestamps)<100?{texto:'Normal ✅',color:'green'}:promedioPonderado(bpmValues,timestamps)<140?{texto:'Estrés ⚠️',color:'orange'}:{texto:'Crítico ❌',color:'red'};
  const promedioBpm = bpmValues.reduce((a,b)=>a+b,0)/bpmValues.length;
  const minBpm = Math.min(...bpmValues);
  const maxBpm = Math.max(...bpmValues);

  // ---------------------------
  // TEMPERATURA
  // ---------------------------
  function getTempColor(temp){ if(temp<37) return 'rgba(0,200,0,0.4)'; if(temp<38.5) return 'rgba(255,200,0,0.4)'; return 'rgba(255,0,0,0.4)'; }
  const areaTemp = calcularArea(tempValues, timestamps);
  const promedioTemp = tempValues.reduce((a,b)=>a+b,0)/tempValues.length;
  const minTemp = Math.min(...tempValues);
  const maxTemp = Math.max(...tempValues);
  const alertaTemp = promedioTemp<37?{texto:'Normal ✅',color:'green'}:promedioTemp<38.5?{texto:'Leve ⚠️',color:'orange'}:{texto:'Fiebre ❌',color:'red'};

  // ---------------------------
  // SpO2
  // ---------------------------
  function getSpO2Color(spo2){ if(spo2>=95) return 'rgba(0,200,0,0.4)'; if(spo2>=90) return 'rgba(255,200,0,0.4)'; return 'rgba(255,0,0,0.4)'; }
  const areaSpO2 = calcularArea(spo2Values, timestamps);
  const promedioSpO2 = spo2Values.reduce((a,b)=>a+b,0)/spo2Values.length;
  const minSpO2 = Math.min(...spo2Values);
  const maxSpO2 = Math.max(...spo2Values);
  const alertaSpO2 = promedioSpO2>=95?{texto:'Normal ✅',color:'green'}:promedioSpO2>=90?{texto:'Leve ⚠️',color:'orange'}:{texto:'Crítico ❌',color:'red'};

  // ---------------------------
  // ACTUALIZAR INFO
  // ---------------------------
document.getElementById('info').innerHTML = `
  <div class="card shadow-sm">
    <div class="card-body">

      <h5 class="card-title mb-3">Resumen de Datos</h5>

      <div class="mb-3">
        <h6 class="text-primary">Frecuencia Cardíaca (BPM)</h6>
        <ul class="list-unstyled ms-2">
          <li><strong>Área:</strong> ${areaBpm.toFixed(1)}</li>
          <li><strong>Estado:</strong> <span style="color:${alertaBpm.color}">${alertaBpm.texto}</span></li>
          <li><strong>Promedio:</strong> ${promedioBpm.toFixed(1)}</li>
          <li><strong>Mínimo:</strong> ${minBpm}</li>
          <li><strong>Máximo:</strong> ${maxBpm}</li>
        </ul>
      </div>

      <hr>

      <div class="mb-3">
        <h6 class="text-primary">Temperatura</h6>
        <ul class="list-unstyled ms-2">
          <li><strong>Área:</strong> ${areaTemp.toFixed(1)}</li>
          <li><strong>Promedio:</strong> ${promedioTemp.toFixed(1)}°C 
            <span style="color:${alertaTemp.color}">(${alertaTemp.texto})</span>
          </li>
          <li><strong>Mínimo:</strong> ${minTemp.toFixed(1)}°C</li>
          <li><strong>Máximo:</strong> ${maxTemp.toFixed(1)}°C</li>
        </ul>
      </div>

      <hr>

      <div>
        <h6 class="text-primary">Oxigenación (SpO₂)</h6>
        <ul class="list-unstyled ms-2">
          <li><strong>Área:</strong> ${areaSpO2.toFixed(1)}</li>
          <li><strong>Promedio:</strong> ${promedioSpO2.toFixed(1)}% 
            <span style="color:${alertaSpO2.color}">(${alertaSpO2.texto})</span>
          </li>
          <li><strong>Mínimo:</strong> ${minSpO2}%</li>
          <li><strong>Máximo:</strong> ${maxSpO2}%</li>
        </ul>
      </div>

    </div>
  </div>
`;

  // ---------------------------
  // GRAFICAS
  // ---------------------------
  const chartOptions = (values, colors, title, min, max)=>{
    return {
      title: { text: title, left: 'center' },
      tooltip: { trigger: 'axis' },
      xAxis: { type:'category', data: labels, axisLabel:{ interval: Math.floor(labels.length/10), rotate:45 } },
      yAxis: { type:'value', min:min, max:max },
      dataZoom: [ { type:'slider', start:0, end:50 }, { type:'inside', start:0, end:50 } ],
      series: [ { type:'line', data:values, smooth:true, lineStyle:{width:2}, areaStyle:{ color:{ type:'linear', x:0,y:0,x2:0,y2:1, colorStops: colors.map((c,i)=>({offset:i/(values.length-1), color:c})) } } } ]
    };
  };

  echarts.init(document.getElementById('chartBpm')).setOption(chartOptions(bpmValues, bpmValues.map(getBpmColor),'BPM',0, Math.max(...bpmValues)+10));
  echarts.init(document.getElementById('chartTemp')).setOption(chartOptions(tempValues, tempValues.map(getTempColor),'Temperatura (°C)',35,42));
  echarts.init(document.getElementById('chartSpO2')).setOption(chartOptions(spo2Values, spo2Values.map(getSpO2Color),'SpO2 (%)',80,100));
}

// ---------------------------
// INICIALIZAR Y REFRESCAR
// ---------------------------
renderChart();
setInterval(renderChart,5000);
