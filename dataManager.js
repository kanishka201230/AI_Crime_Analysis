

const AegisExplorer = (() => {
  let searchTerm = "";
  let categoryFilter = "all";
  let statusFilter = "all";

  // --- Initialize Explorer ---
  const init = () => {
    renderTable();
    bindSearchControls();
    bindIngestionDrawer();

    // Re-draw table if DB updates from alerts or other widgets
    document.addEventListener("databaseUpdated", () => {
      renderTable();
    });
  };

  // --- Render Unified Incident Database Table ---
  const renderTable = () => {
    const tbody = document.getElementById("explorer-table-body");
    const incidents = AegisDB.getIncidents();
    
    tbody.innerHTML = "";

    // Filtering logic
    const filteredIncidents = incidents.filter(inc => {
      // 1. Text search filter
      const matchesSearch = 
        inc.id.toLowerCase().includes(searchTerm) ||
        inc.title.toLowerCase().includes(searchTerm) ||
        inc.description.toLowerCase().includes(searchTerm) ||
        inc.sector.toLowerCase().includes(searchTerm);

      // 2. Category filter
      const matchesCategory = 
        categoryFilter === "all" || inc.category === categoryFilter;

      // 3. Status filter
      const matchesStatus = 
        statusFilter === "all" || inc.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });

    if (filteredIncidents.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-lg text-secondary">
            <i class="fa-solid fa-database fa-2x opacity-40 mb-sm"></i>
            <p>No matching database records found.</p>
          </td>
        </tr>
      `;
      return;
    }

    filteredIncidents.forEach(inc => {
      const row = document.createElement("tr");
      
      // Status pill coloring
      let statusClass = "open";
      if (inc.status === "Investigating") statusClass = "investigating";
      else if (inc.status === "Closed") statusClass = "closed";

      // Category icon styling
      let categoryTag = inc.category;
      if (inc.category === "property") categoryTag = `<span class="text-amber"><i class="fa-solid fa-house-crack"></i> Property</span>`;
      else if (inc.category === "violent") categoryTag = `<span class="text-red"><i class="fa-solid fa-skull-crossbones"></i> Violent</span>`;
      else if (inc.category === "narcotics") categoryTag = `<span class="text-cyan"><i class="fa-solid fa-capsules"></i> Narcotics</span>`;
      else if (inc.category === "cyber") categoryTag = `<span class="text-purple"><i class="fa-solid fa-laptop-code"></i> Cyber</span>`;

      // Risk rating tag
      let riskTag = `<span class="text-cyan font-bold">${inc.riskRating}</span>`;
      if (inc.riskRating === "High") riskTag = `<span class="text-red font-bold">${inc.riskRating}</span>`;
      else if (inc.riskRating === "Medium") riskTag = `<span class="text-amber font-bold">${inc.riskRating}</span>`;

      const formattedTime = inc.dateTime.replace('T', ' ').substring(0, 16);

      row.innerHTML = `
        <td class="orbitron font-semibold text-cyan">${inc.id}</td>
        <td class="text-secondary text-small">${formattedTime}</td>
        <td>${categoryTag}</td>
        <td>
          <div class="bold text-primary">${inc.title}</div>
          <div class="text-secondary text-small" style="max-width:320px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${inc.description}">${inc.description}</div>
        </td>
        <td class="text-secondary text-small">${inc.sector.split(' ')[0]}</td>
        <td>${riskTag}</td>
        <td><span class="table-status-pill ${statusClass}">${inc.status}</span></td>
        <td>
          <button class="btn btn-icon btn-table-locate" title="Locate on Map"><i class="fa-solid fa-map-location-dot"></i></button>
        </td>
      `;

      // Locate Incident on Map Action handler
      row.querySelector(".btn-table-locate").addEventListener("click", () => {
        const mapMenu = document.querySelector('.menu-item[data-tab="map"]');
        if (mapMenu) {
          mapMenu.click();
          setTimeout(() => {
            document.dispatchEvent(new CustomEvent("mapFlyToCoordinates", {
              detail: { coords: inc.location, title: inc.title, desc: inc.description }
            }));
          }, 400);
        }
      });

      tbody.appendChild(row);
    });
  };

  // --- Bind Search and Filters input ---
  const bindSearchControls = () => {
    const searchInput = document.getElementById("explorer-search");
    const categorySelect = document.getElementById("explorer-category");
    const statusSelect = document.getElementById("explorer-status");

    searchInput.addEventListener("input", (e) => {
      searchTerm = e.target.value.toLowerCase().trim();
      renderTable();
    });

    categorySelect.addEventListener("change", (e) => {
      categoryFilter = e.target.value;
      renderTable();
    });

    statusSelect.addEventListener("change", (e) => {
      statusFilter = e.target.value;
      renderTable();
    });
  };

  // --- Bind Ingestion Panel Sliding Drawer ---
  const bindIngestionDrawer = () => {
    const drawer = document.getElementById("ingest-drawer");
    const showBtn = document.getElementById("btn-show-ingest");
    const closeBtn = document.getElementById("btn-close-ingest");

    showBtn.addEventListener("click", () => {
      const isHidden = drawer.style.display === "none";
      drawer.style.display = isHidden ? "block" : "none";
      showBtn.innerHTML = isHidden ? `<i class="fa-solid fa-chevron-up"></i> Close Panel` : `<i class="fa-solid fa-cloud-arrow-up"></i> Ingest Raw Data`;
    });

    closeBtn.addEventListener("click", () => {
      drawer.style.display = "none";
      showBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Ingest Raw Data`;
    });

    // Ingest Manual Text Report Button Click
    document.getElementById("btn-parse-report").addEventListener("click", parseTextReport);

    // CSV Ingestion drag/drop handlers
    const dragZone = document.getElementById("csv-drag-zone");
    const fileInput = document.getElementById("csv-file-input");

    dragZone.addEventListener("click", () => fileInput.click());
    
    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        simulateCSVUpload(e.target.files[0].name);
      }
    });

    dragZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dragZone.style.borderColor = "var(--accent-cyan)";
      dragZone.style.background = "rgba(0, 240, 255, 0.04)";
    });

    dragZone.addEventListener("dragleave", () => {
      dragZone.style.borderColor = "var(--border-color)";
      dragZone.style.background = "transparent";
    });

    dragZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dragZone.style.borderColor = "var(--border-color)";
      dragZone.style.background = "transparent";
      
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].name.endsWith(".csv")) {
        simulateCSVUpload(files[0].name);
      } else {
        alert("Please upload a valid spreadsheet CSV file format.");
      }
    });
  };

  // --- Regex Entity parsing from Raw Report ---
  const parseTextReport = () => {
    const text = document.getElementById("raw-report-text").value.trim();
    if (!text) {
      alert("Please paste some narrative text report details first.");
      return;
    }

    // AI regex extraction models
    let category = "property";
    let title = "Suspicious Crime Log";
    let risk = "Medium";
    
    const textLower = text.toLowerCase();
    
    // 1. Identify category
    if (textLower.includes("robbery") || textLower.includes("burglary") || textLower.includes("theft") || textLower.includes("stole")) {
      category = "property";
      title = "Property Larceny Heist";
    } else if (textLower.includes("assault") || textLower.includes("shots") || textLower.includes("gun") || textLower.includes("weapon") || textLower.includes("threat")) {
      category = "violent";
      title = "Violent Assault Activity";
      risk = "High";
    } else if (textLower.includes("drug") || textLower.includes("capsule") || textLower.includes("narcotics") || textLower.includes("heroin") || textLower.includes("dealing")) {
      category = "narcotics";
      title = "Narcotics Distribution Alert";
      risk = "High";
    } else if (textLower.includes("wire fraud") || textLower.includes("phishing") || textLower.includes("cyber") || textLower.includes("hacked")) {
      category = "cyber";
      title = "Unauthorized Network Fraud";
    }

    // 2. Identify Suspect linkages
    let associatedSuspects = [];
    if (textLower.includes("trigger") || textLower.includes("john doe")) associatedSuspects.push("SP-1082");
    if (textLower.includes("slick") || textLower.includes("marcus")) associatedSuspects.push("SP-2241");
    if (textLower.includes("ghost") || textLower.includes("helena")) associatedSuspects.push("SP-3044");
    if (textLower.includes("dax") || textLower.includes("victor")) associatedSuspects.push("SP-4903");
    if (textLower.includes("cypher") || textLower.includes("sarah")) associatedSuspects.push("SP-5120");

    // 3. Identify Vehicle license plates
    let associatedVehicles = [];
    const plateRegex = /\b[0-9]{2}[a-z]-[a-z][0-9]{2}\b/gi; // Matches e.g. 49X-Y33
    const plateMatches = text.match(plateRegex);
    if (plateMatches) {
      associatedVehicles.push(plateMatches[0].toUpperCase());
    } else if (textLower.includes("sedan") || textLower.includes("getaway")) {
      associatedVehicles.push("49X-Y33"); // link standard suspect getaway plate
    }

    // 4. Assign mock coordinates centering on downtown or mission depending on words
    let coords = [37.7749, -122.4194]; // city center
    let sector = "Sector C-4 (Tenderloin)";
    if (textLower.includes("downtown") || textLower.includes("market st") || textLower.includes("jewelry")) {
      coords = [37.7850, -122.4120];
      sector = "Sector B-12 (Downtown Core)";
    } else if (textLower.includes("mission") || textLower.includes("valencia") || textLower.includes("club")) {
      coords = [37.7620, -122.4210];
      sector = "Sector E-14 (Mission District)";
    } else if (textLower.includes("financial") || textLower.includes("wire") || textLower.includes("corporate")) {
      coords = [37.7910, -122.4005];
      sector = "Sector A-5 (Financial District)";
    }

    // Create Struct
    const newInc = {
      id: "CR-" + Math.floor(1000 + Math.random() * 9000),
      dateTime: new Date().toISOString(),
      category: category,
      title: title,
      description: text,
      location: coords,
      sector: sector,
      riskRating: risk,
      status: "Open",
      associatedSuspects: associatedSuspects,
      associatedVehicles: associatedVehicles,
      xai: {
        density: 35,
        lighting: 20,
        patrolAbsence: 45,
        rational: "AI extracted incident records. Extracted entities: Suspects: " + (associatedSuspects.join(', ') || 'None') + ", Vehicles: " + (associatedVehicles.join(', ') || 'None')
      }
    };

    // Insert database
    AegisDB.addIncident(newInc);
    
    // Broadcast updates
    document.dispatchEvent(new CustomEvent("databaseUpdated"));
    document.dispatchEvent(new CustomEvent("newAlertReceived", {
      detail: {
        id: "ALT-" + Math.floor(1000 + Math.random() * 9000),
        type: "New Report Ingested: " + title,
        time: new Date().toTimeString().split(' ')[0],
        desc: `AI structured: Category ${category}, Location ${sector}. Target nodes updated on maps.`,
        severity: "medium",
        coords: coords,
        unread: true
      }
    }));

    // Reset Form & close
    document.getElementById("raw-report-text").value = "";
    document.getElementById("btn-show-ingest").click();
  };

  // --- Simulate CSV Spreadsheet Drop Ingest ---
  const simulateCSVUpload = (fileName) => {
    const statusBox = document.getElementById("upload-status");
    const statusText = document.getElementById("upload-status-text");

    statusBox.style.display = "flex";
    statusText.textContent = `Processing CSV File: ${fileName}. Extracting records...`;

    setTimeout(() => {
      // Ingest 3 mock incidents
      const csvIncidents = [
        {
          id: "CR-8012",
          dateTime: "2026-07-11T14:20:00",
          category: "property",
          title: "Package Theft Spree",
          description: "Multiple package thefts reported from front porches by suspect wearing dark hoodie. Fled on foot.",
          location: [37.7985, -122.4385], // Marina
          sector: "Sector F-10 (Marina District)",
          riskRating: "Low",
          status: "Open",
          associatedSuspects: [],
          associatedVehicles: [],
          xai: { density: 10, lighting: 10, patrolAbsence: 80, rational: "Marina district logging low historical crime rates, but patrol frequency void index is high." }
        },
        {
          id: "CR-8013",
          dateTime: "2026-07-11T16:45:00",
          category: "violent",
          title: "Armed Robbery (Street)",
          description: "Pedestrian approached by two suspects displaying knife. Wallet and cell phone taken. Suspects fled on bicycles.",
          location: [37.7770, -122.4115], // SOMA
          sector: "Sector D-8 (SOMA)",
          riskRating: "High",
          status: "Investigating",
          associatedSuspects: ["SP-2241"],
          associatedVehicles: [],
          xai: { density: 38, lighting: 42, patrolAbsence: 20, rational: "SOMA sector crime vectors show spike in afternoon street crimes during shift overlaps." }
        }
      ];

      csvIncidents.forEach(inc => AegisDB.addIncident(inc));

      statusText.innerHTML = `<strong>Ingestion Complete!</strong> Ingested 2 incident records from <code>${fileName}</code> into master database. Maps updated.`;
      
      // Update tables
      document.dispatchEvent(new CustomEvent("databaseUpdated"));
      
      // Toast notification chime
      document.dispatchEvent(new CustomEvent("newAlertReceived", {
        detail: {
          id: "ALT-800",
          type: "CSV Batch Import Success",
          time: new Date().toTimeString().split(' ')[0],
          desc: `Imported 2 records from file: ${fileName}. Coordinates matched to SOMA and Marina.`,
          severity: "low",
          coords: [37.7770, -122.4115],
          unread: false
        }
      }));

      setTimeout(() => {
        statusBox.style.display = "none";
        document.getElementById("btn-show-ingest").click();
      }, 4000);
      
    }, 1500);
  };

  // --- Public Interface ---
  return {
    init: init
  };
})();
