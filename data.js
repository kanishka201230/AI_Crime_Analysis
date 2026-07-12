
const AegisDB = (() => {
  
  // --- Master Incident Records (Unified Dataset) ---
  let incidents = [
    {
      id: "CR-4022",
      dateTime: "2026-07-11T19:30:00",
      category: "property",
      title: "Commercial Burglary",
      description: "Forced entry at jewelry store. Safe cracked, high-value assets stolen. Witness reported suspect fleeing in a Blue Sedan.",
      location: [37.7845, -122.4145], // Tenderloin/Downtown border
      sector: "Sector B-12 (Downtown Core)",
      riskRating: "High",
      status: "Investigating",
      associatedSuspects: ["SP-1082"],
      associatedVehicles: ["49X-Y33"],
      xai: {
        density: 46,
        lighting: 24,
        patrolAbsence: 20,
        tempCoeff: 10,
        rational: "Zone B-12 flagged due to 3 commercial burglaries within a 400m radius over the last 14 days, combined with a 45-minute gap in patrol schedules and deficient street lighting metrics."
      }
    },
    {
      id: "CR-2041",
      dateTime: "2026-07-10T11:15:00",
      category: "cyber",
      title: "Corporate Wire Fraud",
      description: "Phishing vulnerability exploited to bypass multi-factor authentication. Unauthorized transfer of $240,000 to an offshore account.",
      location: [37.7915, -122.4012], // Financial District
      sector: "Sector A-5 (Financial District)",
      riskRating: "Medium",
      status: "Open",
      associatedSuspects: ["SP-5120", "SP-3044"],
      associatedVehicles: [],
      xai: {
        density: 15,
        lighting: 0,
        patrolAbsence: 5,
        cyberActivity: 80,
        rational: "Financial Sector analytics indicate an spike in suspicious IP hops routing through VPN endpoints previously linked to Sarah Chen."
      }
    },
    {
      id: "CR-3011",
      dateTime: "2026-07-11T20:45:00",
      category: "narcotics",
      title: "Narcotics Trafficking",
      description: "Counter-narcotics unit observed hand-to-hand transactions at street corner. Suspect arrested with possession of controlled substances.",
      location: [37.7820, -122.4190], // Tenderloin
      sector: "Sector C-4 (Tenderloin)",
      riskRating: "High",
      status: "Closed",
      associatedSuspects: ["SP-2241"],
      associatedVehicles: [],
      xai: {
        density: 58,
        lighting: 18,
        patrolAbsence: 14,
        povertyIndex: 10,
        rational: "Historical hot-zone for open-air drug markets. High recidivism rates among nearby drug-related arrests."
      }
    },
    {
      id: "CR-1049",
      dateTime: "2026-07-09T23:55:00",
      category: "property",
      title: "Grand Theft Auto",
      description: "Late model luxury SUV stolen from street parking. Ignition system bypassed. Tracker deactivated shortly after theft.",
      location: [37.7760, -122.4080], // SOMA
      sector: "Sector D-8 (SOMA)",
      riskRating: "Medium",
      status: "Closed",
      associatedSuspects: ["SP-4903"],
      associatedVehicles: ["99Z-A12"],
      xai: {
        density: 35,
        lighting: 30,
        patrolAbsence: 25,
        rational: "SOMA auto-theft rates have risen by 18% month-on-month. The location falls into an unmonitored blind spot of municipal traffic cams."
      }
    },
    {
      id: "CR-5021",
      dateTime: "2026-07-08T02:10:00",
      category: "violent",
      title: "Armed Assault",
      description: "Alleyway dispute escalated to weapon discharge. One victim treated at hospital. Shell casings recovered match 9mm caliber.",
      location: [37.7610, -122.4215], // Mission District
      sector: "Sector E-14 (Mission District)",
      riskRating: "High",
      status: "Investigating",
      associatedSuspects: ["SP-1082", "SP-4903"],
      associatedVehicles: ["49X-Y33"],
      xai: {
        density: 50,
        lighting: 35,
        patrolAbsence: 10,
        liquorDensity: 5,
        rational: "Incident closely matches modus operandi of the Vance gang, recurring in an alleyway with high violent-crime index ratings."
      }
    }
  ];

  // --- Suspect Criminal Dossier Register ---
  let suspects = [
    {
      id: "SP-1082",
      name: "John 'Trigger' Doe",
      alias: "Trigger",
      threatLevel: "Critical",
      convictionsCount: 5,
      lastActivityDate: "2026-07-11",
      bio: "Active violent offender. Specializes in armed commercial robbery and tactical escape. Frequently associates with Marcus Vance and Victor Vance.",
      centralityScore: 88,
      recidivismScore: 92,
      avatarClass: "fa-user-ninja",
      links: [
        { targetId: "SP-2241", type: "Accomplice" },
        { targetId: "SP-4903", type: "Co-defendant" },
        { targetId: "CR-4022", type: "Suspected In" },
        { targetId: "CR-5021", type: "Charged In" },
        { targetId: "49X-Y33", type: "Operator" }
      ]
    },
    {
      id: "SP-2241",
      name: "Marcus 'Slick' Vance",
      alias: "Slick",
      threatLevel: "Elevated",
      convictionsCount: 3,
      lastActivityDate: "2026-07-11",
      bio: "Mid-level distributor in narcotics ring. Interfaces between street dealers and wholesale suppliers. Brother of Victor Vance.",
      centralityScore: 65,
      recidivismScore: 78,
      avatarClass: "fa-user-secret",
      links: [
        { targetId: "SP-1082", type: "Accomplice" },
        { targetId: "SP-4903", type: "Sibling" },
        { targetId: "CR-3011", type: "Arrestee" }
      ]
    },
    {
      id: "SP-3044",
      name: "Helena 'Ghost' Rostova",
      alias: "Ghost",
      threatLevel: "Moderate",
      convictionsCount: 1,
      lastActivityDate: "2026-07-10",
      bio: "Expert money launderer. Specializes in converting wire-fraud currency to cryptocurrency mixers. Provides encryption tools to cyber actors.",
      centralityScore: 72,
      recidivismScore: 45,
      avatarClass: "fa-user-tie",
      links: [
        { targetId: "SP-5120", type: "Technical Associate" },
        { targetId: "CR-2041", type: "Beneficiary" }
      ]
    },
    {
      id: "SP-4903",
      name: "Victor 'Dax' Vance",
      alias: "Dax",
      threatLevel: "Critical",
      convictionsCount: 8,
      lastActivityDate: "2026-07-09",
      bio: "Enforcer and vehicle theft specialist. Leads cargo theft rings. Brother of Marcus Vance.",
      centralityScore: 81,
      recidivismScore: 95,
      avatarClass: "fa-user-gear",
      links: [
        { targetId: "SP-1082", type: "Accomplice" },
        { targetId: "SP-2241", type: "Sibling" },
        { targetId: "CR-1049", type: "Suspected In" },
        { targetId: "CR-5021", type: "Suspected In" },
        { targetId: "49X-Y33", type: "Owner" }
      ]
    },
    {
      id: "SP-5120",
      name: "Sarah 'Cypher' Chen",
      alias: "Cypher",
      threatLevel: "Moderate",
      convictionsCount: 2,
      lastActivityDate: "2026-07-10",
      bio: "Network penetration specialist. Accesses systems using social engineering and session-hijacking tools. Sells access to Rostova.",
      centralityScore: 58,
      recidivismScore: 34,
      avatarClass: "fa-laptop-code",
      links: [
        { targetId: "SP-3044", type: "Technical Associate" },
        { targetId: "CR-2041", type: "Intruder" }
      ]
    }
  ];

  // --- Vehicle Registry ---
  let vehicles = [
    { plate: "49X-Y33", makeModel: "Ford Fusion", color: "Blue", status: "Stolen / Wanted", owner: "Victor Vance", ownerId: "SP-4903" },
    { plate: "99Z-A12", makeModel: "Cadillac Escalade", color: "Black", status: "Recovered", owner: "City Rental Services", ownerId: "" },
    { plate: "12A-B98", makeModel: "Toyota Prius", color: "Silver", status: "Active Registration", owner: "Helena Rostova", ownerId: "SP-3044" }
  ];

  // --- CCTV Cameras and Feeds ---
  let cctvCameras = [
    { id: "CAM-01", name: "6th & Market NW", coords: [37.7818, -122.4101], status: "Active" },
    { id: "CAM-02", name: "9th & Mission SE", coords: [37.7765, -122.4132], status: "Active" },
    { id: "CAM-03", name: "2nd & Folsom NE", coords: [37.7852, -122.3965], status: "Active" },
    { id: "CAM-04", name: "16th & Valencia SW", coords: [37.7645, -122.4221], status: "Alerting" }, // Pulses alarm
    { id: "CAM-05", name: "Union Square Plaza", coords: [37.7879, -122.4074], status: "Offline" }
  ];

  // --- Patrol Deployments & Tracking (Simulated moving assets) ---
  let patrols = [
    {
      id: "P-104",
      officer: "Officer K. Vance",
      vehicle: "Cruiser 104",
      status: "Active Patrol",
      color: "#3B82F6",
      coords: [
        [37.7800, -122.4100],
        [37.7810, -122.4130],
        [37.7830, -122.4150],
        [37.7850, -122.4120],
        [37.7820, -122.4080]
      ],
      currentIdx: 0
    },
    {
      id: "P-212",
      officer: "Sgt. Davis",
      vehicle: "Interceptor 212",
      status: "Responding",
      color: "#EF4444",
      coords: [
        [37.7650, -122.4200],
        [37.7640, -122.4220],
        [37.7620, -122.4210],
        [37.7610, -122.4215]
      ],
      currentIdx: 0
    },
    {
      id: "P-088",
      officer: "Officer Lopez",
      vehicle: "K9 Unit 088",
      status: "Active Patrol",
      color: "#10B981",
      coords: [
        [37.7900, -122.4000],
        [37.7920, -122.4020],
        [37.7910, -122.4050],
        [37.7880, -122.4030]
      ],
      currentIdx: 0
    }
  ];

  // --- Live Alert Dispatch Feed ---
  let alertFeed = [
    {
      id: "ALT-9902",
      type: "Facial Recognition Match",
      time: "21:38:15",
      desc: "CCTV Camera CAM-04 (16th & Valencia) scanned a face matching 96% identity index of John 'Trigger' Doe.",
      severity: "high",
      coords: [37.7645, -122.4221],
      unread: true
    },
    {
      id: "ALT-9901",
      type: "ShotSpotter Acoustic Sensor",
      time: "21:12:40",
      desc: "Audio array captured weapon discharge signature (2 shots) detected near sector E-14 (Mission District). Patrol P-212 dispatched.",
      severity: "high",
      coords: [37.7615, -122.4210],
      unread: true
    },
    {
      id: "ALT-9899",
      type: "Automated Plate Reader (ALPR)",
      time: "20:05:12",
      desc: "License plate 49X-Y33 (Wanted Ford Fusion) logged moving eastbound on Market Street. Speed 45MPH.",
      severity: "medium",
      coords: [37.7818, -122.4101],
      unread: false
    }
  ];

  // --- Local Storage Synchronization ---
  const saveToStorage = () => {
    localStorage.setItem("aegis_incidents", JSON.stringify(incidents));
    localStorage.setItem("aegis_suspects", JSON.stringify(suspects));
    localStorage.setItem("aegis_vehicles", JSON.stringify(vehicles));
    localStorage.setItem("aegis_alerts", JSON.stringify(alertFeed));
  };

  const loadFromStorage = () => {
    const sIncidents = localStorage.getItem("aegis_incidents");
    const sSuspects = localStorage.getItem("aegis_suspects");
    const sVehicles = localStorage.getItem("aegis_vehicles");
    const sAlerts = localStorage.getItem("aegis_alerts");

    if (sIncidents) incidents = JSON.parse(sIncidents);
    if (sSuspects) suspects = JSON.parse(sSuspects);
    if (sVehicles) vehicles = JSON.parse(sVehicles);
    if (sAlerts) alertFeed = JSON.parse(sAlerts);
  };

  // Initialize DB
  loadFromStorage();

  // --- Public API ---
  return {
    getIncidents: () => incidents,
    getSuspects: () => suspects,
    getVehicles: () => vehicles,
    getCCTV: () => cctvCameras,
    getPatrols: () => patrols,
    getAlertFeed: () => alertFeed,
    
    // Add new incident
    addIncident: (newInc) => {
      incidents.unshift(newInc);
      saveToStorage();
      return newInc;
    },

    // Add suspect relationship link
    addSuspectLink: (sourceId, targetId, relType) => {
      const source = suspects.find(s => s.id === sourceId);
      const target = suspects.find(s => s.id === targetId);
      if (source && target) {
        source.links.push({ targetId: targetId, type: relType });
        target.links.push({ targetId: sourceId, type: relType });
        saveToStorage();
        return true;
      }
      return false;
    },

    // Add alert
    addAlert: (alert) => {
      alertFeed.unshift(alert);
      saveToStorage();
      return alert;
    },

    markAlertsRead: () => {
      alertFeed.forEach(a => a.unread = false);
      saveToStorage();
    },

    // Reset database to defaults
    resetDatabase: () => {
      localStorage.removeItem("aegis_incidents");
      localStorage.removeItem("aegis_suspects");
      localStorage.removeItem("aegis_vehicles");
      localStorage.removeItem("aegis_alerts");
      window.location.reload();
    }
  };
})();
