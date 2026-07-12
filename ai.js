
const AegisChat = (() => {
  let messageCount = 0;

  // --- Initialize Chat Listeners ---
  const init = () => {
    const inputField = document.getElementById("chat-input-field");
    const sendBtn = document.getElementById("btn-send-chat");

    // Click trigger send
    sendBtn.addEventListener("click", () => {
      handleUserSubmit(inputField.value);
      inputField.value = "";
    });

    // Enter key trigger send
    inputField.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        handleUserSubmit(inputField.value);
        inputField.value = "";
      }
    });

    // Bind Suggested Query chips
    const suggestions = document.querySelectorAll(".suggestion-chip");
    suggestions.forEach(chip => {
      chip.addEventListener("click", () => {
        const queryText = chip.getAttribute("data-query");
        handleUserSubmit(queryText);
      });
    });
  };

  // --- Append Message to Logs ---
  const appendMessage = (sender, contentHTML) => {
    const container = document.getElementById("chat-messages");
    const msg = document.createElement("div");
    msg.className = `chat-message ${sender}`;
    
    const iconClass = sender === "bot" ? "fa-robot" : "fa-user-nurse";
    
    msg.innerHTML = `
      <div class="message-avatar"><i class="fa-solid ${iconClass}"></i></div>
      <div class="message-bubble">${contentHTML}</div>
    `;

    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    messageCount++;
    return msg;
  };

  // --- Process User Queries ---
  const handleUserSubmit = (queryText) => {
    if (!queryText.trim()) return;

    // 1. Post user message
    appendMessage("user", `<p>${queryText}</p>`);

    // 2. Generate simulated AI thinking loading state
    const loadingMsg = appendMessage("bot", `
      <p class="text-secondary italic"><i class="fa-solid fa-arrows-spin animate-pulse"></i> Analyzing databases and compiling correlations...</p>
    `);

    // 3. Parse NLP rules after small lag
    setTimeout(() => {
      loadingMsg.remove();
      processNLPQuery(queryText.toLowerCase());
    }, 900);
  };

  // --- Mock NLP Router Engine ---
  const processNLPQuery = (query) => {
    const suspects = AegisDB.getSuspects();
    const incidents = AegisDB.getIncidents();
    const vehicles = AegisDB.getVehicles();

    let replyHTML = "";
    let traceLog = [];
    
    // CASE 1: Burglaries in Downtown Core
    if (query.includes("burglar") && (query.includes("downtown") || query.includes("b-12"))) {
      const matches = incidents.filter(i => i.category === "property" && i.sector.toLowerCase().includes("downtown"));
      traceLog = [
        "Identified Category token: [property / burglary]",
        "Identified Location token: [downtown / sector B-12]",
        "Database scan: Querying incidents table...",
        `Result: Found ${matches.length} matching incident records.`
      ];

      replyHTML = `
        <p>I have scanned the crime database for property burglary events near Downtown Core. Found <strong>${matches.length}</strong> matching case record.</p>
        
        <div class="chat-embed-widget">
          <div class="chat-embed-header">
            <span>Query Results: Burglaries</span>
            <span class="text-emerald font-bold orbitron">200 OK</span>
          </div>
          <div class="chat-embed-body">
            <table class="chat-embed-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Incident</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${matches.map(m => `
                  <tr>
                    <td><a href="#" class="text-cyan font-bold text-small" onclick="AegisChat.flyToIncident('${m.id}')">${m.id}</a></td>
                    <td>${m.title}</td>
                    <td>${m.sector.split(' ')[0]}</td>
                    <td>${m.status}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <p class="text-secondary text-small mt-sm">Click the Case ID links to locate the incident on the tactical map.</p>
      `;
    }
    
    // CASE 2: Connections and Associations of John Doe
    else if (query.includes("john") || query.includes("trigger") || query.includes("doe")) {
      const joe = suspects.find(s => s.id === "SP-1082");
      traceLog = [
        "Identified Suspect token: [John Doe / Trigger]",
        "Target Database: criminal_registry, network_edges",
        "Influence Centrality Calculation: Eigenvector score 88%",
        "Recidivism estimation rating: 92% risk quotient"
      ];

      replyHTML = `
        <p>Displaying criminal dossier intelligence for <strong>John 'Trigger' Doe</strong> (ID: SP-1082). Threat Level: <span class="text-red font-bold">CRITICAL</span>.</p>
        <p class="text-secondary italic">${joe.bio}</p>
        
        <div class="chat-embed-widget">
          <div class="chat-embed-header">
            <span>Direct Associates Linkages</span>
            <span class="text-cyan font-bold orbitron">Degree = 1</span>
          </div>
          <div class="chat-embed-body flex-column gap-xs">
            <div class="flex-row justify-between text-small border-bottom pb-xs">
              <strong>Marcus 'Slick' Vance</strong>
              <span class="text-cyan font-bold">Accomplice (Drug Ring Link)</span>
            </div>
            <div class="flex-row justify-between text-small border-bottom pb-xs mt-xs">
              <strong>Victor 'Dax' Vance</strong>
              <span class="text-cyan font-bold">Accomplice (Vehicle Heist Link)</span>
            </div>
            <div class="flex-row justify-between text-small pb-xs mt-xs">
              <strong>Ford Fusion (49X-Y33)</strong>
              <span class="text-blue font-bold">Operator (Associated Getaway Vehicle)</span>
            </div>
          </div>
        </div>
        
        <button class="btn btn-primary w-100 mt-sm" onclick="AegisChat.highlightNetworkNode('SP-1082')">
          <i class="fa-solid fa-circle-nodes"></i> Focus John Doe in Network Canvas
        </button>
      `;
    }

    // CASE 3: Forecast Crime Trend Next Week
    else if (query.includes("forecast") || query.includes("trend") || query.includes("projection")) {
      traceLog = [
        "Identified Predictive Command: [forecast, trend]",
        "Loaded Model: LSTM Time-Series Forecaster",
        "Input Variables: 30-day historical density, weekend multipliers, rain forecast index",
        "Prediction Output: 7-day cyclical incidents forecast (Mean Absolute Error = 4.2%)"
      ];

      const chartId = `chat-chart-${Date.now()}`;

      replyHTML = `
        <p>Analyzing time-series variables. The 7-day model predicts a crime incidence peak on <strong>Friday evening</strong> (approx. 22:00-02:00) due to high local congregation rates and simulated dry weather factors.</p>
        
        <div class="chat-embed-widget">
          <div class="chat-embed-header">
            <span>AI 7-Day Time-Series Forecasting</span>
            <span class="text-amber font-bold orbitron">LSTM PROJECTION</span>
          </div>
          <div class="chat-embed-body">
            <div id="${chartId}" style="height: 180px;"></div>
          </div>
        </div>
      `;

      // Render chart async after widget loads
      setTimeout(() => {
        const chartEl = document.getElementById(chartId);
        if (chartEl) {
          const chart = new ApexCharts(chartEl, {
            chart: { type: 'line', height: 160, toolbar: { show: false }, background: 'transparent', foreColor: '#94A3B8' },
            colors: ['#00F0FF'],
            series: [{ name: 'Predicted Crimes', data: [8, 12, 10, 14, 18, 15, 9] }],
            xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
            stroke: { curve: 'smooth', width: 3 },
            grid: { borderColor: '#1F293D' }
          });
          chart.render();
        }
      }, 200);
    }

    // CASE 4: Hotspot Risk Factors for Zone B-12
    else if (query.includes("factor") || query.includes("why") || query.includes("b-12") || query.includes("hotspot")) {
      traceLog = [
        "Identified Explainable AI Request: [hotspot analysis, factor weights]",
        "Activated Local LIME / SHAP Explainer Engine",
        "Target Area: Sector B-12 (Downtown)",
        "Calculated Local Parameters: Density = +46%, Lights = +24%, Patrol spacing = +20%"
      ];

      replyHTML = `
        <p>Explaining AI Risk Score contribution weights for <strong>Sector B-12</strong>. Proximity to historical burglaries is the most significant driver raising the risk level to High.</p>
        
        <div class="chat-embed-widget">
          <div class="chat-embed-header">
            <span>Local SHAP Weight Contributions</span>
            <span class="text-cyan font-bold orbitron">XAI MODEL RATIONALE</span>
          </div>
          <div class="chat-embed-body flex-column gap-sm">
            <div class="feature-bar-item">
              <div class="bar-info"><span>Historical Commercial Burglaries (+46%)</span></div>
              <div class="bar-track"><div class="bar-fill bg-red" style="width: 46%;"></div></div>
            </div>
            <div class="feature-bar-item">
              <div class="bar-info"><span>Street Lighting Deficit (+24%)</span></div>
              <div class="bar-track"><div class="bar-fill bg-amber" style="width: 24%;"></div></div>
            </div>
            <div class="feature-bar-item">
              <div class="bar-info"><span>Patrol Gap Duration (+20%)</span></div>
              <div class="bar-track"><div class="bar-fill bg-cyan" style="width: 20%;"></div></div>
            </div>
          </div>
        </div>
      `;
    }

    // CASE 5: Connection Path Finder (BFS Chat Trigger)
    else if ((query.includes("john") && query.includes("marcus")) || (query.includes("doe") && query.includes("vance"))) {
      traceLog = [
        "Identified Pathfinder query: [John Doe -> Marcus Vance]",
        "Graph Traversal Method: BFS (Breadth-First Search)",
        "Path discovered: 1 degree of separation"
      ];

      replyHTML = `
        <p>Graph path traversal completed. A direct association link was discovered between <strong>John Doe</strong> and <strong>Marcus Vance</strong>.</p>
        
        <div class="chat-embed-widget" style="background-color: rgba(16,185,129,0.05); border-color: rgba(16,185,129,0.2)">
          <div class="chat-embed-header" style="background-color: rgba(16,185,129,0.1)">
            <span>Criminal Path Highlighted</span>
            <span class="text-emerald font-bold orbitron"><i class="fa-solid fa-circle-check"></i> DISCOVERED</span>
          </div>
          <div class="chat-embed-body flex-column align-center gap-xs">
            <div class="path-step-node w-100" style="border-color: rgba(16,185,129,0.4)"><span class="text-amber">John 'Trigger' Doe</span></div>
            <div class="path-step-arrow text-emerald" style="padding:2px 0;"><i class="fa-solid fa-handshake"></i> Accomplice relationship</div>
            <div class="path-step-node w-100" style="border-color: rgba(16,185,129,0.4)"><span class="text-amber">Marcus 'Slick' Vance</span></div>
          </div>
        </div>
        
        <button class="btn btn-secondary w-100 mt-sm" onclick="AegisChat.teleportToPathfinder('SP-1082', 'SP-2241')">
          <i class="fa-solid fa-route text-cyan"></i> Visualise Path inside Network tab
        </button>
      `;
    }
    
    // DEFAULT UNRECOGNIZED QUERY
    else {
      traceLog = [
        "Error: Search tokens unmatched.",
        "Fall-through: Displaying index recommendations."
      ];

      replyHTML = `
        <p>I could not find matching keywords. Try asking specific analytical questions. E.g.:</p>
        <ul style="padding-left: 20px; font-size:12px;" class="text-secondary flex-column gap-xs mt-xs">
          <li>&bull; "Show me burglaries in Downtown."</li>
          <li>&bull; "Find connections for John Doe."</li>
          <li>&bull; "What is the forecasted crime trend next week?"</li>
          <li>&bull; "Explain factors for Zone B-12."</li>
        </ul>
      `;
    }

    // Append XAI Rationale Panel to the end of message bubble
    replyHTML += `
      <div class="xai-explanation-box mt-md" style="background: rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.05); padding:10px;">
        <div class="xai-header" style="color:var(--text-secondary); font-size:10px; margin-bottom: 4px;">
          <i class="fa-solid fa-terminal text-muted"></i>
          <span>Explainable AI - Rationale Log</span>
        </div>
        <div class="text-muted" style="font-family: monospace; font-size: 10px; line-height: 1.3;">
          ${traceLog.map(log => `<div>&gt; ${log}</div>`).join('')}
        </div>
      </div>
    `;

    appendMessage("bot", replyHTML);
  };

  // --- Cross-tab Teleport Handlers (exposed globally) ---
  const highlightNetworkNode = (susId) => {
    const netMenu = document.querySelector('.menu-item[data-tab="network"]');
    if (netMenu) {
      netMenu.click();
      setTimeout(() => {
        AegisNetwork.highlightSuspectNode(susId);
      }, 400);
    }
  };

  const teleportToPathfinder = (startId, endId) => {
    const netMenu = document.querySelector('.menu-item[data-tab="network"]');
    if (netMenu) {
      netMenu.click();
      setTimeout(() => {
        document.getElementById("path-start-node").value = startId;
        document.getElementById("path-end-node").value = endId;
        document.getElementById("btn-find-path").click();
      }, 400);
    }
  };

  const flyToIncident = (incId) => {
    const inc = AegisDB.getIncidents().find(i => i.id === incId);
    if (!inc) return;
    
    const mapMenu = document.querySelector('.menu-item[data-tab="map"]');
    if (mapMenu) {
      mapMenu.click();
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent("mapFlyToCoordinates", {
          detail: { coords: inc.location, title: inc.title, desc: inc.description }
        }));
      }, 400);
    }
  };

  // --- Public Interface ---
  return {
    init: init,
    highlightNetworkNode: highlightNetworkNode,
    teleportToPathfinder: teleportToPathfinder,
    flyToIncident: flyToIncident
  };
})();
