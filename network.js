
const AegisNetwork = (() => {
  let network = null;
  let nodesDataSet = null;
  let edgesDataSet = null;
  
  // Custom Styles for VisJS Nodes
  const styles = {
    suspect: { shape: "dot", size: 24, color: { background: "#1E293B", border: "#F59E0B", hover: "#F59E0B", highlight: "#EF4444" }, borderWidth: 2, font: { color: "#F1F5F9", face: "Inter", size: 12 } },
    crime: { shape: "triangle", size: 20, color: { background: "#0F172A", border: "#EF4444", hover: "#EF4444", highlight: "#EF4444" }, borderWidth: 2, font: { color: "#94A3B8", face: "Inter", size: 11 } },
    vehicle: { shape: "square", size: 18, color: { background: "#0B132B", border: "#3B82F6", hover: "#3B82F6", highlight: "#00F0FF" }, borderWidth: 2, font: { color: "#94A3B8", face: "Inter", size: 10 } }
  };

  // --- Initialize Network Module ---
  const init = () => {
    buildGraphData();
    populatePathfinderDropdowns();

    // Bind Buttons
    document.getElementById("btn-find-path").addEventListener("click", calculatePath);
    document.getElementById("btn-clear-path").addEventListener("click", clearPathHighlight);
    
    // Zoom Buttons
    document.getElementById("net-zoom-in").addEventListener("click", () => network.zoom({ scale: network.getScale() * 1.2 }));
    document.getElementById("net-zoom-out").addEventListener("click", () => network.zoom({ scale: network.getScale() * 0.8 }));
    document.getElementById("net-fit").addEventListener("click", () => network.fit({ animation: true }));
    
    // Re-draw graph if DB undergoes updates (ingested files)
    document.addEventListener("databaseUpdated", () => {
      buildGraphData();
      populatePathfinderDropdowns();
    });
  };

  // --- Build VisJS Nodes and Edges DataSets ---
  const buildGraphData = () => {
    const suspects = AegisDB.getSuspects();
    const incidents = AegisDB.getIncidents();
    const vehicles = AegisDB.getVehicles();

    const nodes = [];
    const edges = [];

    // 1. Process Suspect Nodes
    suspects.forEach(sus => {
      let threatBorder = "#F59E0B"; // Elevated
      if (sus.threatLevel === "Critical") threatBorder = "#EF4444";
      else if (sus.threatLevel === "Moderate") threatBorder = "#3B82F6";

      nodes.push({
        id: sus.id,
        label: sus.name,
        title: `Suspect: ${sus.name} (${sus.alias})`,
        group: "suspect",
        shape: "dot",
        size: 25,
        borderWidth: 3,
        color: {
          background: "#121A2E",
          border: threatBorder,
          highlight: { background: "#1C2D54", border: "#00F0FF" }
        },
        font: styles.suspect.font
      });

      // Add suspect-to-suspect links (Avoid duplicate edge additions)
      sus.links.forEach(link => {
        // Only map relationships targeting other suspects directly here
        if (link.targetId.startsWith("SP-") && sus.id < link.targetId) {
          edges.push({
            id: `edge-${sus.id}-${link.targetId}`,
            from: sus.id,
            to: link.targetId,
            label: link.type,
            color: { color: "#1F293D", highlight: "#00F0FF" },
            font: { color: "#64748B", size: 10, face: "Inter" },
            arrows: { to: { enabled: false } },
            length: 180
          });
        }
      });
    });

    // 2. Process Crime Nodes
    incidents.forEach(inc => {
      nodes.push({
        id: inc.id,
        label: inc.id,
        title: `Crime Case: ${inc.title} (${inc.category})`,
        group: "crime",
        shape: "triangle",
        size: 18,
        borderWidth: 2,
        color: {
          background: "#1E1220",
          border: "#EF4444",
          highlight: { background: "#3A183C", border: "#00F0FF" }
        },
        font: styles.crime.font
      });

      // Connect suspect to crime nodes
      if (inc.associatedSuspects) {
        inc.associatedSuspects.forEach(susId => {
          edges.push({
            id: `edge-${susId}-${inc.id}`,
            from: susId,
            to: inc.id,
            label: "Suspect In",
            color: { color: "#1F293D", highlight: "#00F0FF" },
            font: { color: "#64748B", size: 9, face: "Inter" },
            arrows: { to: { enabled: true, scaleFactor: 0.5 } },
            length: 120
          });
        });
      }
      
      // Connect vehicle to crime nodes
      if (inc.associatedVehicles) {
        inc.associatedVehicles.forEach(plate => {
          edges.push({
            id: `edge-${plate}-${inc.id}`,
            from: plate,
            to: inc.id,
            label: "Sighted At",
            color: { color: "#1F293D", highlight: "#00F0FF" },
            font: { color: "#64748B", size: 9, face: "Inter" },
            arrows: { to: { enabled: true, scaleFactor: 0.5 } },
            length: 120
          });
        });
      }
    });

    // 3. Process Vehicle Nodes
    vehicles.forEach(veh => {
      nodes.push({
        id: veh.plate,
        label: veh.plate,
        title: `Vehicle: ${veh.color} ${veh.makeModel}`,
        group: "vehicle",
        shape: "square",
        size: 16,
        borderWidth: 2,
        color: {
          background: "#081320",
          border: "#3B82F6",
          highlight: { background: "#0F2644", border: "#00F0FF" }
        },
        font: styles.vehicle.font
      });

      // Link owner suspect to vehicle
      if (veh.ownerId) {
        edges.push({
          id: `edge-${veh.ownerId}-${veh.plate}`,
          from: veh.ownerId,
          to: veh.plate,
          label: "Registered Owner",
          color: { color: "#1F293D", highlight: "#00F0FF" },
          font: { color: "#64748B", size: 9, face: "Inter" },
          arrows: { to: { enabled: false } },
          length: 100
        });
      }
    });

    // Initialize Vis Network
    nodesDataSet = new vis.DataSet(nodes);
    edgesDataSet = new vis.DataSet(edges);

    const container = document.getElementById("network-canvas");
    const data = { nodes: nodesDataSet, edges: edgesDataSet };
    
    const options = {
      physics: {
        forceAtlas2Based: {
          gravitationalConstant: -26,
          centralGravity: 0.005,
          springLength: 140,
          springConstant: 0.18
        },
        maxVelocity: 146,
        solver: "forceAtlas2Based",
        timestep: 0.35,
        stabilization: { iterations: 150 }
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        selectable: true,
        selectConnectedEdges: true
      }
    };

    network = new vis.Network(container, data, options);

    // Bind Node Selection Click Listener
    network.on("selectNode", (params) => {
      const selectedNodeId = params.nodes[0];
      inspectNodeEntity(selectedNodeId);
    });

    network.on("deselectNode", () => {
      hideDossierInspector();
    });
  };

  // --- Entity Dossier Inspector Details Binder ---
  const inspectNodeEntity = (nodeId) => {
    document.getElementById("dossier-empty-state").style.display = "none";
    const dossierDisplay = document.getElementById("dossier-display-state");
    dossierDisplay.style.display = "block";

    const suspects = AegisDB.getSuspects();
    const incidents = AegisDB.getIncidents();
    const vehicles = AegisDB.getVehicles();

    // Check if Suspect Node clicked
    const sus = suspects.find(s => s.id === nodeId);
    if (sus) {
      document.getElementById("dossier-name").textContent = sus.name;
      document.getElementById("dossier-id").textContent = `ID: ${sus.id}`;
      document.getElementById("dossier-convictions").textContent = sus.convictionsCount;
      document.getElementById("dossier-last-seen").textContent = sus.lastActivityDate;
      document.getElementById("dossier-bio").textContent = sus.bio;
      
      // Avatar icon
      const avatarEl = document.getElementById("dossier-avatar");
      avatarEl.className = `fa-solid ${sus.avatarClass} dossier-avatar-placeholder`;
      
      // Risk Badge Color Coding
      const badge = document.getElementById("dossier-threat");
      badge.textContent = `${sus.threatLevel.toUpperCase()} RISK`;
      badge.className = "dossier-threat-badge";
      if (sus.threatLevel === "Critical") badge.classList.add("bg-red");
      else if (sus.threatLevel === "Elevated") badge.classList.add("bg-amber");
      else badge.classList.add("bg-blue");

      // Set Network centralities
      document.getElementById("metric-centrality").textContent = (sus.centralityScore / 100).toFixed(2);
      document.getElementById("bar-centrality").style.width = `${sus.centralityScore}%`;
      document.getElementById("metric-recidivism").textContent = `${sus.recidivismScore}%`;
      document.getElementById("bar-recidivism").style.width = `${sus.recidivismScore}%`;

      // Fill in links list
      const linksContainer = document.getElementById("dossier-links");
      linksContainer.innerHTML = "";

      sus.links.forEach(link => {
        const li = document.createElement("li");
        li.className = "dossier-link-item";
        
        let targetName = link.targetId;
        // Lookup target name/alias
        const matchSus = suspects.find(s => s.id === link.targetId);
        const matchInc = incidents.find(i => i.id === link.targetId);
        
        if (matchSus) targetName = `${matchSus.name} (${matchSus.alias})`;
        else if (matchInc) targetName = `${matchInc.id}: ${matchInc.title}`;

        li.innerHTML = `
          <span>${targetName}</span>
          <span class="dossier-link-rel text-cyan">${link.type}</span>
        `;
        linksContainer.appendChild(li);
      });
      return;
    }

    // Check if Crime Node clicked
    const inc = incidents.find(i => i.id === nodeId);
    if (inc) {
      document.getElementById("dossier-name").textContent = inc.title;
      document.getElementById("dossier-id").textContent = `CASE ID: ${inc.id}`;
      document.getElementById("dossier-convictions").textContent = inc.status;
      document.getElementById("dossier-last-seen").textContent = inc.dateTime.split('T')[0];
      document.getElementById("dossier-bio").textContent = inc.description;
      
      const avatarEl = document.getElementById("dossier-avatar");
      avatarEl.className = "fa-solid fa-file-invoice dossier-avatar-placeholder";

      const badge = document.getElementById("dossier-threat");
      badge.textContent = `${inc.riskRating.toUpperCase()} RISK`;
      badge.className = "dossier-threat-badge";
      if (inc.riskRating === "High") badge.classList.add("bg-red");
      else if (inc.riskRating === "Medium") badge.classList.add("bg-amber");
      else badge.classList.add("bg-blue");

      document.getElementById("metric-centrality").textContent = "N/A";
      document.getElementById("bar-centrality").style.width = "0%";
      document.getElementById("metric-recidivism").textContent = "N/A";
      document.getElementById("bar-recidivism").style.width = "0%";

      const linksContainer = document.getElementById("dossier-links");
      linksContainer.innerHTML = `
        <li class="dossier-link-item">
          <span>Location: ${inc.sector}</span>
          <span class="dossier-link-rel text-cyan">Geo</span>
        </li>
      `;
      return;
    }

    // Check if Vehicle Node clicked
    const veh = vehicles.find(v => v.plate === nodeId);
    if (veh) {
      document.getElementById("dossier-name").textContent = `${veh.color} ${veh.makeModel}`;
      document.getElementById("dossier-id").textContent = `PLATE: ${veh.plate}`;
      document.getElementById("dossier-convictions").textContent = veh.status;
      document.getElementById("dossier-last-seen").textContent = "N/A";
      document.getElementById("dossier-bio").textContent = `Vehicle registered to ${veh.owner || "unknown"}.`;
      
      const avatarEl = document.getElementById("dossier-avatar");
      avatarEl.className = "fa-solid fa-car dossier-avatar-placeholder";

      const badge = document.getElementById("dossier-threat");
      badge.textContent = veh.status.toUpperCase();
      badge.className = "dossier-threat-badge";
      if (veh.status === "Stolen / Wanted") badge.classList.add("bg-red");
      else badge.classList.add("bg-blue");

      document.getElementById("metric-centrality").textContent = "N/A";
      document.getElementById("bar-centrality").style.width = "0%";
      document.getElementById("metric-recidivism").textContent = "N/A";
      document.getElementById("bar-recidivism").style.width = "0%";

      const linksContainer = document.getElementById("dossier-links");
      linksContainer.innerHTML = "";
    }
  };

  const hideDossierInspector = () => {
    document.getElementById("dossier-empty-state").style.display = "block";
    document.getElementById("dossier-display-state").style.display = "none";
  };

  // --- Populate Dropdown Select lists ---
  const populatePathfinderDropdowns = () => {
    const startSelect = document.getElementById("path-start-node");
    const endSelect = document.getElementById("path-end-node");
    const suspects = AegisDB.getSuspects();

    startSelect.innerHTML = `<option value="">Select Start Suspect...</option>`;
    endSelect.innerHTML = `<option value="">Select Target Suspect...</option>`;

    suspects.forEach(sus => {
      const optStr = `<option value="${sus.id}">${sus.name} (${sus.alias})</option>`;
      startSelect.innerHTML += optStr;
      endSelect.innerHTML += optStr;
    });
  };

  // --- Pathfinder Association Algorithm (BFS) ---
  const calculatePath = () => {
    const startId = document.getElementById("path-start-node").value;
    const endId = document.getElementById("path-end-node").value;
    const resultBox = document.getElementById("pathfinder-result");

    if (!startId || !endId) {
      alert("Please select both start and target suspect nodes.");
      return;
    }

    if (startId === endId) {
      alert("Please select different start and target suspects.");
      return;
    }

    // Run Breadth-First Search (BFS) to find shortest path in our graph
    const path = runBFS(startId, endId);

    if (path.length === 0) {
      resultBox.style.display = "block";
      resultBox.innerHTML = `
        <div class="text-center text-red text-small font-bold">
          <i class="fa-solid fa-triangle-exclamation"></i> No Link Found
          <p class="text-secondary font-normal mt-xs">No direct or indirect connections found between these suspects in current registry.</p>
        </div>
      `;
      return;
    }

    // Highlight Network Graph Node Path
    highlightGraphPath(path);

    // Show step by step paths in side panel
    resultBox.style.display = "block";
    resultBox.innerHTML = `<h5 class="text-cyan mb-sm font-semibold text-small orbitron">Path Detected (${path.length - 1} Degrees of Separation)</h5>`;
    
    const suspects = AegisDB.getSuspects();
    const incidents = AegisDB.getIncidents();
    const vehicles = AegisDB.getVehicles();

    for (let i = 0; i < path.length; i++) {
      const nodeId = path[i];
      let nodeName = nodeId;
      let nodeClass = "text-amber";
      
      const sus = suspects.find(s => s.id === nodeId);
      const inc = incidents.find(c => c.id === nodeId);
      const veh = vehicles.find(v => v.plate === nodeId);

      if (sus) { nodeName = sus.name; nodeClass = "text-amber"; }
      else if (inc) { nodeName = `Case ${inc.id}`; nodeClass = "text-red"; }
      else if (veh) { nodeName = `Vehicle ${veh.plate}`; nodeClass = "text-blue"; }

      const stepNode = document.createElement("div");
      stepNode.className = "path-step-node";
      stepNode.innerHTML = `<span class="${nodeClass}">${nodeName}</span> <span class="text-muted text-small">(${nodeId})</span>`;
      
      resultBox.appendChild(stepNode);

      if (i < path.length - 1) {
        const arrow = document.createElement("div");
        arrow.className = "path-step-arrow";
        arrow.innerHTML = `<i class="fa-solid fa-chevron-down"></i>`;
        resultBox.appendChild(arrow);
      }
    }

    document.getElementById("btn-clear-path").style.display = "block";
  };

  // --- BFS Shortest Path Finder Logic ---
  const runBFS = (start, target) => {
    const queue = [[start]];
    const visited = new Set();
    visited.add(start);

    // Collect adjacency mappings
    const adj = {};
    const nodes = nodesDataSet.get();
    const edges = edgesDataSet.get();

    // Init adjacency lists
    nodes.forEach(n => adj[n.id] = []);
    edges.forEach(e => {
      adj[e.from].push(e.to);
      adj[e.to].push(e.from);
    });

    while (queue.length > 0) {
      const path = queue.shift();
      const node = path[path.length - 1];

      if (node === target) return path;

      const neighbors = adj[node] || [];
      for (let neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }
    return [];
  };

  // --- Highlight Node Graph Path ---
  const highlightGraphPath = (path) => {
    const pathNodesSet = new Set(path);
    const nodes = nodesDataSet.get();
    const edges = edgesDataSet.get();

    // Gray out non-path nodes, keep path nodes bright
    nodes.forEach(node => {
      if (pathNodesSet.has(node.id)) {
        nodesDataSet.update({
          id: node.id,
          color: { background: "#1F2937", border: "#00F0FF" },
          shadow: { enabled: true, color: "#00F0FF", size: 10 }
        });
      } else {
        nodesDataSet.update({
          id: node.id,
          opacity: 0.15
        });
      }
    });

    // Highlight connecting path edges, dim others
    edges.forEach(edge => {
      const fromInPath = pathNodesSet.has(edge.from);
      const toInPath = pathNodesSet.has(edge.to);
      const isPathEdge = fromInPath && toInPath && Math.abs(path.indexOf(edge.from) - path.indexOf(edge.to)) === 1;

      if (isPathEdge) {
        edgesDataSet.update({
          id: edge.id,
          color: { color: "#00F0FF", highlight: "#00F0FF" },
          width: 3
        });
      } else {
        edgesDataSet.update({
          id: edge.id,
          opacity: 0.05
        });
      }
    });
  };

  // --- Clear Path Highlight and Restore Defaults ---
  const clearPathHighlight = () => {
    buildGraphData(); // rebuilds default state sets
    document.getElementById("pathfinder-result").style.display = "none";
    document.getElementById("btn-clear-path").style.display = "none";
    document.getElementById("path-start-node").value = "";
    document.getElementById("path-end-node").value = "";
  };

  // --- Public Interface ---
  return {
    init: init,
    fitGraph: () => {
      if (network) {
        setTimeout(() => network.fit({ animation: true }), 100);
      }
    },
    // Trigger graph highlighting of a suspect externally (e.g. from NLP Chat)
    highlightSuspectNode: (susId) => {
      if (!network || !nodesDataSet) return;
      network.selectNodes([susId]);
      inspectNodeEntity(susId);
      network.focus(susId, { scale: 1.3, animation: true });
    }
  };
})();
