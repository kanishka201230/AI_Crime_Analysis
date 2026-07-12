
const AegisMap = (() => {
  let map = null;
  let layers = {
    incidents: L.layerGroup(),
    hotspots: L.layerGroup(),
    patrols: L.layerGroup(),
    cameras: L.layerGroup()
  };
  
  let patrolMarkers = {}; // stores references to patrol markers by ID
  let selectedCategory = "all";

  // Hotspot Zones Definition with feature SHAP values
  const hotspotZones = [
    {
      id: "HZ-01",
      name: "Sector B-12 (Downtown Core)",
      center: [37.7845, -122.4145],
      radius: 500,
      color: "#EF4444", // High Risk (Red)
      risk: "91% Risk Index",
      features: [
        { label: "Historical Incident Density", weight: 46, color: "bg-red" },
        { label: "Deficient Street Lighting Index", weight: 24, color: "bg-amber" },
        { label: "Patrol Absence Interval", weight: 20, color: "bg-cyan" },
        { label: "Weekend Event Crowd Factor", weight: 10, color: "bg-blue" }
      ],
      rational: "High concentration of luxury retailers, combined with a gap in patrol schedules during shift changes (21:00 - 23:00) and low-lumen lighting scores in alleys."
    },
    {
      id: "HZ-02",
      name: "Sector E-14 (Mission District)",
      center: [37.7610, -122.4215],
      radius: 600,
      color: "#F59E0B", // Medium Risk (Amber)
      risk: "74% Risk Index",
      features: [
        { label: "Liquor Establishment Density", weight: 40, color: "bg-amber" },
        { label: "Historical Assault Rates", weight: 35, color: "bg-red" },
        { label: "Patrol Coverage Deficit", weight: 15, color: "bg-cyan" },
        { label: "Current Precipitation Metric", weight: 10, color: "bg-blue" }
      ],
      rational: "Predicted peak in violent disturbance risks. Correlated with high concentration of liquor licenses and historical weekend evening assault clusters."
    },
    {
      id: "HZ-03",
      name: "Sector D-8 (SOMA)",
      center: [37.7760, -122.4080],
      radius: 550,
      color: "#3B82F6", // Low-Medium Risk (Blue)
      risk: "58% Risk Index",
      features: [
        { label: "Auto-Theft Density Index", weight: 50, color: "bg-cyan" },
        { label: "Municipal Cam Blind Spot", weight: 25, color: "bg-amber" },
        { label: "Patrol Patrol Spacing", weight: 15, color: "bg-blue" },
        { label: "Economic Hardship Index", weight: 10, color: "bg-red" }
      ],
      rational: "Elevated risk of grand theft auto in unmonitored parking structures. Strong correlation with poor video surveillance camera coverage."
    }
  ];

  // --- Initialize Map Engine ---
  const init = () => {
    const defaultCenter = [37.7749, -122.4194]; // Metro City Core
    
    map = L.map("main-map-canvas", {
      zoomControl: true,
      attributionControl: true
    }).setView(defaultCenter, 13);

    // Dark-themed tiles from CartoDB Dark Matter
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 20,
      attribution: '&copy; <a href="https://carto.com/attributions">CartoDB</a>'
    }).addTo(map);

    // Add Layer Groups to Map
    Object.values(layers).forEach(layer => layer.addTo(map));

    // Initial plotting
    plotIncidents();
    plotHotspots();
    plotPatrols();
    plotCameras();

    // Bind UI controls
    bindControls();

    // Register event listeners
    registerEvents();
  };

  // --- Bind Checkboxes & Select Filters ---
  const bindControls = () => {
    // Checkbox Layer toggles
    document.getElementById("layer-incidents").addEventListener("change", (e) => {
      toggleLayer("incidents", e.target.checked);
    });
    document.getElementById("layer-hotspots").addEventListener("change", (e) => {
      toggleLayer("hotspots", e.target.checked);
    });
    document.getElementById("layer-patrols").addEventListener("change", (e) => {
      toggleLayer("patrols", e.target.checked);
    });
    document.getElementById("layer-cameras").addEventListener("change", (e) => {
      toggleLayer("cameras", e.target.checked);
    });

    // Category Selector
    document.getElementById("map-category-filter").addEventListener("change", (e) => {
      selectedCategory = e.target.value;
      plotIncidents();
    });
  };

  const toggleLayer = (layerName, isChecked) => {
    if (isChecked) {
      map.addLayer(layers[layerName]);
    } else {
      map.removeLayer(layers[layerName]);
    }
  };

  // --- Plot Crime Incident Pins ---
  const plotIncidents = () => {
    layers.incidents.clearLayers();
    const incidents = AegisDB.getIncidents();

    incidents.forEach(inc => {
      // Category classification filtering
      if (selectedCategory !== "all" && inc.category !== selectedCategory) return;

      let colorClass = "bg-blue";
      let iconHTML = '<i class="fa-solid fa-circle-question"></i>';

      if (inc.category === "violent") {
        colorClass = "bg-red";
        iconHTML = '<i class="fa-solid fa-skull-crossbones"></i>';
      } else if (inc.category === "property") {
        colorClass = "bg-amber";
        iconHTML = '<i class="fa-solid fa-house-crack"></i>';
      } else if (inc.category === "narcotics") {
        colorClass = "bg-cyan";
        iconHTML = '<i class="fa-solid fa-capsules"></i>';
      } else if (inc.category === "cyber") {
        colorClass = "bg-purple";
        iconHTML = '<i class="fa-solid fa-laptop-code"></i>';
      }

      // Create Custom HTML Marker Icon
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div class="crime-marker-div ${colorClass}" style="box-shadow: 0 0 10px ${getColorHex(inc.category)}">${iconHTML}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      // Prepare Popup details
      const popupContent = `
        <div class="map-popup-card">
          <div class="map-popup-title text-${colorClass.split('-')[1]}">${inc.title}</div>
          <div class="map-popup-detail"><strong>Case ID:</strong> ${inc.id}</div>
          <div class="map-popup-detail"><strong>Status:</strong> ${inc.status}</div>
          <div class="map-popup-detail"><strong>Details:</strong> ${inc.description}</div>
          <div class="map-popup-xai-tag"><i class="fa-solid fa-brain"></i> AI Verified Hotspot</div>
        </div>
      `;

      L.marker(inc.location, { icon: customIcon })
        .bindPopup(popupContent)
        .addTo(layers.incidents);
    });
  };

  const getColorHex = (category) => {
    switch (category) {
      case "violent": return "#EF4444";
      case "property": return "#F59E0B";
      case "narcotics": return "#00F0FF";
      case "cyber": return "#A855F7";
      default: return "#3B82F6";
    }
  };

  // --- Plot Large Predicted Hotspots circles ---
  const plotHotspots = () => {
    layers.hotspots.clearLayers();

    hotspotZones.forEach(zone => {
      const circle = L.circle(zone.center, {
        radius: zone.radius,
        color: zone.color,
        fillColor: zone.color,
        fillOpacity: 0.15,
        weight: 1,
        dashArray: "4, 4"
      }).addTo(layers.hotspots);

      // Tooltip label
      circle.bindTooltip(`${zone.name} <br/> <strong>${zone.risk}</strong>`, {
        permanent: false,
        direction: 'top',
        className: 'panel-glass text-cyan text-small border-color'
      });

      // Map Click event triggers Sidebar SHAP breakdown details
      circle.on("click", () => {
        showXAIExplanation(zone);
      });
    });
  };

  // --- Show Hotspot Explainable AI features ---
  const showXAIExplanation = (zone) => {
    document.getElementById("map-xai-card").querySelector(".italic").style.display = "none";
    
    const contentEl = document.getElementById("map-xai-content");
    contentEl.style.display = "block";
    
    document.getElementById("map-xai-zone").textContent = zone.name;
    document.getElementById("map-xai-zone").className = `font-semibold mb-sm orbitron`;
    document.getElementById("map-xai-zone").style.color = zone.color;
    
    const barsContainer = document.getElementById("map-xai-bars");
    barsContainer.innerHTML = `
      <div class="xai-header" style="color: ${zone.color}">
        <i class="fa-solid fa-shield-halved"></i>
        <span>AI Risk Level: ${zone.risk}</span>
      </div>
      <p class="xai-text mb-sm" style="font-size:11px">${zone.rational}</p>
    `;

    zone.features.forEach(feat => {
      const barItem = document.createElement("div");
      barItem.className = "feature-bar-item";
      barItem.innerHTML = `
        <div class="bar-info"><span>${feat.label}</span><span>${feat.weight}%</span></div>
        <div class="bar-track"><div class="bar-fill ${feat.color}" style="width: ${feat.weight}%; background-color:${zone.color}"></div></div>
      `;
      barsContainer.appendChild(barItem);
    });
  };

  // --- Plot Patrol Vehicles ---
  const plotPatrols = () => {
    layers.patrols.clearLayers();
    patrolMarkers = {};
    const patrols = AegisDB.getPatrols();

    patrols.forEach(patrol => {
      const startCoords = patrol.coords[patrol.currentIdx];
      
      const customIcon = L.divIcon({
        className: 'custom-patrol-marker',
        html: `<div class="patrol-marker-div" style="background-color: ${patrol.color}"><i class="fa-solid fa-car-side"></i> ${patrol.id}</div>`,
        iconSize: [44, 20],
        iconAnchor: [22, 10]
      });

      const marker = L.marker(startCoords, { icon: customIcon })
        .bindPopup(`<strong>Patrol Unit:</strong> ${patrol.id}<br/><strong>Officer:</strong> ${patrol.officer}<br/><strong>Status:</strong> ${patrol.status}`)
        .addTo(layers.patrols);
      
      patrolMarkers[patrol.id] = marker;
    });
  };

  // --- Plot CCTV Cameras ---
  const plotCameras = () => {
    layers.cameras.clearLayers();
    const cameras = AegisDB.getCCTV();

    cameras.forEach(cam => {
      let color = "var(--accent-blue)";
      let pulseClass = "";
      if (cam.status === "Alerting") {
        color = "var(--accent-red)";
        pulseClass = "animate-pulse";
      } else if (cam.status === "Offline") {
        color = "var(--text-muted)";
      }

      const customIcon = L.divIcon({
        className: 'custom-camera-marker',
        html: `<div class="${pulseClass}" style="color:${color}; font-size:18px; text-shadow: 0 0 5px rgba(0,0,0,0.8);"><i class="fa-solid fa-video"></i></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const popupContent = `
        <div class="map-popup-card text-center" style="min-width: 180px;">
          <div class="map-popup-title" style="color:${color}">${cam.name} (${cam.id})</div>
          <div class="map-popup-detail">Status: <strong>${cam.status}</strong></div>
          <div class="cctv-mock-feed mt-sm" style="height:100px; background:#000; border:1px solid var(--border-color); display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;">
            ${cam.status === 'Offline' ? '<span class="text-muted text-small font-bold">FEED OFFLINE</span>' : `
              <div class="radar-sweep" style="position:absolute; top:0; left:0; width:100%; height:100%; background: linear-gradient(180deg, rgba(0,240,255,0.05) 0%, rgba(0,240,255,0) 100%); animation: slideDown 2s infinite linear;"></div>
              <span class="text-emerald text-small font-bold orbitron animate-pulse"><i class="fa-solid fa-circle"></i> LIVE SCANNING</span>
            `}
          </div>
        </div>
      `;

      L.marker(cam.coords, { icon: customIcon })
        .bindPopup(popupContent)
        .addTo(layers.cameras);
    });
  };

  // --- Listen to events for cross-tab notifications ---
  const registerEvents = () => {
    // 1. Patrol vehicle position moved in background
    document.addEventListener("patrolMoved", (e) => {
      const { id, coords } = e.detail;
      const marker = patrolMarkers[id];
      if (marker) {
        marker.setLatLng(coords);
      }
    });

    // 2. Alert Fly-To Teleport trigger
    document.addEventListener("mapFlyToCoordinates", (e) => {
      const { coords, title, desc } = e.detail;
      
      map.flyTo(coords, 16, {
        animate: true,
        duration: 1.5
      });

      // Spawn temporary glow indicator circle on map
      const beacon = L.circle(coords, {
        radius: 80,
        color: "cyan",
        fillColor: "#00F0FF",
        fillOpacity: 0.4,
        weight: 2
      }).addTo(map);

      // Pulse beacon out of existence
      let radius = 80;
      let opacity = 0.4;
      const pulseInterval = setInterval(() => {
        radius += 10;
        opacity -= 0.04;
        beacon.setRadius(radius);
        beacon.setStyle({ fillOpacity: opacity, opacity: opacity });
        
        if (opacity <= 0) {
          clearInterval(pulseInterval);
          map.removeLayer(beacon);
        }
      }, 50);

      // Open a custom popup at coordinates
      setTimeout(() => {
        L.popup()
          .setLatLng(coords)
          .setContent(`
            <div class="map-popup-card">
              <div class="map-popup-title text-cyan"><i class="fa-solid fa-bullseye"></i> Dispatch Alert</div>
              <div class="map-popup-detail"><strong>Source:</strong> ${title}</div>
              <div class="map-popup-detail">${desc}</div>
            </div>
          `)
          .openOn(map);
      }, 1500);
    });

    // 3. Database updated (data ingested)
    document.addEventListener("databaseUpdated", () => {
      plotIncidents();
    });
  };

  // --- Public Interface ---
  return {
    init: init,
    invalidateSize: () => {
      if (map) {
        setTimeout(() => map.invalidateSize(), 100);
      }
    }
  };
})();
