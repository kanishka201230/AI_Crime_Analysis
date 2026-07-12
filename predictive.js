
const AegisPredictive = (() => {
  let forecastChart = null;
  let shapChart = null;

  // Baseline data models
  let baseTrend = [12, 16, 14, 19, 26, 22, 15]; // standard crime levels per day Mon-Sun
  let currentForecast = [...baseTrend];

  let baseShap = [
    { x: "Historical Density", y: 4.8 },
    { x: "Patrol Deficit", y: 3.2 },
    { x: "Street Light Index", y: 2.1 },
    { x: "Weather Coefficient", y: -1.2 },
    { x: "Socio-Economic Index", y: 1.5 }
  ];

  // --- Initialize Charts & Bind Sliders ---
  const init = () => {
    initForecastChart();
    initShapChart();
    bindSimulationSliders();

    document.getElementById("btn-recalc-prediction").addEventListener("click", runPredictionRecalculation);
  };

  // --- 7-Day Line Chart ---
  const initForecastChart = () => {
    const options = {
      chart: {
        type: 'area',
        height: 250,
        toolbar: { show: false },
        background: 'transparent',
        foreColor: '#94A3B8'
      },
      colors: ['#00F0FF'],
      stroke: { curve: 'smooth', width: 3 },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [0, 95]
        }
      },
      grid: {
        borderColor: '#1E293B',
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } }
      },
      dataLabels: { enabled: false },
      series: [{
        name: "Forecasted Crimes",
        data: currentForecast
      }],
      xaxis: {
        categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        min: 0,
        max: 40,
        tickAmount: 4
      },
      tooltip: { theme: 'dark' }
    };

    forecastChart = new ApexCharts(document.getElementById("forecast-chart-canvas"), options);
    forecastChart.render();
  };

  // --- Horizontal Bar Chart for SHAP weights ---
  const initShapChart = () => {
    const options = {
      chart: {
        type: 'bar',
        height: 220,
        toolbar: { show: false },
        background: 'transparent',
        foreColor: '#94A3B8'
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '65%',
          distributed: true,
          borderRadius: 4
        }
      },
      colors: [
        '#EF4444', // historical (red)
        '#F59E0B', // patrol (amber)
        '#EF4444', // lighting (red)
        '#00F0FF', // weather negative (cyan)
        '#F59E0B'  // econ (amber)
      ],
      dataLabels: { enabled: false },
      grid: {
        borderColor: '#1E293B',
        strokeDashArray: 4
      },
      series: [{
        name: "SHAP Impact Value",
        data: baseShap
      }],
      xaxis: {
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      legend: { show: false },
      tooltip: { theme: 'dark' }
    };

    shapChart = new ApexCharts(document.getElementById("shap-chart-canvas"), options);
    shapChart.render();
  };

  // --- Bind slider values change listeners ---
  const bindSimulationSliders = () => {
    // 1. Patrol Slider
    const patrolSlider = document.getElementById("slider-sim-patrols");
    const patrolVal = document.getElementById("val-sim-patrols");
    patrolSlider.addEventListener("input", (e) => {
      patrolVal.textContent = `${e.target.value}x`;
      if (e.target.value > 1.2) {
        patrolVal.className = "text-emerald";
      } else if (e.target.value < 0.8) {
        patrolVal.className = "text-red";
      } else {
        patrolVal.className = "text-cyan";
      }
    });

    // 2. Weather Slider
    const weatherSlider = document.getElementById("slider-sim-weather");
    const weatherVal = document.getElementById("val-sim-weather");
    const weatherLabels = ["Dry", "Light Rain", "Heavy Rain"];
    const weatherClasses = ["text-amber", "text-cyan", "text-blue"];
    weatherSlider.addEventListener("input", (e) => {
      weatherVal.textContent = weatherLabels[e.target.value];
      weatherVal.className = weatherClasses[e.target.value];
    });

    // 3. Lighting Slider
    const lightingSlider = document.getElementById("slider-sim-lighting");
    const lightingVal = document.getElementById("val-sim-lighting");
    lightingSlider.addEventListener("input", (e) => {
      lightingVal.textContent = `${e.target.value}%`;
      if (e.target.value >= 80) {
        lightingVal.className = "text-emerald";
      } else if (e.target.value < 50) {
        lightingVal.className = "text-red";
      } else {
        lightingVal.className = "text-cyan";
      }
    });

    // 4. Economy Slider
    const econSlider = document.getElementById("slider-sim-economy");
    const econVal = document.getElementById("val-sim-economy");
    econSlider.addEventListener("input", (e) => {
      const val = parseInt(e.target.value);
      if (val < 7) {
        econVal.textContent = "Stable";
        econVal.className = "text-emerald";
      } else if (val <= 14) {
        econVal.textContent = "Normal";
        econVal.className = "text-cyan";
      } else {
        econVal.textContent = "Critical";
        econVal.className = "text-red";
      }
    });
  };

  // --- What-If Recalculation calculations ---
  const runPredictionRecalculation = () => {
    // Fetch slider values
    const patrolMult = parseFloat(document.getElementById("slider-sim-patrols").value);
    const weatherVal = parseInt(document.getElementById("slider-sim-weather").value);
    const lightingPct = parseInt(document.getElementById("slider-sim-lighting").value);
    const economyIdx = parseInt(document.getElementById("slider-sim-economy").value);

    // Calculate modification weights
    // High patrol multiplier reduces property/violent crime
    // Low lighting increases crime risk
    // Poor economy increases crime baseline
    // Rain reduces crime risk (dampens outdoor activity)
    
    let crimeModifier = 0;
    
    // Patrol factor (-10 to +10 change)
    const patrolFactor = (1.0 - patrolMult) * 14; 
    
    // Lighting factor (-5 to +5 change)
    const lightingFactor = (80 - lightingPct) * 0.15; 
    
    // Economy factor (-5 to +10 change)
    const econFactor = (economyIdx - 10) * 0.7; 
    
    // Weather factor (Dry = 0, Rain = -4, Storm = -8)
    const weatherFactor = weatherVal * -4;

    // Build new forecast series
    const newForecast = baseTrend.map(val => {
      let newVal = val + patrolFactor + lightingFactor + econFactor + weatherFactor;
      // Clamp to positive range
      newVal = Math.max(2, Math.round(newVal));
      return newVal;
    });

    // Update line chart series
    forecastChart.updateSeries([{
      name: "Forecasted Crimes",
      data: newForecast
    }], true);

    // Calculate new SHAP values
    const newPatrolShapVal = (3.2 * patrolMult * -1).toFixed(1);
    const newLightShapVal = (2.1 * (lightingPct / 80) * -1).toFixed(1);
    const newWeatherShapVal = (-1.2 + (weatherVal * -1.5)).toFixed(1);
    const newEconShapVal = (1.5 * (economyIdx / 10)).toFixed(1);

    const newShapDataset = [
      { x: "Historical Density", y: 4.8 },
      { x: "Patrol Deficit", y: parseFloat(newPatrolShapVal) },
      { x: "Street Light Index", y: parseFloat(newLightShapVal) },
      { x: "Weather Coefficient", y: parseFloat(newWeatherShapVal) },
      { x: "Socio-Economic Index", y: parseFloat(newEconShapVal) }
    ];

    // Update SHAP Bar Chart
    shapChart.updateSeries([{
      name: "SHAP Impact Value",
      data: newShapDataset
    }]);

    // Show simulation toast notification
    document.dispatchEvent(new CustomEvent("newAlertReceived", {
      detail: {
        id: "SIM-" + Math.floor(100 + Math.random() * 900),
        type: "Predictive Recalculation Complete",
        time: new Date().toTimeString().split(' ')[0],
        desc: `AI Projections recalculated using inputs: Patrol: ${patrolMult}x, Light: ${lightingPct}%, Economy Index: ${economyIdx}. Forecast shift recorded.`,
        severity: "low",
        unread: false
      }
    }));
  };

  // --- Public Interface ---
  return {
    init: init,
    resizeCharts: () => {
      if (forecastChart && shapChart) {
        setTimeout(() => {
          forecastChart.windowResizeHandler();
          shapChart.windowResizeHandler();
        }, 100);
      }
    }
  };
})();
