
const AegisDashboard = (() => {
  let miniMap = null;
  let miniMapMarkers = [];

  // --- Render Metrics Statistics ---
  const updateMetrics = () => {
    const incidents = AegisDB.getIncidents();
    const patrols = AegisDB.getPatrols();
    const alerts = AegisDB.getAlertFeed();
    
    // Calculations
    const activeCrimes = incidents.filter(i => i.status !== "Closed").length;
    const closedCrimes = incidents.filter(i => i.status === "Closed").length;
    const totalCrimes = incidents.length;
    const clearanceRate = totalCrimes > 0 ? ((closedCrimes / totalCrimes) * 100).toFixed(1) : "0.0";
    
    const unreadAlerts = alerts.filter(a => a.unread).length;

    // Set DOM elements
    document.getElementById("stat-active-incidents").textContent = String(activeCrimes).padStart(2, '0');
    document.getElementById("stat-clearance-rate").textContent = `${clearanceRate}%`;
    document.getElementById("active-patrols-badge").textContent = patrols.length;
    document.getElementById("critical-alerts-badge").textContent = unreadAlerts;
  };

  // --- Render Live Alert Ticker Feed ---
  const renderAlertFeed = () => {
    const feedContainer = document.getElementById("live-alerts-feed");
    const alerts = AegisDB.getAlertFeed();
    
    feedContainer.innerHTML = "";
    
    if (alerts.length === 0) {
      feedContainer.innerHTML = `
        <div class="text-center py-lg text-secondary">
          <i class="fa-solid fa-bell-slash fa-2x opacity-40 mb-sm"></i>
          <p>No active alerts reported.</p>
        </div>
      `;
      return;
    }

    alerts.forEach(alert => {
      const alertItem = document.createElement("div");
      alertItem.className = `feed-alert-item ${alert.unread ? 'unread' : ''}`;
      
      let severityClass = "low";
      if (alert.severity === "high") severityClass = "high";
      else if (alert.severity === "medium") severityClass = "med";

      alertItem.innerHTML = `
        <div class="alert-severity-indicator ${severityClass}"></div>
        <div class="alert-body-content">
          <div class="alert-top-row">
            <span class="alert-type-title">${alert.type}</span>
            <span class="alert-time">${alert.time}</span>
          </div>
          <p class="alert-desc">${alert.desc}</p>
          <div class="alert-footer-meta">
            <span class="alert-loc"><i class="fa-solid fa-location-dot"></i> GPS Lock</span>
            <a href="#" class="alert-action-btn" data-id="${alert.id}">Tactical Fly-To &rarr;</a>
          </div>
        </div>
      `;

      // Bind Fly-to event click
      alertItem.querySelector(".alert-action-btn").addEventListener("click", (e) => {
        e.preventDefault();
        // Set coordinates and trigger map view transition
        const targetCoords = alert.coords;
        
        // Open map panel
        const mapMenuItem = document.querySelector('.menu-item[data-tab="map"]');
        if (mapMenuItem) {
          mapMenuItem.click();
          // Dispatch custom event for Map component to center
          setTimeout(() => {
            document.dispatchEvent(new CustomEvent("mapFlyToCoordinates", {
              detail: { coords: targetCoords, title: alert.type, desc: alert.desc }
            }));
          }, 400);
        }
        
        // Mark alert read
        alert.unread = false;
        AegisDB.markAlertsRead();
        updateMetrics();
        alertItem.classList.remove("unread");
      });

      feedContainer.appendChild(alertItem);
    });
  };

  // --- Initialize Mini Map Widget ---
  const initMiniMap = () => {
    // Center of metro city simulation
    const center = [37.7749, -122.4194]; 
    
    // Clean existing map instance
    if (miniMap !== null) {
      miniMap.remove();
    }
    
    miniMap = L.map("mini-map-container", {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false
    }).setView(center, 12);
    
    // Add dark themed map tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 20
    }).addTo(miniMap);

    // Plot simple red pulsing circles representing threat hotspots
    plotMiniHotspots();
  };

  const plotMiniHotspots = () => {
    // Clear existing
    miniMapMarkers.forEach(m => miniMap.removeLayer(m));
    miniMapMarkers = [];

    const incidents = AegisDB.getIncidents();
    
    incidents.forEach(inc => {
      let color = "#3B82F6"; // default blue
      if (inc.riskRating === "High") color = "#EF4444"; // red
      else if (inc.riskRating === "Medium") color = "#F59E0B"; // amber

      const marker = L.circleMarker(inc.location, {
        radius: 6,
        fillColor: color,
        color: "#FFF",
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.6
      }).addTo(miniMap);
      
      miniMapMarkers.push(marker);
    });
    
    // Add a glowing circular overlay representing AI predicted hotspot region
    const hotspotOverlay = L.circle([37.7845, -122.4145], {
      color: "red",
      fillColor: "#f03",
      fillOpacity: 0.15,
      radius: 600,
      stroke: false
    }).addTo(miniMap);
    
    miniMapMarkers.push(hotspotOverlay);
  };

  // --- Public Interface ---
  return {
    init: () => {
      updateMetrics();
      renderAlertFeed();
      initMiniMap();

      // Listen for incoming alerts dispatched in real-time
      document.addEventListener("newAlertReceived", (e) => {
        renderAlertFeed();
        updateMetrics();
        plotMiniHotspots(); // Re-render mini map circles
      });
      
      // Update stats if database changes (e.g. data ingestion)
      document.addEventListener("databaseUpdated", () => {
        updateMetrics();
        plotMiniHotspots();
      });
    }
  };
})();
