
document.addEventListener("DOMContentLoaded", () => {
  // ---- Auth Check First ----
  // AegisAuth.init() returns true if user already logged in, false if login screen shown
  const isAuthenticated = AegisAuth.init();

  if (isAuthenticated) {
    // Session already active — start the app directly
    AegisApp.init();
  } else {
    // Wait for the login/signup to succeed before starting the app
    document.addEventListener("aegisAuthSuccess", () => {
      AegisApp.init();
    }, { once: true });
  }
});

const AegisApp = (() => {
  let activeTab = "dashboard";
  let simTimer = null;
  let patrolTimer = null;
  
  // Tab Metadata for Header Updates
  const tabMetadata = {
    dashboard: {
      title: "Tactical Command Center",
      desc: "Real-time emergency dispatch updates & patrol operations"
    },
    map: {
      title: "Spatial Crime Analysis",
      desc: "Interactive geo-visualizations, AI density mapping & patrol tracks"
    },
    network: {
      title: "Criminal Link Analysis Network",
      desc: "Dossier correlation maps, suspect nodes & crime connectivity paths"
    },
    predictive: {
      title: "Predictive Analytics Forecasts",
      desc: "Machine learning crime trend forecasting & explainable what-if factors"
    },
    explorer: {
      title: "Unified Database Explorer",
      desc: "Central registry table with search, categories, and report ingestion tools"
    },
    chat: {
      title: "AI Investigator Copilot",
      desc: "Natural language query engine with contextual widgets & reasoning outputs"
    }
  };

  // --- Clock Simulator ---
  const startClock = () => {
    const clockEl = document.getElementById("system-clock");
    const updateTime = () => {
      const now = new Date();
      const hours   = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      clockEl.textContent = `${hours}:${minutes}:${seconds}`;
    };
    updateTime();
    setInterval(updateTime, 1000);
  };

  // --- Tab Switching Logic ---
  const initTabs = () => {
    const menuItems = document.querySelectorAll(".menu-item");
    const panels    = document.querySelectorAll(".tab-panel");
    const titleEl   = document.getElementById("current-tab-title");
    const descEl    = document.getElementById("current-tab-desc");

    menuItems.forEach(item => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const tab = item.getAttribute("data-tab");
        if (tab === activeTab) return;

        menuItems.forEach(mi => mi.classList.remove("active"));
        item.classList.add("active");

        panels.forEach(p => p.classList.remove("active"));
        const targetPanel = document.getElementById(`panel-${tab}`);
        if (targetPanel) targetPanel.classList.add("active");

        activeTab = tab;
        titleEl.textContent = tabMetadata[tab].title;
        descEl.textContent  = tabMetadata[tab].desc;

        triggerTabReentry(tab);
      });
    });
  };

  const triggerTabReentry = (tab) => {
    if (tab === "map") {
      AegisMap.invalidateSize();
    } else if (tab === "network") {
      AegisNetwork.fitGraph();
    } else if (tab === "predictive") {
      AegisPredictive.resizeCharts();
    }
  };

  // --- Real-time Simulated Patrol Movement ---
  const startPatrolSimulation = () => {
    const patrols = AegisDB.getPatrols();
    patrolTimer = setInterval(() => {
      patrols.forEach(patrol => {
        if (patrol.status === "Stationary") return;
        patrol.currentIdx = (patrol.currentIdx + 1) % patrol.coords.length;
        const newCoords = patrol.coords[patrol.currentIdx];
        document.dispatchEvent(new CustomEvent("patrolMoved", {
          detail: { id: patrol.id, coords: newCoords }
        }));
      });
    }, 4000);
  };

  // --- Real-time Live Alert Spawning Simulator ---
  const startAlertSimulation = () => {
    const alertTypes = [
      {
        type: "CCTV Intrusion Alarm",
        desc: "Motion sensors triggered in restricted warehouse parking lot, Sector D-8. Heat signature detected.",
        severity: "medium",
        coords: [37.7758, -122.4095]
      },
      {
        type: "911 Dispatch - Assault in Progress",
        desc: "Calls reporting physical altercation outside nightclub on 6th St. Sector B-12. Units dispatched.",
        severity: "high",
        coords: [37.7818, -122.4110]
      },
      {
        type: "License Plate Scanner Hit",
        desc: "Alert: Black Escalade (Plate: 99Z-A12) matching grand-theft auto report logged at sector C-4 camera CAM-01.",
        severity: "medium",
        coords: [37.7818, -122.4101]
      },
      {
        type: "Emergency Alert - Firearm Threat",
        desc: "Silent alarm activated at banking branch, Financial District Sector A-5. Tactical audio dispatch.",
        severity: "high",
        coords: [37.7925, -122.3995]
      }
    ];

    simTimer = setInterval(() => {
      if (Math.random() > 0.4) {
        const template    = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        const now         = new Date();
        const timeString  = now.toTimeString().split(' ')[0];
        
        const newAlert = {
          id:       "ALT-" + Math.floor(1000 + Math.random() * 9000),
          type:     template.type,
          time:     timeString,
          desc:     template.desc,
          severity: template.severity,
          coords:   template.coords,
          unread:   true
        };

        AegisDB.addAlert(newAlert);
        document.dispatchEvent(new CustomEvent("newAlertReceived", { detail: newAlert }));
        triggerNotificationToast(newAlert);
      }
    }, 25000);
  };

  // --- HTML Notification Toast Injector ---
  const triggerNotificationToast = (alert) => {
    const toast = document.createElement("div");
    toast.className = `metric-card border-left-${alert.severity === 'high' ? 'red' : 'amber'} shadow-panel toast-popup`;
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      max-width: 350px; animation: slideDown 0.3s forwards;
      background: var(--bg-panel-solid); border: 1px solid var(--border-color);
      backdrop-filter: blur(20px);
    `;
    
    toast.innerHTML = `
      <div class="card-icon text-${alert.severity === 'high' ? 'red' : 'amber'}"><i class="fa-solid fa-triangle-exclamation animate-pulse"></i></div>
      <div class="card-content">
        <span class="metric-label font-bold" style="color: var(--accent-red)">${alert.type}</span>
        <p class="text-secondary text-small" style="margin-top: 4px;">${alert.desc}</p>
        <span class="text-muted text-small orbitron" style="margin-top: 4px;">${alert.time}</span>
      </div>
    `;

    document.body.appendChild(toast);
    
    const sfx = document.getElementById("alert-sfx");
    if (sfx) {
      sfx.volume = 0.35;
      sfx.play().catch(() => {});
    }

    setTimeout(() => {
      toast.style.animation = "fadeIn 0.3s reverse forwards";
      setTimeout(() => toast.remove(), 300);
    }, 6000);
  };

  // --- Public Initialization ---
  return {
    init: () => {
      startClock();
      initTabs();
      
      // Initialize Modular Components
      AegisDashboard.init();
      AegisMap.init();
      AegisNetwork.init();
      AegisPredictive.init();
      AegisExplorer.init();
      AegisChat.init();
      
      // Start Simulation Drivers
      startPatrolSimulation();
      startAlertSimulation();

      // ---- Bind Logout Button ----
      const logoutBtn = document.getElementById("btn-logout");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
          if (confirm("Are you sure you want to end your secure session?")) {
            AegisAuth.logout();
          }
        });
      }
      
      console.log("AegisEye Core Engine Initialized.");
    }
  };
})();
