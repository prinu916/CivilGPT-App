/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Project, ProjectType, Room, BaseElement, TimelineTask, MaterialItem, BOQItem, StructuralDetails, DroneIssue } from "./types";

// Generate unique ID
export const generateId = () => Math.random().toString(36).substring(2, 11);

// Standard conversion factor: USD to INR (e.g., 1 USD = 83 INR)
export const USD_TO_INR = 83;

export const formatCurrency = (amount: number, lang: "en" | "hi") => {
  if (lang === "hi") {
    // Return in INR (Lakhs / Crores)
    const inrAmount = amount * USD_TO_INR;
    if (inrAmount >= 10000000) {
      return `₹${(inrAmount / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(inrAmount / 100000).toFixed(2)} Lakh`;
  }
  // Return in USD
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  }
  return `$${amount.toLocaleString()}`;
};

// Initial Project Template: Luxury Villa
export const getLuxuryVillaTemplate = (): Project => {
  const id = "project-villa";
  
  const rooms: Room[] = [
    { id: "room-1", name: "Foyer & Grand Living Room", x: 10, y: 15, width: 35, height: 30, color: "rgba(37, 99, 235, 0.15)", type: "Living" },
    { id: "room-2", name: "Master Suite with Balcony", x: 48, y: 15, width: 25, height: 20, color: "rgba(147, 51, 234, 0.15)", type: "Bedroom" },
    { id: "room-3", name: "Premium Chef's Kitchen", x: 10, y: 48, width: 20, height: 18, color: "rgba(249, 115, 22, 0.15)", type: "Kitchen" },
    { id: "room-4", name: "Guest Bedroom", x: 75, y: 15, width: 18, height: 16, color: "rgba(16, 185, 129, 0.15)", type: "Bedroom" },
    { id: "room-5", name: "Modern Spa Bathroom", x: 32, y: 48, width: 13, height: 14, color: "rgba(6, 182, 212, 0.15)", type: "Bath" },
    { id: "room-6", name: "Home Theater & Lounge", x: 48, y: 38, width: 25, height: 28, color: "rgba(236, 72, 153, 0.15)", type: "Entertainment" },
    { id: "room-7", name: "Formal Dining Lounge", x: 75, y: 34, width: 18, height: 14, color: "rgba(245, 158, 11, 0.15)", type: "Dining" },
  ];

  const elements: BaseElement[] = [
    // Pillars/Columns
    { id: "col-1", name: "Structural Column C1", type: "column", x: 10, y: 15, width: 2, height: 2, properties: { size: "450x450mm", concrete: "M30", steel: "8-16mm dia", reinforcementRatio: "1.8%" } },
    { id: "col-2", name: "Structural Column C2", type: "column", x: 45, y: 15, width: 2, height: 2, properties: { size: "450x450mm", concrete: "M30", steel: "8-16mm dia", reinforcementRatio: "1.8%" } },
    { id: "col-3", name: "Structural Column C3", type: "column", x: 73, y: 15, width: 2, height: 2, properties: { size: "450x450mm", concrete: "M30", steel: "8-16mm dia", reinforcementRatio: "1.8%" } },
    { id: "col-4", name: "Structural Column C4", type: "column", x: 10, y: 45, width: 2, height: 2, properties: { size: "450x450mm", concrete: "M30", steel: "8-16mm dia", reinforcementRatio: "1.8%" } },
    { id: "col-5", name: "Structural Column C5", type: "column", x: 48, y: 38, width: 2, height: 2, properties: { size: "450x450mm", concrete: "M30", steel: "8-16mm dia", reinforcementRatio: "1.8%" } },
    { id: "col-6", name: "Structural Column C6", type: "column", x: 73, y: 48, width: 2, height: 2, properties: { size: "450x450mm", concrete: "M30", steel: "8-16mm dia", reinforcementRatio: "1.8%" } },
    
    // Doors & Windows
    { id: "door-1", name: "Grand Entrance Pivot Door", type: "door", x: 24, y: 14, width: 6, height: 1, properties: { material: "Teak Wood & Brass", cost: 1200, spec: "2.4m x 1.2m" } },
    { id: "door-2", name: "Master Suite Slider", type: "door", x: 48, y: 25, width: 5, height: 1, properties: { material: "Double-Glazed Aluminium", cost: 850, spec: "Slider 2.1m" } },
    { id: "win-1", name: "Living Room Bay Window", type: "window", x: 10, y: 25, width: 1, height: 10, properties: { material: "Low-E Tempered Glass", cost: 1500, spec: "3.0m Grand Arch" } },
    { id: "win-2", name: "Kitchen Awning Window", type: "window", x: 15, y: 66, width: 8, height: 1, properties: { material: "Aluminium Frame", cost: 450, spec: "1.8m x 0.6m" } },
    
    // Furniture & Amenities
    { id: "pool-1", name: "Infinity Pool", type: "pool", x: 48, y: 70, width: 45, height: 22, properties: { depth: "1.2m - 1.8m", cladding: "Mosaic Blue Tiles", features: "Dynamic heating, Salt chlorination" } },
    { id: "garden-1", name: "Zen Landscape Patio", type: "garden", x: 10, y: 70, width: 35, height: 22, properties: { grassType: "Bermuda Turf", trees: "Arborvitae & Bonsai Maple", elements: "Gravel deck with fire pit" } }
  ];

  const structural: StructuralDetails = {
    concreteGrade: "M30",
    steelGrade: "Fe550",
    bearingCapacity: 280, // kN/m^2 (Excellent soil)
    seismicZone: "Zone III",
    windSpeed: 44, // m/s
    factorOfSafety: 1.5
  };

  const materials: MaterialItem[] = [
    { id: "mat-1", name: "Structural Cement (Grade 53)", category: "structural", quantity: 1850, unit: "bags", rate: 5.5, cost: 10175 },
    { id: "mat-2", name: "Reinforced TMT Steel Bars", category: "structural", quantity: 14.5, unit: "tons", rate: 780, cost: 11310 },
    { id: "mat-3", name: "Ready Mix Concrete (M30)", category: "structural", quantity: 380, unit: "m³", rate: 85, cost: 32300 },
    { id: "mat-4", name: "Eco Fly-Ash Bricks", category: "structural", quantity: 42000, unit: "pcs", rate: 0.12, cost: 5040 },
    { id: "mat-5", name: "Premium Teak Joinery & Doors", category: "finishing", quantity: 14, unit: "units", rate: 450, cost: 6300 },
    { id: "mat-6", name: "Italian Calacatta Marble Tiles", category: "finishing", quantity: 450, unit: "m²", rate: 42, cost: 18900 },
    { id: "mat-7", name: "Copper Wiring & MCB Distribution Panels", category: "electrical", quantity: 1, unit: "lot", rate: 8400, cost: 8400 },
    { id: "mat-8", name: "Smart Daikin VRV HVAC Multi-Compressors", category: "hvac", quantity: 4, unit: "units", rate: 3200, cost: 12800 },
    { id: "mat-9", name: "Solar Panel Array (12kW Monocrystalline)", category: "electrical", quantity: 24, unit: "plates", rate: 350, cost: 8400 }
  ];

  const boq: BOQItem[] = [
    { id: "boq-1", code: "CIV-001", description: "Excavation in all soils up to a depth of 2.5m for foundation footings including dewatering and shoring.", unit: "m³", quantity: 450, rate: 12, amount: 5400, agentResponsible: "Civil Engineer AI" },
    { id: "boq-2", code: "STR-002", description: "Providing and laying High Performance Reinforced Cement Concrete (M30 grade) in isolated pile cap foundations and tie beams.", unit: "m³", quantity: 120, rate: 110, amount: 13200, agentResponsible: "Structural Engineer AI" },
    { id: "boq-3", code: "STR-003", description: "Steel reinforcement (Fe550 Grade TMT) for columns and shear walls, cut, bent, and bound in position with binding wire.", unit: "ton", quantity: 8.5, rate: 820, amount: 6970, agentResponsible: "Structural Engineer AI" },
    { id: "boq-4", code: "ARC-004", description: "Constructing external wall partitioning with 230mm thick fly-ash bricks in cement mortar 1:6.", unit: "m²", quantity: 680, rate: 18, amount: 12240, agentResponsible: "Architect AI" },
    { id: "boq-5", code: "INT-005", description: "Supplying and fixing high-polished designer flooring using Calacatta Marble slabs including grinding and polishing.", unit: "m²", quantity: 380, rate: 65, amount: 24700, agentResponsible: "Interior Designer AI" },
    { id: "boq-6", code: "PLU-006", description: "Designing and installing rainwater harvesting recharge well with high density PVC pipes, filter media, and collection tank.", unit: "lot", quantity: 1, rate: 3800, amount: 3800, agentResponsible: "Plumbing Engineer AI" }
  ];

  const timeline: TimelineTask[] = [
    { id: "task-1", task: "Excavation & Ground Preparation", phase: "Foundation", startDate: "2026-07-20", durationDays: 12, progress: 100, dependencies: [], status: "completed", riskLevel: "low", delayPrediction: "Successfully finished. Ground bearing capacity verified at 280 kN/m²." },
    { id: "task-2", task: "Pile Foundation & Footing Concrete", phase: "Foundation", startDate: "2026-08-02", durationDays: 15, progress: 100, dependencies: ["task-1"], status: "completed", riskLevel: "low", delayPrediction: "Completed on schedule. Concrete core cube tests cleared strength requirement." },
    { id: "task-3", task: "Superstructure Columns & Beam Framing", phase: "Superstructure", startDate: "2026-08-18", durationDays: 30, progress: 65, dependencies: ["task-2"], status: "active", riskLevel: "medium", delayPrediction: "Currently on track. Rain alert next week might create a 2-day curing delay." },
    { id: "task-4", task: "Slab Casting & Curing Loop", phase: "Superstructure", startDate: "2026-09-18", durationDays: 20, progress: 0, dependencies: ["task-3"], status: "pending", riskLevel: "low" },
    { id: "task-5", task: "Brickwork Masonry & Wall Partitioning", phase: "Substructure", startDate: "2026-10-10", durationDays: 25, progress: 0, dependencies: ["task-4"], status: "pending", riskLevel: "low" },
    { id: "task-6", task: "Electrical Conduiting & Plumbing Lines", phase: "MEP", startDate: "2026-11-05", durationDays: 18, progress: 0, dependencies: ["task-5"], status: "pending", riskLevel: "medium", delayPrediction: "Potential schedule bottleneck if HVAC multi-compressors delivery is delayed." },
    { id: "task-7", task: "Interior Finishes, Tiling & Teak Joinery", phase: "Finishing", startDate: "2026-11-25", durationDays: 35, progress: 0, dependencies: ["task-6"], status: "pending", riskLevel: "high", delayPrediction: "Marble finishing is labor intensive. Suggest scheduling skilled masons 10 days in advance." },
    { id: "task-8", task: "Drone Inspection & Structural Handover", phase: "Handover", startDate: "2027-01-05", durationDays: 10, progress: 0, dependencies: ["task-7"], status: "pending", riskLevel: "low" }
  ];

  const droneIssues: DroneIssue[] = [
    { id: "issue-1", type: "safety", location: "Grid Column B3-Level 1", severity: "medium", description: "Scaffolding safety harness anchors missing. Immediate compliance required.", detectedAt: "2026-07-15", resolved: false },
    { id: "issue-2", type: "crack", location: "Boundary retaining wall north corner", severity: "low", description: "Hairline superficial shrinkage crack detected in curing compound layer. Structural integrity secure.", detectedAt: "2026-07-16", resolved: true }
  ];

  return {
    id,
    name: "Golden Crest Luxury Villa",
    description: "Multi-level contemporary high-tech premium residence featuring cantilevered concrete structures, automated sun-shading pergolas, private infinity pool, and integrated 12kW monocrystalline solar panels.",
    type: ProjectType.VILLA,
    owner: "Dev Studio Inc.",
    status: "In Construction",
    budget: 285000,
    location: "Sohna Road, Gurgaon Sector 48",
    createdAt: "2026-07-12",
    rooms,
    elements,
    structural,
    materials,
    boq,
    timeline,
    droneIssues,
    sustainabilityScore: 84,
    complianceScore: 95,
    complianceNotes: [
      "FAR of 1.45 compliant within regional maximum cap of 1.75.",
      "Front setback is exactly 6.2m (regional guideline requires minimum 6.0m).",
      "Rainwater harvesting collection tank is properly aligned with underground drains."
    ]
  };
};

export const getSmartDuplexTemplate = (): Project => {
  const id = "project-duplex";
  
  const rooms: Room[] = [
    { id: "room-d1", name: "Ground Floor Family Lounge", x: 15, y: 15, width: 30, height: 25, color: "rgba(37, 99, 235, 0.12)", type: "Living" },
    { id: "room-d2", name: "Guest Bedroom 1", x: 50, y: 15, width: 22, height: 18, color: "rgba(16, 185, 129, 0.12)", type: "Bedroom" },
    { id: "room-d3", name: "Modular Dining Kitchen", x: 15, y: 45, width: 22, height: 20, color: "rgba(249, 115, 22, 0.12)", type: "Kitchen" },
    { id: "room-d4", name: "Common Restroom", x: 40, y: 45, width: 12, height: 12, color: "rgba(6, 182, 212, 0.12)", type: "Bath" },
    { id: "room-d5", name: "Double-Height Staircase Hall", x: 55, y: 38, width: 18, height: 27, color: "rgba(236, 72, 153, 0.12)", type: "Circulation" },
  ];

  const elements: BaseElement[] = [
    { id: "col-d1", name: "Structural Column C1", type: "column", x: 15, y: 15, width: 2, height: 2, properties: { size: "300x450mm", concrete: "M25", steel: "6-16mm dia", reinforcementRatio: "1.5%" } },
    { id: "col-d2", name: "Structural Column C2", type: "column", x: 48, y: 15, width: 2, height: 2, properties: { size: "300x450mm", concrete: "M25", steel: "6-16mm dia", reinforcementRatio: "1.5%" } },
    { id: "col-d3", name: "Structural Column C3", type: "column", x: 15, y: 40, width: 2, height: 2, properties: { size: "300x450mm", concrete: "M25", steel: "6-16mm dia", reinforcementRatio: "1.5%" } },
    { id: "stair-d1", name: "Open-Well Folded Staircase", type: "furniture", x: 58, y: 40, width: 12, height: 18, properties: { rise: "150mm", tread: "300mm", structure: "Exposed Reinforced Concrete Cantilever" } },
    { id: "door-d1", name: "Teak Entry Door", type: "door", x: 26, y: 14, width: 4, height: 1, properties: { material: "Solid Wood", cost: 600, spec: "2.1m x 1.0m" } }
  ];

  const structural: StructuralDetails = {
    concreteGrade: "M25",
    steelGrade: "Fe500",
    bearingCapacity: 210, // kN/m^2
    seismicZone: "Zone IV", // High risk
    windSpeed: 39,
    factorOfSafety: 1.6
  };

  const materials: MaterialItem[] = [
    { id: "mat-d1", name: "Structural Cement (OPC Grade 43)", category: "structural", quantity: 950, unit: "bags", rate: 4.8, cost: 4560 },
    { id: "mat-d2", name: "TMT Fe500 Reinforcement Steel Bars", category: "structural", quantity: 8.2, unit: "tons", rate: 720, cost: 5904 },
    { id: "mat-d3", name: "Ready Mix Concrete (M25)", category: "structural", quantity: 180, unit: "m³", rate: 78, cost: 14040 },
    { id: "mat-d4", name: "Standard Clay Bricks", category: "structural", quantity: 28000, unit: "pcs", rate: 0.10, cost: 2800 }
  ];

  const boq: BOQItem[] = [
    { id: "boq-d1", code: "CIV-101", description: "Earthwork excavation for isolated foundations including backfilling and soil compaction.", unit: "m³", quantity: 210, rate: 10, amount: 2100, agentResponsible: "Civil Engineer AI" },
    { id: "boq-d2", code: "STR-102", description: "Providing and casting in-situ M25 reinforced concrete in column column bases and plinth beams.", unit: "m³", quantity: 74, rate: 95, amount: 7030, agentResponsible: "Structural Engineer AI" }
  ];

  const timeline: TimelineTask[] = [
    { id: "task-d1", task: "Layout Staking & Earthwork", phase: "Foundation", startDate: "2026-07-25", durationDays: 8, progress: 100, dependencies: [], status: "completed", riskLevel: "low" },
    { id: "task-d2", task: "Foundation Column Plinth Slabs", phase: "Foundation", startDate: "2026-08-04", durationDays: 12, progress: 20, dependencies: ["task-d1"], status: "active", riskLevel: "low" },
    { id: "task-d3", task: "Ground Floor Framing & Slab Cast", phase: "Superstructure", startDate: "2026-08-18", durationDays: 20, progress: 0, dependencies: ["task-d2"], status: "pending", riskLevel: "medium" }
  ];

  return {
    id,
    name: "Metropolitan Smart Duplex",
    description: "Compact high-performance 3-Bedroom duplex prioritizing natural ventilation, earthquake damping column sizing, and integrated rainwater recycling cisterns.",
    type: ProjectType.DUPLEX,
    owner: "Priyanshu Builders",
    status: "Planning",
    budget: 142000,
    location: "Noida Sector 62",
    createdAt: "2026-07-14",
    rooms,
    elements,
    structural,
    materials,
    boq,
    timeline,
    droneIssues: [],
    sustainabilityScore: 78,
    complianceScore: 98,
    complianceNotes: [
      "Side setbacks of 3.0m conform strictly to local Noida building bye-laws.",
      "Dual-chamber septic tank capacity structured for up to 8 active residents."
    ]
  };
};

// Simple Calculator to compute totals
export const getProjectMetrics = (project: Project) => {
  const totalCost = project.materials.reduce((sum, item) => sum + item.cost, 0);
  const totalBOQ = project.boq.reduce((sum, item) => sum + item.amount, 0);
  const concreteVolume = project.materials
    .filter(m => m.name.toLowerCase().includes("concrete"))
    .reduce((sum, m) => sum + m.quantity, 0);
  const steelWeight = project.materials
    .filter(m => m.name.toLowerCase().includes("steel"))
    .reduce((sum, m) => sum + m.quantity, 0);

  return {
    totalCost,
    totalBOQ,
    concreteVolume,
    steelWeight
  };
};

// Translations Dictionary (English and Hindi)
export const t = {
  en: {
    tagline: "Design Smarter. Build Faster. Powered by AI.",
    startDesigning: "Start Designing",
    tryAIDemo: "Try AI Demo",
    uploadSketch: "Upload Sketch",
    watchDemo: "Watch Demo",
    overview: "CivilGPT Dashboard",
    activeProjects: "Active Engineering Projects",
    createNew: "New Model",
    projects: "Projects",
    templates: "AI Templates",
    chat: "CivilGPT Agent Chat",
    analytics: "Engineering Analytics",
    materialsCalc: "Live Materials Engine",
    timelineText: "Construction Milestones",
    exportText: "Export Outputs",
    budgetEn: "Total Projected Budget",
    locationText: "Plot Site Location",
    materialsSummary: "Quantities calculated instantly as you modify structures.",
    boqTable: "Bill of Quantities (BOQ)",
    complianceText: "Building Bye-laws Check",
    structuralCalculations: "Structural Engineering Diagnostics",
    addRoom: "Add Space Block",
    addColumn: "Insert Pillar Column",
    undo: "Undo",
    redo: "Redo",
    roleSelector: "Engineering Focus Role",
    droneInspection: "Drone AI Inspection Feed",
    speakPrompt: "Tap to Speak Prompt...",
    typePrompt: "Ask our Multi-Agent AI (e.g. 'Add parking', 'Increase kitchen size', 'Reduce cement use')...",
    explainMode: "Explanation Level Mode",
    simpleMode: "Simple Mode (Non-Engineer)",
    proMode: "Professional Mode (Engineer)",
    teachingMode: "Teaching Mode (Student)",
    translationText: "अनुवाद (Hindi)",
  },
  hi: {
    tagline: "स्मार्ट डिज़ाइन करें। तेज़ी से निर्माण करें। AI द्वारा संचालित।",
    startDesigning: "डिज़ाइन शुरू करें",
    tryAIDemo: "AI डेमो आज़माएं",
    uploadSketch: "स्केच अपलोड करें",
    watchDemo: "डेमो वीडियो",
    overview: "सिविलजीपीटी डैशबोर्ड",
    activeProjects: "सक्रिय इंजीनियरिंग परियोजनाएं",
    createNew: "नया मॉडल",
    projects: "परियोजनाएं",
    templates: "एआई टेम्पलेट्स",
    chat: "सिविलजीपीटी एजेंट चैट",
    analytics: "इंजीनियरिंग विश्लेषिकी",
    materialsCalc: "सामग्री गणना इंजन",
    timelineText: "निर्माण समय-सीमा",
    exportText: "निर्यात विकल्प",
    budgetEn: "कुल अनुमानित बजट",
    locationText: "प्लॉट साइट स्थान",
    materialsSummary: "ढांचे में बदलाव करते ही सामग्री की मात्रा तुरंत अपडेट हो जाती है।",
    boqTable: "मात्राओं का विवरण (BOQ)",
    complianceText: "भवन निर्माण नियमों की जांच",
    structuralCalculations: "संरचनात्मक इंजीनियरिंग निदान",
    addRoom: "कमरा ब्लॉक जोड़ें",
    addColumn: "पिलर कॉलम जोड़ें",
    undo: "पूर्ववत करें",
    redo: "फिर से करें",
    roleSelector: "सक्रिय इंजीनियरिंग भूमिका",
    droneInspection: "ड्रोन एआई निरीक्षण",
    speakPrompt: "आवाज इनपुट के लिए दबाएं...",
    typePrompt: "हमारे एआई एजेंटों से पूछें (उदा. 'पार्किंग जोड़ें', 'रसोई का आकार बढ़ाएं', 'सीमेंट की मात्रा घटाएं')...",
    explainMode: "व्याख्या स्पष्टीकरण स्तर",
    simpleMode: "सरल मोड (सामान्य उपयोगकर्ता)",
    proMode: "पेशेवर मोड (इंजीनियर)",
    teachingMode: "अध्यापन मोड (छात्र)",
    translationText: "English (अंग्रेज़ी)",
  }
};
