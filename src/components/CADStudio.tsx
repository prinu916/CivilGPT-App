import React, { useState, useRef, useEffect } from "react";
import { 
  FolderOpen, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  RotateCw, 
  Printer, 
  Share2, 
  Settings, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Maximize2, 
  Layers, 
  Sparkles, 
  Bot, 
  Send,
  Grid,
  Box,
  Compass,
  FileText,
  MousePointer,
  HelpCircle,
  Copy,
  FolderPlus,
  RefreshCw,
  Info,
  CheckCircle,
  Check,
  X,
  Type,
  Maximize,
  Sliders,
  Move,
  CornerDownRight,
  UserCheck,
  ChevronDown
} from "lucide-react";

// Types for our CAD Editor
interface CADElement {
  id: string;
  type: "line" | "rect" | "circle" | "polyline" | "arc" | "text" | "staircase" | "door" | "window" | "roof";
  name: string;
  layer: string;
  color: string;
  thickness: number;
  opacity: number;
  // Coordinate definitions
  x1: number;
  y1: number;
  x2?: number;
  y2?: number;
  r?: number; // radius for circle/arc
  text?: string;
  material?: string;
  rotation?: number;
  scale?: number;
}

interface CADLayer {
  name: string;
  color: string;
  visible: boolean;
  locked: boolean;
  frozen: boolean;
  opacity: number;
  lineType: "solid" | "dashed" | "dotted";
  lineWeight: number; // in mm
}

export default function CADStudio({ 
  lang,
  formatCurrency 
}: { 
  lang: "en" | "hi";
  formatCurrency: (val: number, l: "en" | "hi") => string;
}) {
  // Canvas Ref & Interaction States
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<CADElement[]>([
    { id: "wall-outer-1", type: "rect", name: "Outer Boundary Wall", layer: "Walls", color: "#3b82f6", thickness: 8, opacity: 1, x1: 50, y1: 50, x2: 450, y2: 350, material: "Concrete M30" },
    { id: "wall-inner-1", type: "line", name: "Bedroom Partition", layer: "Walls", color: "#60a5fa", thickness: 4, opacity: 1, x1: 250, y1: 50, x2: 250, y2: 350, material: "Brick Partition" },
    { id: "door-main", type: "door", name: "Main Entrance Swivel", layer: "Doors", color: "#f59e0b", thickness: 3, opacity: 1, x1: 450, y1: 180, x2: 450, y2: 240, material: "Teak Wood" },
    { id: "window-east", type: "window", name: "East Thermal Glazing", layer: "Windows", color: "#10b981", thickness: 3, opacity: 1, x1: 120, y1: 50, x2: 180, y2: 50, material: "Double Glazing" },
    { id: "text-label-1", type: "text", name: "Master Suite Label", layer: "Text & Annotations", color: "#e2e8f0", thickness: 1, opacity: 0.8, x1: 100, y1: 200, text: "MASTER BEDROOM (4m x 4.2m)" },
    { id: "text-label-2", type: "text", name: "Living Area Label", layer: "Text & Annotations", color: "#e2e8f0", thickness: 1, opacity: 0.8, x1: 280, y1: 200, text: "LIVING LOUNGE" }
  ]);
  
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [activeDrawTool, setActiveDrawTool] = useState<string>("select");
  const [activeModifyTool, setActiveModifyTool] = useState<string>("none");
  const [activeDimensionTool, setActiveDimensionTool] = useState<string>("none");
  const [activeLayer, setActiveLayer] = useState<string>("Walls");
  const [is3DMode, setIs3DMode] = useState<boolean>(false);
  const [orthoMode, setOrthoMode] = useState<boolean>(true);
  const [gridEnabled, setGridEnabled] = useState<boolean>(true);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const [cadUnits, setCadUnits] = useState<"mm" | "cm" | "meters" | "ft" | "inches">("mm");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [drawingScale, setDrawingScale] = useState<string>("1:50");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<CADElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  
  // Custom layer list state
  const [layers, setLayers] = useState<CADLayer[]>([
    { name: "0", color: "#94a3b8", visible: true, locked: false, frozen: false, opacity: 1, lineType: "solid", lineWeight: 0.25 },
    { name: "Walls", color: "#3b82f6", visible: true, locked: false, frozen: false, opacity: 1, lineType: "solid", lineWeight: 0.5 },
    { name: "Doors", color: "#f59e0b", visible: true, locked: false, frozen: false, opacity: 1, lineType: "solid", lineWeight: 0.35 },
    { name: "Windows", color: "#10b981", visible: true, locked: false, frozen: false, opacity: 1, lineType: "solid", lineWeight: 0.35 },
    { name: "Furniture", color: "#a855f7", visible: true, locked: false, frozen: false, opacity: 1, lineType: "dashed", lineWeight: 0.18 },
    { name: "Dimensions", color: "#ef4444", visible: true, locked: false, frozen: false, opacity: 1, lineType: "dotted", lineWeight: 0.15 },
    { name: "Text & Annotations", color: "#e2e8f0", visible: true, locked: false, frozen: false, opacity: 0.9, lineType: "solid", lineWeight: 0.25 }
  ]);

  // Modals / Dialog UI status
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState<boolean>(false);
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExportDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Drawing click coordinates
  const [clickStart, setClickStart] = useState<{ x: number; y: number } | null>(null);

  // AI assistant console inside CAD Studio
  const [aiChatQuery, setAiChatQuery] = useState("");
  const [aiThinking, setAiThinking] = useState(false);
  const [aiChatHistory, setAiChatHistory] = useState<Array<{ sender: "user" | "bot"; text: string }>>([
    {
      sender: "bot",
      text: "Hello! I am your AI CAD Drafter. You can ask me to modify structures, generate components, or refactor drawings instantly. Try typing commands like: 'Increase wall thickness', 'Move door', 'Create staircase', 'Add windows', 'Generate roof', or 'Convert into duplex'!"
    }
  ]);

  // Setup undo / redo sync
  useEffect(() => {
    if (historyIndex === 0 && history[0].length === 0) {
      setHistory([elements]);
    }
  }, []);

  const pushState = (newElements: CADElement[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    setHistory([...updatedHistory, newElements]);
    setHistoryIndex(updatedHistory.length);
    setElements(newElements);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
      showNotification("Undo action applied successfully.");
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
      showNotification("Redo action reapplied.");
    }
  };

  const showNotification = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 3000);
  };

  // Create new drawing reset
  const handleNewDrawing = () => {
    pushState([]);
    setSelectedElementId(null);
    showNotification("New empty CAD layout canvas initialized.");
  };

  // Open Template drawings
  const handleOpenTemplate = () => {
    const template: CADElement[] = [
      { id: "wall-outer-1", type: "rect", name: "Outer Boundary Wall", layer: "Walls", color: "#3b82f6", thickness: 8, opacity: 1, x1: 50, y1: 50, x2: 450, y2: 350, material: "Concrete M30" },
      { id: "wall-inner-1", type: "line", name: "Bedroom Partition", layer: "Walls", color: "#60a5fa", thickness: 4, opacity: 1, x1: 250, y1: 50, x2: 250, y2: 350, material: "Brick Partition" },
      { id: "door-main", type: "door", name: "Main Entrance Swivel", layer: "Doors", color: "#f59e0b", thickness: 3, opacity: 1, x1: 450, y1: 180, x2: 450, y2: 240, material: "Teak Wood" },
      { id: "window-east", type: "window", name: "East Thermal Glazing", layer: "Windows", color: "#10b981", thickness: 3, opacity: 1, x1: 120, y1: 50, x2: 180, y2: 50, material: "Double Glazing" },
      { id: "stair-main", type: "staircase", name: "Rotary Staircase", layer: "Walls", color: "#ef4444", thickness: 2, opacity: 1, x1: 270, y1: 60, x2: 340, y2: 130, material: "Oak Steel Bracket" },
      { id: "text-label-1", type: "text", name: "Master Suite Label", layer: "Text & Annotations", color: "#e2e8f0", thickness: 1, opacity: 0.8, x1: 100, y1: 200, text: "MASTER BEDROOM (4m x 4.2m)" },
      { id: "text-label-2", type: "text", name: "Living Area Label", layer: "Text & Annotations", color: "#e2e8f0", thickness: 1, opacity: 0.8, x1: 280, y1: 200, text: "LIVING LOUNGE" }
    ];
    pushState(template);
    setSelectedElementId(null);
    showNotification("Preloaded CAD Floorplan blueprint template successfully.");
  };

  // Interactive draw on click handling
  const handleCanvasMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeDrawTool === "select") return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    let x = Math.round(e.clientX - rect.left);
    let y = Math.round(e.clientY - rect.top);

    // Apply snap to grid if active
    if (snapEnabled) {
      x = Math.round(x / 20) * 20;
      y = Math.round(y / 20) * 20;
    }

    if (!clickStart) {
      // First click: anchor starting point
      setClickStart({ x, y });
    } else {
      // Second click: create elements based on selected tool
      const newElId = `cad-el-${Date.now()}`;
      let newEl: CADElement | null = null;

      const layerColor = layers.find((l) => l.name === activeLayer)?.color || "#ffffff";

      switch (activeDrawTool) {
        case "line":
          newEl = {
            id: newElId,
            type: "line",
            name: `Line Shape ${elements.length + 1}`,
            layer: activeLayer,
            color: layerColor,
            thickness: 2,
            opacity: 1,
            x1: clickStart.x,
            y1: clickStart.y,
            x2: x,
            y2: y
          };
          break;
        case "rect":
          newEl = {
            id: newElId,
            type: "rect",
            name: `Rectangle Wall ${elements.length + 1}`,
            layer: activeLayer,
            color: layerColor,
            thickness: 4,
            opacity: 1,
            x1: Math.min(clickStart.x, x),
            y1: Math.min(clickStart.y, y),
            x2: Math.max(clickStart.x, x),
            y2: Math.max(clickStart.y, y)
          };
          break;
        case "circle":
          const radius = Math.round(Math.sqrt(Math.pow(x - clickStart.x, 2) + Math.pow(y - clickStart.y, 2)));
          newEl = {
            id: newElId,
            type: "circle",
            name: `Circular Column ${elements.length + 1}`,
            layer: activeLayer,
            color: layerColor,
            thickness: 2,
            opacity: 1,
            x1: clickStart.x,
            y1: clickStart.y,
            r: radius
          };
          break;
        case "polyline":
          newEl = {
            id: newElId,
            type: "polyline",
            name: `Polyline Corridor ${elements.length + 1}`,
            layer: activeLayer,
            color: layerColor,
            thickness: 3,
            opacity: 1,
            x1: clickStart.x,
            y1: clickStart.y,
            x2: x,
            y2: y
          };
          break;
        case "arc":
          newEl = {
            id: newElId,
            type: "arc",
            name: `Archway Trim ${elements.length + 1}`,
            layer: activeLayer,
            color: layerColor,
            thickness: 2,
            opacity: 1,
            x1: clickStart.x,
            y1: clickStart.y,
            x2: x,
            y2: y,
            r: Math.round(Math.abs(x - clickStart.x) * 1.2)
          };
          break;
        case "text":
          newEl = {
            id: newElId,
            type: "text",
            name: `Annotation Text ${elements.length + 1}`,
            layer: activeLayer,
            color: layerColor,
            thickness: 1,
            opacity: 0.9,
            x1: clickStart.x,
            y1: clickStart.y,
            text: "DRAFT TEXT NOTE"
          };
          break;
      }

      if (newEl) {
        pushState([...elements, newEl]);
        setSelectedElementId(newEl.id);
        showNotification(`Drafted ${newEl.type} element on ${newEl.layer} layer.`);
      }

      setClickStart(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    setMousePosition({ x, y });
  };

  // Selected element property editor functions
  const handleUpdateSelectedProperty = (key: keyof CADElement, val: any) => {
    if (!selectedElementId) return;
    const updated = elements.map((el) => {
      if (el.id === selectedElementId) {
        return { ...el, [key]: val };
      }
      return el;
    });
    pushState(updated);
  };

  const handleDeleteSelectedElement = () => {
    if (!selectedElementId) return;
    const filtered = elements.filter((el) => el.id !== selectedElementId);
    pushState(filtered);
    setSelectedElementId(null);
    showNotification("Deleted selected CAD element.");
  };

  // Modify tools simulation
  const applyModifyTool = (tool: string) => {
    if (!selectedElementId) {
      showNotification("Please select a CAD element to modify first.");
      return;
    }
    setActiveModifyTool(tool);
    
    const selected = elements.find((el) => el.id === selectedElementId);
    if (!selected) return;

    let updated = [...elements];
    switch (tool) {
      case "copy":
        const copyId = `cad-el-copy-${Date.now()}`;
        const copiedEl: CADElement = {
          ...selected,
          id: copyId,
          name: `${selected.name} (Copy)`,
          x1: selected.x1 + 40,
          y1: selected.y1 + 40,
          x2: selected.x2 ? selected.x2 + 40 : undefined,
          y2: selected.y2 ? selected.y2 + 40 : undefined
        };
        updated.push(copiedEl);
        setSelectedElementId(copyId);
        showNotification("Duplicated element with 40mm axis displacement.");
        break;
      case "rotate":
        updated = elements.map((el) => {
          if (el.id === selectedElementId) {
            return { ...el, rotation: ((el.rotation || 0) + 90) % 360 };
          }
          return el;
        });
        showNotification("Rotated selected layout element 90 degrees clockwise.");
        break;
      case "mirror":
        updated = elements.map((el) => {
          if (el.id === selectedElementId) {
            // Horizontal mirror within normal coordinate space
            const deltaX = (el.x2 || el.x1) - el.x1;
            return { 
              ...el, 
              x1: Math.max(50, 400 - el.x1),
              x2: el.x2 ? Math.max(50, 400 - el.x2) : undefined
            };
          }
          return el;
        });
        showNotification("Mirrored selected design elements along vertical axis.");
        break;
      case "scale":
        updated = elements.map((el) => {
          if (el.id === selectedElementId) {
            return { ...el, scale: (el.scale || 1) * 1.25 };
          }
          return el;
        });
        showNotification("Scaled shape element up by 1.25x.");
        break;
      case "erase":
        updated = elements.filter((el) => el.id !== selectedElementId);
        setSelectedElementId(null);
        showNotification("Erased target drawing vectors.");
        break;
      default:
        showNotification(`Applied CAD tool parameter optimization: ${tool.toUpperCase()}`);
        break;
    }

    pushState(updated);
    setTimeout(() => setActiveModifyTool("none"), 1000);
  };

  // Dimension tools simulation
  const applyDimensionTool = (tool: string) => {
    setActiveDimensionTool(tool);
    showNotification(`Dimension Tool active: ${tool.toUpperCase()}. Click two node coordinates to register dimension bounds.`);
    setTimeout(() => setActiveDimensionTool("none"), 1500);
  };

  // Layer Manager logic
  const handleCreateLayer = () => {
    const layerName = prompt("Enter new CAD Layer Name:", `Layer_${layers.length}`);
    if (!layerName) return;
    if (layers.some((l) => l.name.toLowerCase() === layerName.toLowerCase())) {
      showNotification("Layer already exists.");
      return;
    }
    const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#ec4899", "#06b6d4"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    setLayers([
      ...layers,
      {
        name: layerName,
        color: randomColor,
        visible: true,
        locked: false,
        frozen: false,
        opacity: 1,
        lineType: "solid",
        lineWeight: 0.25
      }
    ]);
    setActiveLayer(layerName);
    showNotification(`Created new drawing Layer: "${layerName}"`);
  };

  const toggleLayerVisibility = (name: string) => {
    setLayers(layers.map((l) => l.name === name ? { ...l, visible: !l.visible } : l));
  };

  const toggleLayerLock = (name: string) => {
    setLayers(layers.map((l) => l.name === name ? { ...l, locked: !l.locked } : l));
  };

  const toggleLayerFreeze = (name: string) => {
    setLayers(layers.map((l) => l.name === name ? { ...l, frozen: !l.frozen } : l));
  };

  // AI assistant simulation engine
  const handleAiChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiChatQuery.trim()) return;

    const userQuery = aiChatQuery;
    setAiChatQuery("");
    setAiThinking(true);

    const updatedHistory = [...aiChatHistory, { sender: "user" as const, text: userQuery }];
    setAiChatHistory(updatedHistory);

    setTimeout(() => {
      let botResponse = "";
      let modifiedElements = [...elements];

      const q = userQuery.toLowerCase();

      if (q.includes("thickness") || q.includes("wall")) {
        modifiedElements = elements.map((el) => {
          if (el.layer === "Walls") {
            return { ...el, thickness: el.thickness * 1.5 };
          }
          return el;
        });
        botResponse = "AI SUCCESS: Scanned drawing coordinates and found 2 wall layers. Increased concrete density and structural thickness parameter from 8mm to 12mm across all boundary structures.";
      } else if (q.includes("door")) {
        // Move or add doors
        modifiedElements = elements.map((el) => {
          if (el.type === "door") {
            return { ...el, x1: el.x1 - 50, x2: el.x2 ? el.x2 - 50 : undefined };
          }
          return el;
        });
        botResponse = "AI SUCCESS: Relocated 'Main Entrance Swivel' door vector 50mm leftward to clear corner clearance radius and adhere to Vastu spatial regulations.";
      } else if (q.includes("staircase") || q.includes("stair")) {
        const newStair: CADElement = {
          id: `stair-ai-${Date.now()}`,
          type: "staircase",
          name: "AI Generated Staircase",
          layer: "Walls",
          color: "#ec4899",
          thickness: 2,
          opacity: 1,
          x1: 270,
          y1: 200,
          x2: 340,
          y2: 270,
          material: "Precast Concrete Treads"
        };
        modifiedElements.push(newStair);
        botResponse = "AI SUCCESS: Calculated load levels and generated a dual-landing precast concrete staircase in the Southeast zone of the living room lounge.";
      } else if (q.includes("window")) {
        const newWindow: CADElement = {
          id: `window-ai-${Date.now()}`,
          type: "window",
          name: "AI Added Ventilation Window",
          layer: "Windows",
          color: "#10b981",
          thickness: 3,
          opacity: 1,
          x1: 50,
          y1: 150,
          x2: 50,
          y2: 210,
          material: "Acoustic Low-E Glass"
        };
        modifiedElements.push(newWindow);
        botResponse = "AI SUCCESS: Scanned dark orientation zones and added an 'Acoustic Low-E' thermal window panel on the West facade for sunset natural illumination.";
      } else if (q.includes("roof") || q.includes("ceiling")) {
        const newRoof: CADElement = {
          id: `roof-ai-${Date.now()}`,
          type: "roof",
          name: "Solar Slanted Roof Slab",
          layer: "Walls",
          color: "#f59e0b",
          thickness: 4,
          opacity: 0.9,
          x1: 50,
          y1: 50,
          x2: 450,
          y2: 50,
          material: "Reinforced Polycarbonate"
        };
        modifiedElements.push(newRoof);
        botResponse = "AI SUCCESS: Designed a slanted solar-receptive roof truss slab with 12-degree drainage pitch to maximize runoff efficiency.";
      } else if (q.includes("duplex")) {
        // Generate high performance upper story coordinates
        const firstFloorLabels: CADElement[] = [
          { id: "floor-lbl-1", type: "text", name: "Floor Indicator", layer: "Text & Annotations", color: "#f59e0b", thickness: 1, opacity: 1, x1: 60, y1: 75, text: "LEVEL 02 (UPPER DUPLEX CORE)" },
          { id: "wall-duplex-1", type: "rect", name: "Upper Floor Master Bed", layer: "Walls", color: "#3b82f6", thickness: 6, opacity: 0.9, x1: 250, y1: 50, x2: 450, y2: 200, material: "AAC Light Blocks" }
        ];
        modifiedElements = [...elements, ...firstFloorLabels];
        botResponse = "AI SUCCESS: Converted layout plan to a Multi-story Duplex structure! Cloned load columns, injected AAC Lightweight blocks to preserve lower soil load capacity, and labeled upper living zones.";
      } else {
        botResponse = "AI PROCESS: CAD coordinates analyzed. Performed design optimization audits. All alignment anchors are locked to municipal bylaws grid constraints.";
      }

      pushState(modifiedElements);
      setAiChatHistory([...updatedHistory, { sender: "bot", text: botResponse }]);
      setAiThinking(false);
      showNotification("AI automated CAD edit applied.");
    }, 1500);
  };

  // File Import Simulator
  const triggerFileImport = (format: string) => {
    setImportModalOpen(false);
    showNotification(`Successfully parsed external ${format} CAD vectors. Initializing coordinates onto active layers...`);
    handleOpenTemplate(); // load a beautiful rich template layout
  };

  // File Export Simulator
  const triggerFileExport = (format: string) => {
    setExportModalOpen(false);
    showNotification(`Generating download bundle. Raw vector payload compiled as civil_design.${format.toLowerCase()}.`);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      
      {/* 1. CAD SYSTEM TITLE BAR AND NOTIFICATION HUB */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap justify-between items-center gap-4 relative overflow-hidden backdrop-blur">
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400">
            <Layers className="w-5 h-5 animate-pulse" />
          </div>
          <div className="text-left">
            <h2 className="text-lg font-bold text-white font-sans tracking-tight">Professional CAD Studio Workspace</h2>
            <p className="text-[10px] text-slate-400 font-mono">STANDALONE ARCHITECTURAL LAYOUT & VECTOR DRAFTING SUITE</p>
          </div>
        </div>

        {/* FEEDBACK BANNER */}
        {feedbackMsg && (
          <div className="px-3.5 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs rounded-lg font-mono flex items-center gap-2 animate-bounce">
            <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Toggle Mode indicator */}
        <div className="flex gap-2">
          <button
            onClick={() => setIs3DMode(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
              !is3DMode 
                ? "bg-blue-600 text-white font-bold" 
                : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            2D Ortho Plan
          </button>
          <button
            onClick={() => setIs3DMode(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
              is3DMode 
                ? "bg-orange-600 text-white font-bold" 
                : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            3D Extrusion View
          </button>
        </div>
      </div>

      {/* 2. TOP TOOLBAR: CAD SYSTEM COMMANDS */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 flex flex-wrap gap-1.5 items-center justify-between shadow-lg">
        <div className="flex flex-wrap gap-1.5">
          <button 
            onClick={handleNewDrawing} 
            title="Create New Drawing"
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg hover:text-white border border-slate-800 flex items-center gap-1.5 text-xs font-medium"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            New
          </button>
          <button 
            onClick={handleOpenTemplate} 
            title="Open Existing Floorplan Template"
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg hover:text-white border border-slate-800 flex items-center gap-1.5 text-xs font-medium"
          >
            <FolderOpen className="w-4 h-4 text-blue-400" />
            Open
          </button>
          <button 
            onClick={() => showNotification("CAD State stored in secure local cloud registry.")} 
            title="Save Drawing to Cloud"
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg hover:text-white border border-slate-800 flex items-center gap-1.5 text-xs font-medium"
          >
            <Save className="w-4 h-4 text-yellow-400" />
            Save
          </button>
          <button 
            onClick={() => {
              const name = prompt("Enter CAD Project name:", "Metropolitan Design v2");
              if (name) showNotification(`Drawing successfully renamed and saved as "${name}".`);
            }}
            title="Save CAD Drawing As..."
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg hover:text-white border border-slate-800 text-xs"
          >
            Save As
          </button>
          <button 
            onClick={() => setImportModalOpen(true)} 
            title="Import CAD Files (DWG, DXF, IFC)"
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg hover:text-white border border-slate-800 flex items-center gap-1 text-xs"
          >
            <Upload className="w-4 h-4 text-purple-400" />
            Import
          </button>
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)} 
              title="Export Current Canvas"
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg hover:text-white border border-slate-800 flex items-center gap-1.5 text-xs font-medium"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Export</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            {exportDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-52 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-30 py-1.5 overflow-hidden">
                <div className="px-3 py-1.5 text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider border-b border-slate-900">
                  Select CAD Format
                </div>
                {[
                  { format: "DWG", label: "AutoCAD Drawing (DWG)" },
                  { format: "DXF", label: "Drawing Exchange (DXF)" },
                  { format: "SVG", label: "Scalable Vectors (SVG)" },
                  { format: "IFC", label: "BIM Exchange Model (IFC)" }
                ].map((item) => (
                  <button
                    key={item.format}
                    onClick={() => {
                      triggerFileExport(item.format);
                      setExportDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-xs text-left text-slate-300 hover:text-white hover:bg-slate-900 transition-colors flex items-center justify-between font-mono"
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] text-indigo-400 font-mono font-bold">.{item.format.toLowerCase()}</span>
                  </button>
                ))}
                <div className="border-t border-slate-900 my-1"></div>
                <button
                  onClick={() => {
                    setExportModalOpen(true);
                    setExportDropdownOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-[10px] text-left text-indigo-400 hover:text-indigo-300 transition-colors font-mono font-medium flex items-center justify-between"
                >
                  <span>More 3D formats...</span>
                  <span>&rarr;</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-1">
          <button 
            onClick={handleUndo} 
            disabled={historyIndex <= 0}
            title="Undo Layout Action"
            className="p-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 hover:text-white rounded-lg border border-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={handleRedo} 
            disabled={historyIndex >= history.length - 1}
            title="Redo Layout Action"
            className="p-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 hover:text-white rounded-lg border border-slate-800"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => {
              window.print();
            }} 
            title="Print Drawing / Plot PDF"
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setShareModalOpen(true)} 
            title="Share CAD Workspace link"
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setSettingsModalOpen(true)} 
            title="Workspace Plot Settings"
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE CONTAINER */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: TOOLBOX PANEL (Draw, Modify, Layers) */}
        <div className="col-span-1 md:col-span-3 space-y-6 flex flex-col">
          
          {/* DRAW TOOLS */}
          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl text-left space-y-3">
            <span className="text-[11px] font-mono tracking-wider text-slate-500 uppercase font-bold block">Drafting Toolbox</span>
            
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "select", label: "Select Cursor" },
                { id: "line", label: "Line (L)" },
                { id: "polyline", label: "Polyline (PL)" },
                { id: "rect", label: "Rectangle (REC)" },
                { id: "circle", label: "Circle (C)" },
                { id: "arc", label: "Arc (A)" },
                { id: "text", label: "Text Annotation" }
              ].map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => {
                    setActiveDrawTool(tool.id);
                    setClickStart(null);
                    showNotification(`Draft tool changed to: ${tool.label.toUpperCase()}`);
                  }}
                  className={`p-2 rounded-lg text-[11px] text-left transition-all border font-medium ${
                    activeDrawTool === tool.id
                      ? "bg-blue-600/10 border-blue-500 text-blue-400"
                      : "bg-slate-950/40 border-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  {tool.label}
                </button>
              ))}
            </div>

            {/* Extra Tools lists for visual depth */}
            <div className="pt-2 border-t border-slate-800/60 space-y-2">
              <span className="text-[9px] font-mono text-slate-500 block">UNAVAILABLE SHAPES (PRO VERSION)</span>
              <div className="flex flex-wrap gap-1">
                {["Ellipse", "Polygon", "Spline", "Point", "Hatch", "Leader", "Table", "Cloud"].map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 bg-slate-950 text-slate-600 rounded font-mono border border-slate-950">{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* MODIFY TOOLS */}
          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl text-left space-y-3">
            <span className="text-[11px] font-mono tracking-wider text-slate-500 uppercase font-bold block">Modify Operators</span>
            
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "copy", label: "Copy (CO)" },
                { id: "rotate", label: "Rotate (RO)" },
                { id: "mirror", label: "Mirror (MI)" },
                { id: "scale", label: "Scale (SC)" },
                { id: "erase", label: "Erase Vector" }
              ].map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => applyModifyTool(tool.id)}
                  className={`p-2 rounded-lg text-[11px] text-left transition-all border ${
                    activeModifyTool === tool.id
                      ? "bg-yellow-500/20 border-yellow-500 text-yellow-400"
                      : "bg-slate-950/40 border-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  {tool.label}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800/60 space-y-2">
              <span className="text-[9px] font-mono text-slate-500 block">ADVANCED VECTORS (PRO)</span>
              <div className="flex flex-wrap gap-1">
                {["Move", "Trim", "Extend", "Offset", "Fillet", "Chamfer", "Array", "Stretch", "Explode", "Join", "Align", "Break"].map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 bg-slate-950 text-slate-600 rounded font-mono border border-slate-950">{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* DIMENSIONS */}
          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl text-left space-y-3">
            <span className="text-[11px] font-mono tracking-wider text-slate-500 uppercase font-bold block">Dimension Tools</span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "linear", label: "Linear" },
                { id: "angular", label: "Angular" },
                { id: "radius", label: "Radius" },
                { id: "diameter", label: "Diameter" }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => applyDimensionTool(t.id)}
                  className={`p-1.5 rounded-lg text-[11px] text-left transition-all border ${
                    activeDimensionTool === t.id
                      ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse"
                      : "bg-slate-950/40 border-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* LAYER MANAGER */}
          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl text-left space-y-3 flex-1 min-h-[220px] flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-mono tracking-wider text-slate-500 uppercase font-bold">Layer Manager</span>
                <button 
                  onClick={handleCreateLayer}
                  className="p-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
                  title="Create New Layer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                {layers.map((layer) => (
                  <div 
                    key={layer.name} 
                    className={`flex items-center justify-between p-1.5 rounded-lg text-[11px] border transition-colors ${
                      activeLayer === layer.name 
                        ? "bg-slate-950 border-slate-800 text-white" 
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <button 
                      onClick={() => setActiveLayer(layer.name)}
                      className="flex items-center gap-2 font-mono truncate flex-1 text-left"
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: layer.color }} />
                      <span className="truncate">{layer.name}</span>
                    </button>
                    
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => {
                          toggleLayerVisibility(layer.name);
                          showNotification(`${layer.visible ? "Hid" : "Revealed"} layer "${layer.name}"`);
                        }} 
                        title={layer.visible ? "Hide Layer" : "Show Layer"}
                        className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                          layer.visible ? "text-blue-400" : "text-slate-600 hover:text-slate-400"
                        }`}
                      >
                        {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button 
                        onClick={() => {
                          toggleLayerLock(layer.name);
                          showNotification(`Layer "${layer.name}" ${layer.locked ? "unlocked" : "locked"}`);
                        }} 
                        title={layer.locked ? "Unlock Layer" : "Lock Layer"}
                        className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                          layer.locked ? "text-amber-500" : "text-slate-600 hover:text-slate-400"
                        }`}
                      >
                        {layer.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: CAD GRAPHIC INTERACTIVE STAGE */}
        <div className="col-span-1 md:col-span-6 flex flex-col space-y-4">
          
          <div className="bg-slate-950 border border-slate-800 rounded-2xl relative overflow-hidden flex-1 min-h-[460px] flex flex-col justify-between">
            {/* HUD OVERLAY INDICATOR */}
            <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-800 rounded-lg p-2 flex items-center gap-4 z-10 text-[10px] font-mono text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>GRID: {gridEnabled ? "ACTIVE" : "OFF"}</span>
              </div>
              <div>UNIT: <span className="font-bold text-blue-400 uppercase">{cadUnits}</span></div>
              <div>SCALE: <span className="font-bold text-orange-400">{drawingScale}</span></div>
            </div>

            <div className="absolute top-3 right-3 bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 flex items-center gap-1 z-10">
              <button 
                onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))} 
                title="Zoom Out"
                className="p-1 text-slate-400 hover:text-white font-mono text-xs font-bold"
              >
                -
              </button>
              <span className="text-[10px] text-slate-300 px-1 font-mono">{zoomLevel}%</span>
              <button 
                onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))} 
                title="Zoom In"
                className="p-1 text-slate-400 hover:text-white font-mono text-xs font-bold"
              >
                +
              </button>
            </div>

            {/* INTERACTIVE CAD VIEWPORT */}
            <div 
              ref={canvasContainerRef}
              className="flex-1 w-full bg-slate-950 cursor-crosshair relative flex items-center justify-center p-4 overflow-hidden"
              style={{ backgroundImage: gridEnabled ? "radial-gradient(#1e293b 1.5px, transparent 1.5px)" : "none", backgroundSize: "20px 20px" }}
            >
              {!is3DMode ? (
                // 2D CAD CANVAS VIEW (SVG based precision drafting)
                <svg 
                  className="w-full h-[400px] border border-slate-900 rounded-xl"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                >
                  {/* Drawing guides */}
                  {clickStart && (
                    <line 
                      x1={clickStart.x} 
                      y1={clickStart.y} 
                      x2={mousePosition.x} 
                      y2={mousePosition.y} 
                      stroke="#ef4444" 
                      strokeDasharray="4 4"
                      strokeWidth={1.5} 
                    />
                  )}

                  {/* Render CAD active vector elements */}
                  {elements.map((el) => {
                    const lSettings = layers.find((l) => l.name === el.layer);
                    if (lSettings && !lSettings.visible) return null;

                    const strokeColor = el.color;
                    const strokeWidth = el.thickness;
                    const elementOpacity = el.opacity;
                    
                    const isSelected = selectedElementId === el.id;
                    const selectionBorderColor = "#ef4444";

                    return (
                      <g 
                        key={el.id} 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeDrawTool === "select") {
                            setSelectedElementId(el.id);
                            showNotification(`Selected ${el.name} Vector for inspection.`);
                          }
                        }}
                        className="cursor-pointer group"
                      >
                        {/* Selector indicator bounds */}
                        {isSelected && (
                          <rect 
                            x={(el.x1 || 0) - 8} 
                            y={(el.y1 || 0) - 8} 
                            width={el.x2 ? (el.x2 - el.x1 + 16) : (el.r ? el.r * 2 + 16 : 16)} 
                            height={el.y2 ? (el.y2 - el.y1 + 16) : (el.r ? el.r * 2 + 16 : 16)} 
                            fill="none" 
                            stroke={selectionBorderColor} 
                            strokeWidth={1} 
                            strokeDasharray="2 2"
                          />
                        )}

                        {/* Rectangle element rendering */}
                        {el.type === "rect" && (
                          <rect 
                            x={el.x1} 
                            y={el.y1} 
                            width={(el.x2 || 100) - el.x1} 
                            height={(el.y2 || 100) - el.y1} 
                            fill="none" 
                            stroke={strokeColor} 
                            strokeWidth={strokeWidth} 
                            opacity={elementOpacity}
                          />
                        )}

                        {/* Line element rendering */}
                        {el.type === "line" && (
                          <line 
                            x1={el.x1} 
                            y1={el.y1} 
                            x2={el.x2 || el.x1} 
                            y2={el.y2 || el.y1} 
                            stroke={strokeColor} 
                            strokeWidth={strokeWidth} 
                            opacity={elementOpacity}
                          />
                        )}

                        {/* Circle element rendering */}
                        {el.type === "circle" && (
                          <circle 
                            cx={el.x1} 
                            cy={el.y1} 
                            r={el.r || 40} 
                            fill="none" 
                            stroke={strokeColor} 
                            strokeWidth={strokeWidth} 
                            opacity={elementOpacity}
                          />
                        )}

                        {/* Door element rendering */}
                        {el.type === "door" && (
                          <g opacity={elementOpacity}>
                            <line x1={el.x1} y1={el.y1} x2={el.x1} y2={el.y2 || el.y1} stroke={strokeColor} strokeWidth={strokeWidth + 2} />
                            <path 
                              d={`M ${el.x1} ${el.y1} A ${(el.y2 || 0) - el.y1} ${(el.y2 || 0) - el.y1} 0 0 1 ${el.x2} ${el.y2}`} 
                              fill="none" 
                              stroke={strokeColor} 
                              strokeWidth={1.5} 
                              strokeDasharray="2 2" 
                            />
                          </g>
                        )}

                        {/* Window element rendering */}
                        {el.type === "window" && (
                          <g opacity={elementOpacity}>
                            <rect x={el.x1} y={el.y1 - 4} width={(el.x2 || 100) - el.x1} height={8} fill="#020617" stroke={strokeColor} strokeWidth={2} />
                            <line x1={el.x1} y1={el.y1} x2={el.x2 || el.x1} y2={el.y1} stroke={strokeColor} strokeWidth={1} />
                          </g>
                        )}

                        {/* Staircase rendering */}
                        {el.type === "staircase" && (
                          <g opacity={elementOpacity} stroke={strokeColor} strokeWidth={strokeWidth} fill="none">
                            <rect x={el.x1} y={el.y1} width={(el.x2 || 100) - el.x1} height={(el.y2 || 100) - el.y1} />
                            {/* Inner treads */}
                            {[...Array(6)].map((_, i) => {
                              const stepX = el.x1 + ((el.x2 || 100) - el.x1) * (i / 6);
                              return <line key={i} x1={stepX} y1={el.y1} x2={stepX} y2={el.y2 || el.y1} />;
                            })}
                          </g>
                        )}

                        {/* Slanted Roof Truss rendering */}
                        {el.type === "roof" && (
                          <g opacity={elementOpacity} stroke={strokeColor} strokeWidth={strokeWidth} fill="none">
                            <polygon points={`${el.x1},${el.y1} ${(el.x1 + (el.x2 || 0))/2},${el.y1 - 30} ${el.x2},${el.y1}`} />
                            <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y1} />
                          </g>
                        )}

                        {/* Text element rendering */}
                        {el.type === "text" && (
                          <text 
                            x={el.x1} 
                            y={el.y1} 
                            fill={strokeColor} 
                            fontSize={10} 
                            fontFamily="monospace"
                            fontWeight="bold"
                            opacity={elementOpacity}
                          >
                            {el.text}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              ) : (
                // 3D ISOMETRIC EXTRUSION VIEWER (Precision CAD Simulation Mode)
                <div className="w-full h-[400px] bg-slate-950/90 border border-slate-900 rounded-xl relative flex flex-col items-center justify-center p-6 text-left">
                  <div className="absolute top-4 right-4 flex gap-1.5 z-10">
                    <span className="text-[10px] font-mono bg-orange-600/20 border border-orange-500/30 text-orange-400 px-2 py-0.5 rounded-md uppercase">Extrusion active</span>
                    <span className="text-[10px] font-mono bg-blue-600/20 border border-blue-500/30 text-blue-400 px-2 py-0.5 rounded-md uppercase">3D Render</span>
                  </div>

                  {/* High quality visual representation of 3D floor plan */}
                  <div className="relative w-72 h-72 transform rotate-x-12 rotate-y-12 skew-x-3 transition-transform duration-500 flex items-center justify-center">
                    
                    {/* Floor slab */}
                    <div className="absolute w-60 h-60 bg-slate-800/40 border border-slate-700/60 rounded shadow-2xl transform scale-100" />
                    
                    {/* Isometric extruded wall segments */}
                    {elements.map((el, idx) => {
                      const lSettings = layers.find((l) => l.name === el.layer);
                      if (lSettings && !lSettings.visible) return null;
                      if (el.layer !== "Walls" && el.type !== "rect" && el.type !== "staircase") return null;
                      return (
                        <div 
                          key={el.id} 
                          className="absolute border border-blue-500/30 bg-blue-600/10 shadow-lg"
                          style={{
                            width: "120px",
                            height: "80px",
                            left: `${20 + idx * 10}px`,
                            top: `${40 + idx * 5}px`,
                            transform: "rotateY(-30deg) rotateX(15deg)",
                            borderLeft: "2px solid #3b82f6",
                            borderTop: "2px solid #60a5fa"
                          }}
                        >
                          <span className="absolute bottom-1 right-2 text-[8px] font-mono text-blue-400">{el.name} (Z-3.2m)</span>
                        </div>
                      );
                    })}

                    {/* Stairs extrusions */}
                    {elements.some((el) => {
                      if (el.type !== "staircase") return false;
                      const lSettings = layers.find((l) => l.name === el.layer);
                      return !lSettings || lSettings.visible;
                    }) && (
                      <div className="absolute bg-pink-600/20 border border-pink-500/30 w-24 h-24 transform rotateY(-30deg) rotateX(15deg) left-28 top-20 flex flex-col justify-between">
                        <div className="w-full h-1/4 bg-pink-500/35 border-b border-pink-400" />
                        <div className="w-full h-1/4 bg-pink-500/25 border-b border-pink-400" />
                        <div className="w-full h-1/4 bg-pink-500/15 border-b border-pink-400" />
                      </div>
                    )}

                    {/* Ground grid ticks */}
                    <div className="absolute w-64 h-64 border border-dashed border-slate-800/50 pointer-events-none rounded" />
                  </div>

                  <div className="mt-4 space-y-1.5 text-center z-10">
                    <p className="text-xs font-bold text-white">Extruded 3D Architectural Section</p>
                    <p className="text-[10px] text-slate-500 font-mono">X: 450mm | Y: 350mm | Z (Ceiling Height): 3.2m Extrusion Profile</p>
                    <div className="flex justify-center gap-1.5 pt-1">
                      {["Extrude", "Revolve", "Sweep", "Boolean", "Push Pull", "Orbit"].map((tool) => (
                        <button
                          key={tool}
                          onClick={() => showNotification(`Modified 3D space with ${tool.toUpperCase()} operation.`)}
                          className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded text-[9px] font-mono"
                        >
                          {tool}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* BOTTOM STATUS GRID & SNAP BAR */}
            <div className="bg-slate-900/90 border-t border-slate-800 p-2.5 flex flex-wrap justify-between items-center text-[10px] font-mono text-slate-400 gap-2 relative z-10">
              <div className="flex items-center gap-3">
                <span className="text-slate-500">CURSOR: <span className="font-bold text-slate-300">X: {mousePosition.x}px | Y: {mousePosition.y}px</span></span>
                <span className="hidden sm:inline text-slate-700">|</span>
                <button 
                  onClick={() => setGridEnabled(!gridEnabled)}
                  className={`px-1.5 py-0.5 rounded ${gridEnabled ? "bg-blue-600/15 text-blue-400 border border-blue-500/20" : "bg-slate-950 text-slate-600"}`}
                >
                  GRID (F7)
                </button>
                <button 
                  onClick={() => setSnapEnabled(!snapEnabled)}
                  className={`px-1.5 py-0.5 rounded ${snapEnabled ? "bg-emerald-600/15 text-emerald-400 border border-emerald-500/20" : "bg-slate-950 text-slate-600"}`}
                >
                  SNAP (F9)
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-slate-500">
                  <span>UNITS:</span>
                  <select 
                    value={cadUnits} 
                    onChange={(e: any) => setCadUnits(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-300 rounded p-0.5 font-mono text-[9px]"
                  >
                    <option value="mm">MM</option>
                    <option value="cm">CM</option>
                    <option value="meters">Meters</option>
                    <option value="ft">Feet</option>
                    <option value="inches">Inches</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 text-slate-500">
                  <span>SCALE:</span>
                  <select 
                    value={drawingScale} 
                    onChange={(e: any) => setDrawingScale(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-300 rounded p-0.5 font-mono text-[9px]"
                  >
                    <option value="1:1">1:1</option>
                    <option value="1:10">1:10</option>
                    <option value="1:50">1:50</option>
                    <option value="1:100">1:100</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* AI ASSISTANT CONSOLE - MODIFIES CAD DRAWING INSTANTLY */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-orange-400 shrink-0" />
                <div className="text-left">
                  <h4 className="text-xs font-bold text-white">AI CAD Co-Pilot Panel</h4>
                  <p className="text-[9px] text-slate-500 font-mono">DRAFT GENERATOR & ALIGNMENT CRITERIA</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/25 text-[9px] text-orange-400 font-mono">
                <Sparkles className="w-2.5 h-2.5 animate-spin" />
                Active Agent
              </span>
            </div>

            {/* Scrolling chat window */}
            <div className="bg-slate-950/60 border border-slate-950 p-4 rounded-xl space-y-3 h-[140px] overflow-y-auto text-xs leading-relaxed font-light scrollbar-thin">
              {aiChatHistory.map((msg, i) => (
                <div key={i} className={`flex gap-2 text-left ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.sender === "bot" && <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] shrink-0 font-bold text-orange-400">AI</span>}
                  <div className={`p-2.5 rounded-xl max-w-[85%] ${msg.sender === "user" ? "bg-blue-600 text-white rounded-br-none" : "bg-slate-900 text-slate-300 rounded-bl-none"}`}>
                    <p>{msg.text}</p>
                  </div>
                </div>
              ))}
              {aiThinking && (
                <div className="flex gap-2 text-left items-center text-slate-500 text-[10px] font-mono pl-7 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                  AI compiling layout vectors...
                </div>
              )}
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { label: "Increase Wall Thickness", query: "Increase wall thickness" },
                { label: "Move Main Door", query: "Move door" },
                { label: "Create Staircase", query: "Create staircase" },
                { label: "Add Windows", query: "Add windows" },
                { label: "Generate Slanted Roof", query: "Generate roof" },
                { label: "Convert to Duplex", query: "Convert into duplex" }
              ].map((pill) => (
                <button
                  key={pill.label}
                  onClick={() => {
                    setAiChatQuery(pill.query);
                  }}
                  className="px-2.5 py-1 bg-slate-950 border border-slate-900 text-slate-400 hover:text-white rounded-lg text-[10px] font-mono transition-colors"
                >
                  + {pill.label}
                </button>
              ))}
            </div>

            {/* Query input */}
            <form onSubmit={handleAiChatSubmit} className="flex gap-2">
              <input
                type="text"
                value={aiChatQuery}
                onChange={(e) => setAiChatQuery(e.target.value)}
                placeholder="Ask AI: e.g. 'Add windows' or 'Increase wall thickness'..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 placeholder-slate-600"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 shadow-lg shadow-orange-500/15"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: CAD PROPERTIES INSPECTOR & INFO PANEL */}
        <div className="col-span-1 md:col-span-3 space-y-6 text-left">
          
          <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl space-y-4">
            <span className="text-[11px] font-mono tracking-wider text-slate-500 uppercase font-bold block">Properties Inspector</span>
            
            {selectedElementId ? (
              (() => {
                const el = elements.find((e) => e.id === selectedElementId);
                if (!el) return <p className="text-xs text-slate-500 italic">No selection.</p>;
                return (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase block">Selected Object ID</label>
                      <input 
                        type="text" 
                        readOnly
                        value={el.id}
                        className="w-full bg-slate-950 border border-slate-900 text-slate-500 rounded p-2 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase block">Name</label>
                      <input 
                        type="text" 
                        value={el.name}
                        onChange={(e) => handleUpdateSelectedProperty("name", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded p-2 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase block">Coordinate X1</label>
                        <input 
                          type="number" 
                          value={el.x1}
                          onChange={(e) => handleUpdateSelectedProperty("x1", parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded p-1.5 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase block">Coordinate Y1</label>
                        <input 
                          type="number" 
                          value={el.y1}
                          onChange={(e) => handleUpdateSelectedProperty("y1", parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded p-1.5 text-xs font-mono"
                        />
                      </div>
                    </div>

                    {el.x2 !== undefined && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-400 uppercase block">Coordinate X2</label>
                          <input 
                            type="number" 
                            value={el.x2}
                            onChange={(e) => handleUpdateSelectedProperty("x2", parseInt(e.target.value) || 0)}
                            className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded p-1.5 text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-400 uppercase block">Coordinate Y2</label>
                          <input 
                            type="number" 
                            value={el.y2}
                            onChange={(e) => handleUpdateSelectedProperty("y2", parseInt(e.target.value) || 0)}
                            className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded p-1.5 text-xs font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {el.r !== undefined && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase block">Radius (mm)</label>
                        <input 
                          type="number" 
                          value={el.r}
                          onChange={(e) => handleUpdateSelectedProperty("r", parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded p-2 text-xs font-mono"
                        />
                      </div>
                    )}

                    {el.text !== undefined && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase block">Text String</label>
                        <input 
                          type="text" 
                          value={el.text}
                          onChange={(e) => handleUpdateSelectedProperty("text", e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded p-2 text-xs"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase block">Material Assignment</label>
                      <select
                        value={el.material || "Concrete M30"}
                        onChange={(e) => handleUpdateSelectedProperty("material", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded p-2 text-xs"
                      >
                        <option value="Concrete M30">Concrete M30 Grade</option>
                        <option value="Brick Partition">Silt Clay Bricks</option>
                        <option value="AAC Light Blocks">Autoclaved Aerated Block</option>
                        <option value="Teak Wood">Polished Teak</option>
                        <option value="Double Glazing">Insulated Dual Glass</option>
                        <option value="Structural Steel">Recycled Steel Grade 50</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase block">Vector Color</label>
                        <input 
                          type="color" 
                          value={el.color}
                          onChange={(e) => handleUpdateSelectedProperty("color", e.target.value)}
                          className="w-full h-8 bg-slate-950 border border-slate-800 rounded cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase block">Thickness</label>
                        <select
                          value={el.thickness}
                          onChange={(e) => handleUpdateSelectedProperty("thickness", parseInt(e.target.value))}
                          className="w-full h-8 bg-slate-950 border border-slate-800 text-slate-300 rounded p-1 text-xs"
                        >
                          <option value={1}>1px Thin</option>
                          <option value={2}>2px Normal</option>
                          <option value={4}>4px Heavy</option>
                          <option value={6}>6px Column</option>
                          <option value={8}>8px Boundary</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button 
                        onClick={handleDeleteSelectedElement}
                        className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Erase CAD Object
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-6 space-y-2">
                <MousePointer className="w-8 h-8 text-slate-600 mx-auto animate-bounce" />
                <p className="text-xs text-slate-400 font-light">No active CAD vector is selected.</p>
                <p className="text-[10px] text-slate-500 leading-relaxed font-mono">Set tool option to 'Select Cursor' and click any vector line or element above to load inspector metrics.</p>
              </div>
            )}
          </div>

          {/* OBJECT INFORMATION & METADATA SUMMARY */}
          <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl space-y-4 text-xs font-light text-slate-400">
            <span className="text-[11px] font-mono tracking-wider text-slate-500 uppercase font-bold block">Object Information Summary</span>
            <div className="space-y-2 font-mono text-[10px]">
              <div className="flex justify-between border-b border-slate-850 pb-1.5">
                <span>Total Entities:</span>
                <span className="font-bold text-white">{elements.length} Vectors</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-1.5">
                <span>Active Layer:</span>
                <span className="font-bold text-blue-400">{activeLayer}</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-1.5">
                <span>Viewport System:</span>
                <span className="font-bold text-emerald-400">{orthoMode ? "Orthogonal Space" : "Isometric 3D"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-1.5">
                <span>Snap Threshold:</span>
                <span className="font-bold text-white">20 mm Grid</span>
              </div>
              <div className="flex justify-between pb-1">
                <span>Coordinate Projection:</span>
                <span className="font-bold text-orange-400">WGS84 Local Grid</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================================
          MODALS / OVERLAYS PANEL
         ========================================================== */}

      {/* IMPORT MODAL */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 animate-fade-in text-left">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-white">Import CAD Geometry Payload</h3>
                <p className="text-xs text-slate-400">Select standard drawing extensions to overlay coordinates.</p>
              </div>
              <button 
                onClick={() => setImportModalOpen(false)}
                className="p-1 bg-slate-950 border border-slate-850 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {["DWG", "DXF", "PDF", "SVG", "PNG", "JPG", "IFC", "OBJ", "FBX", "GLTF"].map((format) => (
                <button
                  key={format}
                  onClick={() => triggerFileImport(format)}
                  className="p-3 bg-slate-950 border border-slate-950 hover:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-300 text-left hover:text-white flex justify-between items-center"
                >
                  <span>*.{format.toLowerCase()}</span>
                  <Plus className="w-3.5 h-3.5 text-slate-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EXPORT MODAL */}
      {exportModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 animate-fade-in text-left">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-white">Export CAD Design Suite</h3>
                <p className="text-xs text-slate-400">Compile vectors to export directly to professional platforms.</p>
              </div>
              <button 
                onClick={() => setExportModalOpen(false)}
                className="p-1 bg-slate-950 border border-slate-850 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {["DWG", "DXF", "PDF", "PNG", "JPG", "SVG", "IFC", "OBJ", "FBX", "GLTF"].map((format) => (
                <button
                  key={format}
                  onClick={() => triggerFileExport(format)}
                  className="p-3 bg-slate-950 border border-slate-950 hover:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-300 text-left hover:text-white flex justify-between items-center"
                >
                  <span>Export {format}</span>
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {shareModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 animate-fade-in text-left">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-white">Share Drafting Workspace</h3>
                <p className="text-xs text-slate-400">Generate sharing link for civil contractors.</p>
              </div>
              <button onClick={() => setShareModalOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-950 font-mono text-[10px] text-slate-400 truncate">
              https://civilgpt.com/share/cad-{Date.now()}
            </div>

            <button
              onClick={() => {
                setShareModalOpen(false);
                showNotification("Workspace share URL copied to clipboard.");
              }}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all"
            >
              Copy Session Link
            </button>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {settingsModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 animate-fade-in text-left">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-white">Plot Studio Settings</h3>
                <p className="text-xs text-slate-400">Set drawing and vector parameters.</p>
              </div>
              <button onClick={() => setSettingsModalOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Dynamic Coordinate Snapping:</span>
                <input 
                  type="checkbox" 
                  checked={snapEnabled} 
                  onChange={(e) => setSnapEnabled(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Show Background Dots:</span>
                <input 
                  type="checkbox" 
                  checked={gridEnabled} 
                  onChange={(e) => setGridEnabled(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Projection System:</span>
                <span className="font-mono text-[10px] text-slate-300">UTM Grid zone 43N</span>
              </div>
            </div>

            <button
              onClick={() => setSettingsModalOpen(false)}
              className="w-full py-2 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-white text-xs font-bold rounded-xl transition-all"
            >
              Apply Settings
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
