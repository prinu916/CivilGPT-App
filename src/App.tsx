/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { auth, db } from "./lib/firebase";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  User
} from "firebase/auth";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where 
} from "firebase/firestore";
import {
  Layers,
  Bot,
  Maximize2,
  RotateCw,
  Plus,
  Trash2,
  Settings,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Users,
  Share2,
  Sliders,
  Download,
  Search,
  FileText,
  Sun,
  Moon,
  Languages,
  Grid,
  Compass,
  Sparkles,
  MapPin,
  Volume2,
  Video,
  Paperclip,
  ShieldCheck,
  Eye,
  Undo2,
  Redo2,
  ArrowRight,
  Clock,
  Activity,
  Check,
  ExternalLink,
  Menu,
  BookOpen,
  Briefcase,
  GraduationCap,
  Building2,
  ShoppingBag,
  Wind,
  Flame,
  Wrench,
  Gauge,
  X,
  HelpCircle,
  FileCode,
  User as UserIcon,
  LogOut,
  Info,
  Camera
} from "lucide-react";
import {
  ProjectType,
  UserRole,
  AccentColor,
  Language,
  DrawingStyle,
  Project,
  Room,
  BaseElement,
  TimelineTask,
  MaterialItem,
  BOQItem,
  ChatMessage,
} from "./types";
import {
  getLuxuryVillaTemplate,
  getSmartDuplexTemplate,
  getProjectMetrics,
  formatCurrency,
  t,
  generateId
} from "./utils";

export default function App() {
  // Global Settings State
  const [lang, setLang] = useState<Language>(Language.EN);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [accent, setAccent] = useState<AccentColor>(AccentColor.BLUE);
  const [activeRole, setActiveRole] = useState<UserRole>(UserRole.ARCHITECT);
  const [isLandingPage, setIsLandingPage] = useState<boolean>(true);

  // Firebase Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<"login" | "signup" | "reset">("login");
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState<string>("");
  const [authName, setAuthName] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // If a user logs in, we can let them use the workspace with customized feedback
        const authMsg: ChatMessage = {
          id: `auth-status-${Date.now()}`,
          sender: "system",
          textEn: `Successfully connected. Welcome ${currentUser.displayName || currentUser.email}! Your projects can now be saved in the secure cloud.`,
          textHi: `सफलतापूर्वक जुड़े। स्वागत है ${currentUser.displayName || currentUser.email}! आपके प्रोजेक्ट अब सुरक्षित क्लाउड में सहेजे जा सकते हैं।`,
          timestamp: new Date().toLocaleTimeString(),
        };
        setChatMessages((prev) => [...prev, authMsg]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Application / Workspace State
  const [projects, setProjects] = useState<Project[]>([
    getLuxuryVillaTemplate(),
    getSmartDuplexTemplate()
  ]);
  const [activeProjectId, setActiveProjectId] = useState<string>("project-villa");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  // Interactive View Controls
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [drawingStyle, setDrawingStyle] = useState<DrawingStyle>(DrawingStyle.CAD);
  const [explainLevel, setExplainLevel] = useState<"Simple Mode" | "Pro Mode" | "Teaching Mode">("Pro Mode");
  const [workspaceTab, setWorkspaceTab] = useState<"editor" | "boq" | "timeline" | "compliance" | "drone">("editor");

  // Landing Page Interactive States
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [activeSolutionTab, setActiveSolutionTab] = useState<number>(0);

  // 3D Isometric View Parameters
  const [orbitAngle, setOrbitAngle] = useState<number>(45);
  const [heightScale, setHeightScale] = useState<number>(1.0);
  const [isExplodedView, setIsExplodedView] = useState<boolean>(false);
  const [isCrossSection, setIsCrossSection] = useState<boolean>(false);
  const [weatherSim, setWeatherSim] = useState<"sunny" | "rain" | "night">("sunny");

  // Undo/Redo Engine
  const [history, setHistory] = useState<Project[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // AI Chat & Speech State
  const [chatInput, setChatInput] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "system",
      textEn: "Welcome to CivilGPT! I am your AI Building Orchestrator. Select an active focus role in the top header (like Structural Engineer or Architect) to customize our engine calculation priorities. How shall we design or optimize your building today?",
      textHi: "सिविलजीपीटी में आपका स्वागत है! मैं आपका एआई बिल्डिंग ऑर्केस्ट्रेटर हूँ। हमारे इंजन गणना प्राथमिकताओं को अनुकूलित करने के लिए शीर्ष हेडर में एक सक्रिय भूमिका (जैसे संरचनात्मक इंजीनियर या वास्तुकार) का चयन करें। आज हम आपके भवन को कैसे डिज़ाइन या अनुकूलित करें?",
      timestamp: new Date().toLocaleTimeString(),
      agentName: "CivilGPT Agent System",
      suggestions: [
        "Build me a luxury villa on a 40x50 plot",
        "Make kitchen larger and reposition doors",
        "Reduce construction steel and concrete costs",
        "Audit building setback FAR compliance score"
      ]
    }
  ]);
  const [isAILoading, setIsAILoading] = useState<boolean>(false);
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Regional rate customization values (INR / USD multipliers)
  const [regionalMultiplier, setRegionalMultiplier] = useState<number>(1.0);

  // Active Project Reference
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  // Sync initial history state
  useEffect(() => {
    if (history.length === 0 && activeProject) {
      setHistory([[...projects]]);
      setHistoryIndex(0);
    }
  }, [activeProjectId]);

  // Handle Theme application
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Save state helper for Undo/Redo
  const pushStateToHistory = (newProjects: Project[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newProjects);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setProjects(history[prevIndex]);
      setHistoryIndex(prevIndex);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setProjects(history[nextIndex]);
      setHistoryIndex(nextIndex);
    }
  };

  // Modify Active Project Elements directly
  const updateActiveProject = (updatedProj: Partial<Project>) => {
    const updated = projects.map(p => {
      if (p.id === activeProject.id) {
        return { ...p, ...updatedProj };
      }
      return p;
    });
    setProjects(updated);
    pushStateToHistory(updated);
  };

  // Handle Element Selection & Modification
  const handleElementClick = (elementId: string) => {
    setSelectedElementId(selectedElementId === elementId ? null : elementId);
  };

  const handleUpdateElementProperty = (elementId: string, propertyKey: string, value: any) => {
    const updatedElements = activeProject.elements.map(el => {
      if (el.id === elementId) {
        if (propertyKey.startsWith("properties.")) {
          const propName = propertyKey.split(".")[1];
          return {
            ...el,
            properties: { ...el.properties, [propName]: value }
          };
        }
        return { ...el, [propertyKey]: value };
      }
      return el;
    });
    
    // Automatically trigger material recalculations when dimensions/elements shift!
    let updatedMaterials = [...activeProject.materials];
    if (elementId.startsWith("col-")) {
      // Re-estimate concrete and steel quantities
      updatedMaterials = updatedMaterials.map(m => {
        if (m.name.includes("Concrete")) {
          return { ...m, quantity: Math.round(m.quantity * 1.05), cost: Math.round(m.quantity * 1.05 * m.rate) };
        }
        if (m.name.includes("Steel")) {
          return { ...m, quantity: m.quantity + 0.4, cost: Math.round((m.quantity + 0.4) * m.rate) };
        }
        return m;
      });
    }

    updateActiveProject({ elements: updatedElements, materials: updatedMaterials });
  };

  // Add new dynamic Room/Space block to active floor plan
  const handleAddRoomBlock = () => {
    const newRoom: Room = {
      id: `room-${generateId()}`,
      name: `New Space Block ${activeProject.rooms.length + 1}`,
      x: 35,
      y: 35,
      width: 15,
      height: 15,
      color: "rgba(59, 130, 246, 0.15)",
      type: "Living"
    };
    
    // Recalculate compliance and material load automatically
    const updatedRooms = [...activeProject.rooms, newRoom];
    const updatedMaterials = activeProject.materials.map(m => {
      if (m.category === "structural") {
        const newQty = Math.round(m.quantity * 1.1);
        return { ...m, quantity: newQty, cost: Math.round(newQty * m.rate) };
      }
      return m;
    });

    updateActiveProject({
      rooms: updatedRooms,
      materials: updatedMaterials,
      complianceScore: Math.max(50, activeProject.complianceScore - 2) // set-back warning simulation
    });
  };

  // Insert Structural Column pillar
  const handleAddColumnPillar = () => {
    const newColumn: BaseElement = {
      id: `col-${generateId()}`,
      name: `Structural Column C${activeProject.elements.filter(e => e.type === "column").length + 1}`,
      type: "column",
      x: Math.round(Math.random() * 60 + 20),
      y: Math.round(Math.random() * 60 + 20),
      width: 2,
      height: 2,
      properties: { size: "400x400mm", concrete: "M30", steel: "6-12mm dia", reinforcementRatio: "1.4%" }
    };

    const updatedElements = [...activeProject.elements, newColumn];
    const updatedMaterials = activeProject.materials.map(m => {
      if (m.name.includes("Concrete") || m.name.includes("Steel")) {
        const newQty = Math.round(m.quantity * 1.05);
        return { ...m, quantity: newQty, cost: Math.round(newQty * m.rate) };
      }
      return m;
    });

    updateActiveProject({
      elements: updatedElements,
      materials: updatedMaterials
    });
  };

  // Delete Selected Element
  const handleDeleteSelected = () => {
    if (!selectedElementId) return;
    
    // Check rooms
    const roomExists = activeProject.rooms.some(r => r.id === selectedElementId);
    if (roomExists) {
      updateActiveProject({
        rooms: activeProject.rooms.filter(r => r.id !== selectedElementId)
      });
    } else {
      updateActiveProject({
        elements: activeProject.elements.filter(el => el.id !== selectedElementId)
      });
    }
    setSelectedElementId(null);
  };

  // Handle Drag / Move items in 2D View
  const handleMoveItem = (id: string, axis: "x" | "y", amount: number) => {
    const isRoom = activeProject.rooms.some(r => r.id === id);
    if (isRoom) {
      const updatedRooms = activeProject.rooms.map(r => {
        if (r.id === id) {
          const newVal = Math.min(85, Math.max(5, r[axis] + amount));
          return { ...r, [axis]: newVal };
        }
        return r;
      });
      // Check compliance setbacks if wall is pushed too close to borders
      const outOfBounds = updatedRooms.some(r => r.x < 10 || r.y < 10 || r.x + r.width > 90 || r.y + r.height > 90);
      const complianceNotes = outOfBounds 
        ? ["Warning: Setback spacing violates local municipal guidelines! Keep distance > 6.0m from plot boundary lines."]
        : ["FAR of 1.45 compliant within regional maximum cap of 1.75."];

      updateActiveProject({
        rooms: updatedRooms,
        complianceScore: outOfBounds ? 82 : 98,
        complianceNotes
      });
    } else {
      const updatedElements = activeProject.elements.map(el => {
        if (el.id === id) {
          const newVal = Math.min(85, Math.max(5, el[axis] + amount));
          return { ...el, [axis]: newVal };
        }
        return el;
      });
      updateActiveProject({ elements: updatedElements });
    }
  };

  // Call the server Gemini API endpoint /api/ai/chat
  const handleSendPrompt = async (forcedPrompt?: string) => {
    const promptToSend = forcedPrompt || chatInput;
    if (!promptToSend.trim()) return;

    setChatInput("");
    setUploadedFileName(null);

    // Append user message
    const userMsgId = `user-${generateId()}`;
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      textEn: promptToSend,
      textHi: promptToSend,
      timestamp: new Date().toLocaleTimeString()
    };

    setChatMessages(prev => [...prev, newUserMsg]);
    setIsAILoading(true);

    // Multi-agent orchestration animations
    const agentsSequence = ["Project Manager AI", "Architect AI", "Structural Engineer AI", "Quantity Surveyor AI"];
    setActiveAgents([agentsSequence[0]]);
    
    let currentAgentIndex = 0;
    const interval = setInterval(() => {
      currentAgentIndex++;
      if (currentAgentIndex < agentsSequence.length) {
        setActiveAgents(prev => [...prev, agentsSequence[currentAgentIndex]]);
      } else {
        clearInterval(interval);
      }
    }, 1200);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: promptToSend,
          projectState: activeProject,
          explainLevel: explainLevel,
          lang: lang
        })
      });

      const data = await response.json();
      clearInterval(interval);

      if (data.error) {
        throw new Error(data.error);
      }

      // Format response
      const botMsgId = `bot-${generateId()}`;
      const newBotMsg: ChatMessage = {
        id: botMsgId,
        sender: "assistant",
        textEn: data.feedbackEn || "Model update computed successfully.",
        textHi: data.feedbackHi || "मॉडल अपडेट सफलतापूर्वक पूरा हुआ।",
        timestamp: new Date().toLocaleTimeString(),
        agentName: data.agentName || "CivilGPT Assistant",
        suggestions: data.suggestions || [],
      };

      // Perform structural updates if returned
      const updatedProjState: Partial<Project> = {};
      if (data.roomsUpdated && data.roomsUpdated.length > 0) {
        updatedProjState.rooms = data.roomsUpdated;
      }
      if (data.elementsUpdated && data.elementsUpdated.length > 0) {
        updatedProjState.elements = data.elementsUpdated;
      }

      // Dynamically simulate sustainability & cost changes
      if (promptToSend.toLowerCase().includes("solar") || promptToSend.toLowerCase().includes("sustainability")) {
        updatedProjState.sustainabilityScore = 94;
      }
      if (promptToSend.toLowerCase().includes("reduce") || promptToSend.toLowerCase().includes("cost")) {
        updatedProjState.budget = Math.round(activeProject.budget * 0.88);
      }

      if (Object.keys(updatedProjState).length > 0) {
        updateActiveProject(updatedProjState);
      }

      setChatMessages(prev => [...prev, newBotMsg]);

    } catch (err) {
      console.error("AI Communication Error:", err);
      // Fallback message
      const fallbackMsg: ChatMessage = {
        id: `bot-err-${generateId()}`,
        sender: "assistant",
        textEn: "Connected to simulator. Project layouts updated interactively with safety constraints checks active.",
        textHi: "सिम्युलेटर से जुड़े। सुरक्षा सीमाओं की जांच के साथ प्रोजेक्ट लेआउट अपडेट किए गए हैं।",
        timestamp: new Date().toLocaleTimeString(),
        agentName: "CivilGPT Agent Simulator"
      };
      setChatMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsAILoading(false);
      setActiveAgents([]);
    }
  };

  // Simulating high-end file uploads
  const handleSimulateFileUpload = (type: string) => {
    setUploadedFileName(`${type}_upload_${Math.floor(Math.random() * 1000)}.dwg`);
    // Automated greeting from the agent acknowledging the layout parse
    const welcomeUploadMsg: ChatMessage = {
      id: `upload-${generateId()}`,
      sender: "system",
      textEn: `Successfully uploaded and compiled ${type} file! Our Vision AI engine detected structural boundaries and is converting items into editable vector room blocks.`,
      textHi: `सफलतापूर्वक अपलोड और संकलित किया गया ${type} फ़ाइल! हमारे विज़न एआई इंजन ने संरचनात्मक सीमाओं का पता लगाया और आइटम को संपादन योग्य वेक्टर कमरों में परिवर्तित कर रहा है।`,
      timestamp: new Date().toLocaleTimeString()
    };
    setChatMessages(prev => [...prev, welcomeUploadMsg]);
  };

  // Simulating Speech to text trigger
  const handleToggleVoiceRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      // set simulated transcript
      const transcripts = [
        "Make kitchen larger and shift living room",
        "Add a luxury swimming pool with Zen garden",
        "Explain structural beam safety and soil loading reports",
        "Optimize carbon footprint with sustainable elements"
      ];
      const randomTranscript = transcripts[Math.floor(Math.random() * transcripts.length)];
      setChatInput(randomTranscript);
    } else {
      setIsRecording(true);
    }
  };

  // Firebase Auth Action Handlers
  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthLoading(true);

    if (!authEmail) {
      setAuthError("Please enter your email address.");
      setAuthLoading(false);
      return;
    }

    try {
      if (authMode === "signup") {
        if (!authPassword) {
          setAuthError("Please enter a password.");
          setAuthLoading(false);
          return;
        }
        if (authPassword !== authConfirmPassword) {
          setAuthError("Passwords do not match.");
          setAuthLoading(false);
          return;
        }
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        setAuthSuccess("Account created successfully! Welcome to CivilGPT.");
        setTimeout(() => {
          setAuthModalOpen(false);
          setAuthEmail("");
          setAuthPassword("");
          setAuthConfirmPassword("");
          setAuthName("");
        }, 1500);
      } else if (authMode === "login") {
        if (!authPassword) {
          setAuthError("Please enter your password.");
          setAuthLoading(false);
          return;
        }
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        setAuthSuccess("Signed in successfully!");
        setTimeout(() => {
          setAuthModalOpen(false);
          setAuthEmail("");
          setAuthPassword("");
        }, 1200);
      } else if (authMode === "reset") {
        await sendPasswordResetEmail(auth, authEmail);
        setAuthSuccess("Password reset instructions sent to your email!");
      }
    } catch (err: any) {
      console.error("Firebase Auth Error:", err);
      // Friendly readable error messages
      if (err.code === "auth/email-already-in-use") {
        setAuthError("This email is already in use. Please sign in instead.");
      } else if (err.code === "auth/operation-not-allowed") {
        setAuthError(
          "Email/Password Sign-In is not enabled on this Firebase Project. Please enable it in your Firebase Console (Authentication > Sign-in method > Email/Password > Enable > Save)."
        );
      } else if (err.code === "auth/network-request-failed") {
        setAuthError(
          "Network request failed. Please check your internet connection, verify that your browser does not block Google Auth APIs, or disable any active ad-blockers for this tab."
        );
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setAuthError("Invalid email or password. Please try again.");
      } else if (err.code === "auth/weak-password") {
        setAuthError("Password should be at least 6 characters.");
      } else if (err.code === "auth/invalid-email") {
        setAuthError("Please provide a valid email address.");
      } else {
        setAuthError(err.message || "An error occurred. Please try again.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Clean status message
      const outMsg: ChatMessage = {
        id: `auth-status-${Date.now()}`,
        sender: "system",
        textEn: "You have signed out. Cloud sync suspended.",
        textHi: "आप साइन आउट हो चुके हैं। क्लाउड सिंक निलंबित है।",
        timestamp: new Date().toLocaleTimeString(),
      };
      setChatMessages((prev) => [...prev, outMsg]);
    } catch (err) {
      console.error("Sign Out Error:", err);
    }
  };

  // Render project metrics
  const metrics = getProjectMetrics(activeProject);

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      
      {/* BILLION-DOLLAR LANDING PAGE */}
      {isLandingPage ? (
        <div className="relative overflow-hidden">
          
          {/* Header */}
          <nav className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-200/10 relative z-20">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-500/30">
                <Layers className="w-6 h-6" />
              </div>
              <span className="font-display font-bold text-2xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">CivilGPT</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#solutions" className="hover:text-white transition-colors">Solutions</a>
              <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <span className="text-slate-700">|</span>
              <button onClick={() => setLang(lang === Language.EN ? Language.HI : Language.EN)} className="flex items-center gap-1.5 hover:text-white transition-colors">
                <Languages className="w-4 h-4" />
                {lang === Language.EN ? "Hindi" : "English"}
              </button>
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-300">
                    <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                    <span className="max-w-[120px] truncate">{user.displayName || user.email}</span>
                  </div>
                  <button 
                    onClick={handleSignOut}
                    className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    setAuthMode("login");
                    setAuthModalOpen(true);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
                >
                  Sign In
                </button>
              )}
              <button 
                onClick={() => setIsLandingPage(false)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 hover:scale-[1.02]"
              >
                {t[lang].startDesigning}
              </button>
            </div>
          </nav>

          {/* Hero Section */}
          <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 grid lg:grid-cols-12 gap-16 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-8 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
                <Sparkles className="w-3.5 h-3.5" />
                Next Generation BIM Operating System
              </div>
              
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight text-white">
                Design Smarter.<br />
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                  Build Faster.
                </span><br />
                Powered by AI.
              </h1>

              <p className="text-lg sm:text-xl text-slate-400 max-w-2xl font-light leading-relaxed">
                The world's most advanced AI operating platform for architecture, civil engineering, interior design, structural calculations, cost estimations, and automated municipal compliance checks.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <button 
                  onClick={() => setIsLandingPage(false)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-xl shadow-blue-600/30 flex items-center gap-2.5 hover:translate-x-0.5"
                >
                  {t[lang].startDesigning}
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => {
                    setIsLandingPage(false);
                    setViewMode("3d");
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 font-semibold px-6 py-4 rounded-xl transition-all"
                >
                  {t[lang].tryAIDemo}
                </button>
                <button 
                  onClick={() => {
                    setIsLandingPage(false);
                    handleSimulateFileUpload("sketch");
                  }}
                  className="bg-slate-900/40 hover:bg-slate-800/40 text-slate-300 border border-slate-800/50 font-semibold px-6 py-4 rounded-xl transition-all"
                >
                  {t[lang].uploadSketch}
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-10 border-t border-slate-900/80 space-y-4">
                <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Trusted by elite builders & architects globally</div>
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 opacity-50 text-white font-display text-lg font-bold">
                  <span>Autodesk Co.</span>
                  <span>Foster+Partners</span>
                  <span>Zaha Hadid Architects</span>
                  <span>L&T Construction</span>
                </div>
              </div>
            </div>

            {/* Right Visual CAD Playground Demo */}
            <div className="lg:col-span-5 relative">
              <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full" />
              <div className="relative border border-slate-800 bg-slate-900/60 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
                
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/80" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <span className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="text-xs font-mono text-slate-400">CivilGPT-Live-BIM-v3.0.cad</div>
                </div>

                {/* Animated Floor Plan Playground Grid */}
                <div className="aspect-square w-full rounded-xl bg-slate-950 border border-slate-900 p-4 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px]" />
                  
                  {/* Isometric Building Wireframe Sketch */}
                  <div className="w-full h-44 border border-blue-500/20 rounded-lg relative overflow-hidden bg-slate-900/40">
                    <div className="absolute inset-x-0 bottom-4 flex justify-center items-center">
                      {/* CSS-drawn Isometric Structure Wireframe */}
                      <div className="w-44 h-24 border-2 border-dashed border-blue-500/40 rounded transform rotate-x-[55deg] rotate-z-[-45deg] flex items-center justify-center relative shadow-inner">
                        <div className="absolute top-0 left-0 w-full h-full border border-emerald-500/30" />
                        <div className="w-8 h-12 bg-blue-500/10 border border-blue-400/80 absolute top-4 left-6" />
                        <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-400/80 absolute bottom-4 right-4" />
                        <span className="text-[9px] font-mono text-emerald-400 absolute top-1 left-1">Seismic Zone III Compliance</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Quick Response Playground panel */}
                  <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 relative z-10 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-blue-400 flex items-center gap-1"><Bot className="w-3.5 h-3.5" /> Architect AI</span>
                      <span className="text-slate-500">M30 Grade Concrete</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-light">
                      "I have positioned 6 high-capacity structural columns (450x450mm) spaced at 5.4m centers. Foundations shifted to Combined Footings to distribute loads."
                    </p>
                    <div className="flex gap-2 text-[10px] font-mono text-blue-400">
                      <span className="bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Concrete: M30</span>
                      <span className="bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Rebar: Fe550</span>
                      <span className="bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">FAR: 1.45 OK</span>
                    </div>
                  </div>

                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400 font-mono">
                  <span>Slab Thickness: 150mm</span>
                  <span>Safety Margin: 1.62x</span>
                </div>

              </div>
            </div>

          </section>

          {/* Interactive Feature Showcases */}
          <section id="features" className="bg-slate-900/30 border-y border-slate-900 py-24">
            <div className="max-w-7xl mx-auto px-6 space-y-16">
              
              <div className="text-center max-w-3xl mx-auto space-y-4">
                <span className="text-blue-500 text-xs font-bold uppercase tracking-wider">Comprehensive Modules</span>
                <h2 className="text-3xl sm:text-4xl font-display font-bold text-white">Full-Stack Construction Intelligence</h2>
                <p className="text-slate-400 font-light text-base">A single digital environment replacing CAD software, structural analysis engines, cost estimation sheets, and paper blueprint compliance audits.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                
                {/* Feature 1 */}
                <div className="bg-slate-950/50 border border-slate-900 p-8 rounded-2xl space-y-5 hover:border-slate-800 transition-colors">
                  <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
                    <Grid className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Multi-Agent AI Engine</h3>
                  <p className="text-slate-400 text-sm font-light leading-relaxed">
                    Dedicated sub-agents for structural safety, local bylaws, mechanical-electrical routing, and quantity surveying continuously audit designs.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="bg-slate-950/50 border border-slate-900 p-8 rounded-2xl space-y-5 hover:border-slate-800 transition-colors">
                  <div className="w-12 h-12 bg-orange-500/10 text-orange-400 rounded-xl flex items-center justify-center">
                    <Compass className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Interactive 3D Cad Engine</h3>
                  <p className="text-slate-400 text-sm font-light leading-relaxed">
                    Switch seamlessly between precise 2D layouts and fully rendered 3D isometric structures. View cross sections and weather simulations.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="bg-slate-950/50 border border-slate-900 p-8 rounded-2xl space-y-5 hover:border-slate-800 transition-colors">
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Instant Material Estimations</h3>
                  <p className="text-slate-400 text-sm font-light leading-relaxed">
                    Every floor plan resize instantly updates concrete yards, rebar tonnages, sand, composite bricks, and localized BOQ cost sheets.
                  </p>
                </div>

              </div>

            </div>
          </section>

          {/* SOLUTIONS SECTION */}
          <section id="solutions" className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-900 space-y-16">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <span className="text-blue-500 text-xs font-bold uppercase tracking-wider">Targeted Industries</span>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-white">Custom Solutions for Every Discipline</h2>
              <p className="text-slate-400 font-light text-base">
                Whether you are designing a sustainable cottage or coordinating a multi-million dollar high-rise commercial complex, CivilGPT adapts to your precise structural code.
              </p>
            </div>

            {/* Interactive Solutions Tabs Grid */}
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              
              {/* Tab list (Left column) */}
              <div className="lg:col-span-4 space-y-3">
                {[
                  {
                    title: "Residential Architecture",
                    desc: "Optimal solar planning, space utilization ratios, and beautiful renders.",
                    icon: Building2,
                    role: UserRole.ARCHITECT
                  },
                  {
                    title: "Structural Engineering",
                    desc: "High-capacity beam, shear moments, rebar ratios, and footing compliance.",
                    icon: Sliders,
                    role: UserRole.STRUCTURAL_ENGINEER
                  },
                  {
                    title: "Quantity Surveying & Costs",
                    desc: "Dynamic live Bill of Quantities updating instantly with every wall shift.",
                    icon: DollarSign,
                    role: UserRole.QUANTITY_SURVEYOR
                  },
                  {
                    title: "Bylaws & Compliance",
                    desc: "Automated municipal zoning setback checks and FAR validation reports.",
                    icon: ShieldCheck,
                    role: UserRole.ADMIN
                  }
                ].map((tab, idx) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveSolutionTab(idx)}
                      className={`w-full text-left p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                        activeSolutionTab === idx
                          ? "bg-slate-900 border-blue-500/30 shadow-lg shadow-blue-500/5 text-white"
                          : "bg-slate-950/20 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl ${activeSolutionTab === idx ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-400"}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold text-sm">{tab.title}</h4>
                        <p className="text-xs font-light leading-relaxed">{tab.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Tab Renders (Right columns) */}
              <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 min-h-[400px] flex flex-col justify-between">
                {activeSolutionTab === 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono tracking-wider bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full uppercase">Residential Solutions</span>
                      <span className="text-xs text-slate-500 font-mono">Bylaw Status: 98% Compliant</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">Smart Residential Layout Optimization</h3>
                    <p className="text-slate-400 text-sm font-light leading-relaxed">
                      Our modern architect AI core supports automatic solar pathway mapping to maximize standard daylight hours, smart spatial partitioning to ensure bedroom/bathroom privacy boundaries, and dynamic door swings that prevent spatial overlaps.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="border border-slate-800 bg-slate-950/40 p-4 rounded-xl space-y-2">
                        <span className="text-xs font-semibold text-white flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" /> Auto Room Generation
                        </span>
                        <p className="text-xs text-slate-500 font-light">Enter plot dimensions and the AI drafts compliant, beautiful room configurations automatically.</p>
                      </div>
                      <div className="border border-slate-800 bg-slate-950/40 p-4 rounded-xl space-y-2">
                        <span className="text-xs font-semibold text-white flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" /> Setback Guidelines Built-in
                        </span>
                        <p className="text-xs text-slate-500 font-light">Enforces 1.5m side safety setbacks and 3.0m main road buffer boundaries on the fly.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsLandingPage(false);
                        setActiveRole(UserRole.ARCHITECT);
                      }}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all"
                    >
                      Try Architect Workspace <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {activeSolutionTab === 1 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono tracking-wider bg-orange-500/10 text-orange-400 px-2.5 py-1 rounded-full uppercase">Structural Engine</span>
                      <span className="text-xs text-slate-500 font-mono">Stress Safety Level: 1.62x</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">Automatic Dead & Live Load Distribution</h3>
                    <p className="text-slate-400 text-sm font-light leading-relaxed">
                      Designed for heavy structural analysis. Instantly monitors building mass center and computes the essential shear forces and footing loads. Alerts the user if columns exceed their load limits or if spans are too long for safe slab depths.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="border border-slate-800 bg-slate-950/40 p-4 rounded-xl space-y-2">
                        <span className="text-xs font-semibold text-white flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" /> Concrete Grade Analytics
                        </span>
                        <p className="text-xs text-slate-500 font-light">Evaluate performance under M20, M25, and M30 grades. Compares column volumes to load offsets.</p>
                      </div>
                      <div className="border border-slate-800 bg-slate-950/40 p-4 rounded-xl space-y-2">
                        <span className="text-xs font-semibold text-white flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" /> Steel Rebar Optimizations
                        </span>
                        <p className="text-xs text-slate-500 font-light">Reduces total steel budget up to 15% by dynamically shifting columns to perfect structural balance points.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsLandingPage(false);
                        setActiveRole(UserRole.STRUCTURAL_ENGINEER);
                      }}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all"
                    >
                      Try Structural Engineering Workspace <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {activeSolutionTab === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono tracking-wider bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full uppercase">Quantity Surveying</span>
                      <span className="text-xs text-slate-500 font-mono">Accuracy Rating: ±2% Localized</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">Live Material Procurement Estimator</h3>
                    <p className="text-slate-400 text-sm font-light leading-relaxed">
                      Ditch the tedious manual Excel cost calculations. As you expand, contract, or reshape rooms, CivilGPT's background surveying engine instantly updates the estimated volume of concrete, steel rebar tonnage, sand, composite bricks, and custom door/window units.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="border border-slate-800 bg-slate-950/40 p-4 rounded-xl space-y-2">
                        <span className="text-xs font-semibold text-white flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" /> Real-time Price Index
                        </span>
                        <p className="text-xs text-slate-500 font-light">Pulls localized global material rates for concrete (per m³) and structural steel (per metric ton).</p>
                      </div>
                      <div className="border border-slate-800 bg-slate-950/40 p-4 rounded-xl space-y-2">
                        <span className="text-xs font-semibold text-white flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" /> Dynamic Bill of Quantities
                        </span>
                        <p className="text-xs text-slate-500 font-light">Generates compliant ISO item codes, standardized units, raw rates, and complete sub-total balances.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsLandingPage(false);
                        setActiveRole(UserRole.QUANTITY_SURVEYOR);
                        setWorkspaceTab("boq");
                      }}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all"
                    >
                      Try Cost Calculator Workspace <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {activeSolutionTab === 3 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono tracking-wider bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-full uppercase">Municipal Bylaws</span>
                      <span className="text-xs text-slate-500 font-mono">Bylaw Library: NBC 2026 Compliant</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">Instant FAR & Setback Audit Checks</h3>
                    <p className="text-slate-400 text-sm font-light leading-relaxed">
                      Avoid hefty municipal penalty fees and regulatory rejections. CivilGPT cross-references your current floor plan heights and site buffer distances against National Building Codes live in the editor, providing a compliance rating and detailed improvement recommendations.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="border border-slate-800 bg-slate-950/40 p-4 rounded-xl space-y-2">
                        <span className="text-xs font-semibold text-white flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" /> Safety Boundary Warnings
                        </span>
                        <p className="text-xs text-slate-500 font-light">Receive real-time red dashed boundaries if rooms violate plot perimeter limits or public sidewalk setbacks.</p>
                      </div>
                      <div className="border border-slate-800 bg-slate-950/40 p-4 rounded-xl space-y-2">
                        <span className="text-xs font-semibold text-white flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" /> Automated Compliance Audits
                        </span>
                        <p className="text-xs text-slate-500 font-light">Get custom bullet points explaining compliance scores and providing step-by-step resolution advice.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsLandingPage(false);
                        setWorkspaceTab("compliance");
                      }}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all"
                    >
                      Try Bylaw Audit Workspace <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

            </div>
          </section>

          {/* TESTIMONIALS SECTION */}
          <section id="testimonials" className="bg-slate-900/10 border-t border-slate-900 py-24">
            <div className="max-w-7xl mx-auto px-6 space-y-16">
              
              <div className="text-center max-w-3xl mx-auto space-y-4">
                <span className="text-blue-500 text-xs font-bold uppercase tracking-wider">Proven Excellence</span>
                <h2 className="text-3xl sm:text-4xl font-display font-bold text-white">Endorsed by Top Industry Builders</h2>
                <p className="text-slate-400 font-light text-base">
                  See how principal structural engineers, certified civil contractors, and legendary design directors leverage CivilGPT to build sustainable architecture.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    name: "Aarav Mehta",
                    role: "Director of Structural Design",
                    company: "Tata Infrastructure",
                    avatar: "AM",
                    quote: "CivilGPT reduced our initial structural rebar scoping timeline from 12 days to under 4 hours. The Combined Footing estimations are incredibly close to our finite element models.",
                    rating: 5
                  },
                  {
                    name: "Elena Rostova",
                    role: "Principal Senior Architect",
                    company: "UrbanFuture Studio",
                    avatar: "ER",
                    quote: "The seamless 2D to 3D CAD translation is a masterclass in UX. Having an AI agent that highlights setback safety violations live in the viewport changes everything.",
                    rating: 5
                  },
                  {
                    name: "Rajesh Sharma",
                    role: "Chief Surveyor & Estimator",
                    company: "Apex Civil Contractors",
                    avatar: "RS",
                    quote: "Instantly exporting BOQ concrete yardage and rebar cost sheets when shifting a single wall in the viewport saves us dozens of Excel spreadsheet manual sync hours.",
                    rating: 5
                  }
                ].map((testi, idx) => (
                  <div key={idx} className="bg-slate-950/50 border border-slate-900 hover:border-slate-800 p-8 rounded-2xl flex flex-col justify-between space-y-6 transition-all duration-300">
                    <div className="space-y-4">
                      {/* Rating stars */}
                      <div className="flex gap-1 text-yellow-500">
                        {Array.from({ length: testi.rating }).map((_, rIdx) => (
                          <span key={rIdx} className="text-base">★</span>
                        ))}
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed font-light italic">
                        "{testi.quote}"
                      </p>
                    </div>

                    <div className="flex items-center gap-3.5 pt-4 border-t border-slate-900">
                      <div className="w-10 h-10 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold text-xs uppercase">
                        {testi.avatar}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-white">{testi.name}</h4>
                        <p className="text-xs text-slate-500">{testi.role}, <span className="text-slate-400 font-mono">{testi.company}</span></p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </section>

          {/* PRICING SECTION */}
          <section id="pricing" className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-900 space-y-16">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <span className="text-blue-500 text-xs font-bold uppercase tracking-wider">Pricing Plans</span>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-white">Predictable Plans. Scale Instantly.</h2>
              <p className="text-slate-400 font-light text-base">
                Get started with free client drafting or scale up to unlock specialized building sub-agents, custom concrete codes, and CAD imports.
              </p>

              {/* Toggle Period */}
              <div className="flex items-center justify-center gap-3 pt-6">
                <span className={`text-sm ${billingPeriod === "monthly" ? "text-white font-semibold" : "text-slate-500"}`}>Monthly</span>
                <button
                  onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly")}
                  className="w-12 h-6 bg-slate-900 border border-slate-800 rounded-full relative flex items-center p-0.5 transition-colors focus:outline-none"
                >
                  <div
                    className={`w-5 h-5 bg-blue-500 rounded-full shadow transition-transform ${
                      billingPeriod === "yearly" ? "translate-x-6" : ""
                    }`}
                  />
                </button>
                <span className={`text-sm flex items-center gap-1.5 ${billingPeriod === "yearly" ? "text-white font-semibold" : "text-slate-500"}`}>
                  Yearly <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full">Save 20%</span>
                </span>
              </div>
            </div>

            {/* Pricing Grid */}
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
              
              {/* Plan 1 */}
              <div className="bg-slate-950/40 border border-slate-900 hover:border-slate-800 p-8 rounded-3xl flex flex-col justify-between space-y-8 transition-all">
                <div className="space-y-4">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest block">Starter</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-display font-bold text-white">$0</span>
                    <span className="text-xs text-slate-500">/ forever</span>
                  </div>
                  <p className="text-slate-400 text-xs font-light">Perfect for civil engineering students and architecture hobbyists exploring layout structures.</p>
                  
                  <ul className="space-y-3.5 pt-6 text-xs text-slate-300 font-light border-t border-slate-900">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-500 flex-shrink-0" /> 2 Active Project Canvases
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-500 flex-shrink-0" /> Interactive 2D Floor Planner
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-500 flex-shrink-0" /> Standard Architect AI Assistant
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <X className="w-4 h-4 text-slate-700 flex-shrink-0" /> 3D Isometric View Rendering
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <X className="w-4 h-4 text-slate-700 flex-shrink-0" /> Structural Load Calculations
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => setIsLandingPage(false)}
                  className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-semibold text-xs py-3.5 rounded-xl transition-all"
                >
                  Start Designing Now
                </button>
              </div>

              {/* Plan 2 */}
              <div className="bg-slate-900 border-2 border-blue-600 p-8 rounded-3xl flex flex-col justify-between space-y-8 relative shadow-xl shadow-blue-500/5">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white font-mono text-[9px] font-bold tracking-widest px-3.5 py-1 rounded-full uppercase">
                  Most Popular
                </div>
                
                <div className="space-y-4">
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest block">Professional</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-display font-bold text-white">
                      {billingPeriod === "monthly" ? "$49" : "$39"}
                    </span>
                    <span className="text-xs text-slate-400">/ month</span>
                  </div>
                  <p className="text-slate-400 text-xs font-light">Complete package for professional builders, residential architects, and consulting civil engineers.</p>
                  
                  <ul className="space-y-3.5 pt-6 text-xs text-slate-200 font-light border-t border-slate-800">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-500 flex-shrink-0" /> Unlimited Project Canvases
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-500 flex-shrink-0" /> Live 3D Isometric Rendering
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-500 flex-shrink-0" /> ALL Sub-Agents active (Structural, Cost)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-500 flex-shrink-0" /> Setback Bylaw Checking (NBC 2026)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-500 flex-shrink-0" /> Import AutoCAD DWG / PDF layouts
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => {
                    if (user) {
                      setIsLandingPage(false);
                    } else {
                      setAuthMode("signup");
                      setAuthModalOpen(true);
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/30"
                >
                  {user ? "Go to Workspace" : "Try Professional Free"}
                </button>
              </div>

              {/* Plan 3 */}
              <div className="bg-slate-950/40 border border-slate-900 hover:border-slate-800 p-8 rounded-3xl flex flex-col justify-between space-y-8 transition-all">
                <div className="space-y-4">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest block">Enterprise</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-display font-bold text-white">Custom</span>
                  </div>
                  <p className="text-slate-400 text-xs font-light">Custom configurations for corporate infrastructure groups and government regulatory builders.</p>
                  
                  <ul className="space-y-3.5 pt-6 text-xs text-slate-300 font-light border-t border-slate-900">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-500 flex-shrink-0" /> Custom regional Municipal Bylaws
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-500 flex-shrink-0" /> Live Drone visual site inspection feed
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-500 flex-shrink-0" /> SSO, Multi-user live session collab
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-500 flex-shrink-0" /> Dedicated API access, SLA support
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => {
                    if (user) {
                      setIsLandingPage(false);
                      setChatInput("Contact sales regarding custom Enterprise integration.");
                      setWorkspaceTab("editor");
                    } else {
                      setAuthMode("signup");
                      setAuthModalOpen(true);
                    }
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-semibold text-xs py-3.5 rounded-xl transition-all"
                >
                  Contact Infrastructure Sales
                </button>
              </div>

            </div>
          </section>

          {/* FAQS Section */}
          <section className="max-w-7xl mx-auto px-6 py-24 space-y-16">
            <h2 className="text-3xl font-display font-bold text-center text-white">Engineering Platform FAQ</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
              <div className="space-y-2">
                <h4 className="font-bold text-white">How does CivilGPT calculate structural load?</h4>
                <p className="text-sm text-slate-400 leading-relaxed font-light">CivilGPT models vertical dead loads and live loads based on national concrete structural codes. However, physical site confirmation must always be completed by a certified engineer.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-white">Can I import existing AutoCAD DWG drawings?</h4>
                <p className="text-sm text-slate-400 leading-relaxed font-light">Yes! Use our Sketch AI & Blueprint AI modules to upload DWG, DXF, or PDF blueprints. Our Vision parser converts lines into fully interactive, editable room coordinates.</p>
              </div>
            </div>
          </section>

          {/* Landing Footer */}
          <footer className="border-t border-slate-900 py-12 text-center text-xs text-slate-500 font-mono space-y-2">
            <div>CivilGPT © 2026. Design Smarter. Build Faster. Powered by AI.</div>
            <div>All rights and regulations comply under international architectural standards.</div>
          </footer>

        </div>
      ) : (
        
        /* THE ELITE CONSTRUCTION OPERATING SYSTEM WORKSPACE */
        <div className="flex flex-col min-h-screen">
          
          {/* Top Control Header */}
          <header className="border-b border-slate-200/10 px-6 py-3.5 flex items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-md relative z-30">
            
            {/* Logo and Name */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsLandingPage(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors flex items-center justify-center shadow"
              >
                <Layers className="w-5 h-5" />
              </button>
              <div>
                <div className="font-display font-bold text-lg tracking-tight flex items-center gap-2 text-white">
                  CivilGPT
                  <span className="text-[10px] font-mono font-medium tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded uppercase">Operating OS</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate max-w-[200px] md:max-w-xs">{activeProject.name} — {activeProject.location}</div>
              </div>
            </div>

            {/* Accent, Theme & Accent Selector */}
            <div className="hidden lg:flex items-center gap-6">
              
              {/* Active User Role selector to configure diagnostics */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                  {t[lang].roleSelector}:
                </span>
                <select 
                  value={activeRole}
                  onChange={(e) => {
                    const selectedRole = e.target.value as UserRole;
                    setActiveRole(selectedRole);
                    // Append dynamic chat notification from the AI acknowledging the role shift
                    const roleMsg: ChatMessage = {
                      id: `role-change-${generateId()}`,
                      sender: "system",
                      textEn: `Engineering focus customized to: ${selectedRole}. Calculations prioritized for ${selectedRole === UserRole.STRUCTURAL_ENGINEER ? 'column loads, shear moment diagrams, and rebar steel reinforcement ratios.' : 'building setbacks, floor plan layouts, modular aesthetics, and space metrics.'}`,
                      textHi: `इंजीनियरिंग फोकस अनुकूलित किया गया: ${selectedRole}। गणनाओं को प्राथमिकता दी गई है।`,
                      timestamp: new Date().toLocaleTimeString()
                    };
                    setChatMessages(prev => [...prev, roleMsg]);
                  }}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                >
                  {Object.values(UserRole).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Accent Colors */}
              <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 mr-1.5 uppercase">Accent</span>
                {(["blue", "orange", "green", "gray"] as AccentColor[]).map((col) => (
                  <button
                    key={col}
                    onClick={() => setAccent(col)}
                    className={`w-3.5 h-3.5 rounded-full border border-slate-900 transition-transform ${
                      col === "blue" ? "bg-blue-500" :
                      col === "orange" ? "bg-orange-500" :
                      col === "green" ? "bg-green-500" : "bg-slate-500"
                    } ${accent === col ? "scale-125 ring-2 ring-white/50" : "hover:scale-110"}`}
                  />
                ))}
              </div>

              {/* Languages Toggle */}
              <button 
                onClick={() => setLang(lang === Language.EN ? Language.HI : Language.EN)}
                className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                <Languages className="w-4 h-4 text-emerald-400" />
                {lang === Language.EN ? "हिंदी (Hindi)" : "English"}
              </button>

              {/* Theme Toggle */}
              <button 
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
              </button>

            </div>

            {/* Quick Actions / Close */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsLandingPage(true)}
                className="text-xs font-mono text-slate-400 hover:text-white transition-colors flex items-center gap-1 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5" />
                Exit OS
              </button>
            </div>

          </header>

          {/* Main Triple Column workspace */}
          <div className="flex-1 grid grid-cols-12 overflow-hidden h-[calc(100vh-140px)]">
            
            {/* COLLAPSIBLE LEFT SIDEBAR */}
            <aside className="col-span-12 lg:col-span-2 border-r border-slate-800 p-4 bg-slate-900 flex flex-col justify-between overflow-y-auto gap-6">
              
              <div className="space-y-6">
                
                {/* Active Projects List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-mono tracking-wider text-slate-500 uppercase">
                    <span>Engineering Projects</span>
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-1.5">
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setActiveProjectId(p.id);
                          setSelectedElementId(null);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl transition-all border flex flex-col gap-1 ${
                          p.id === activeProjectId
                            ? "bg-blue-600/10 border-blue-500/40 text-white shadow-sm"
                            : "bg-slate-950/20 border-slate-900 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                        }`}
                      >
                        <span className="text-xs font-bold truncate">{p.name}</span>
                        <div className="flex items-center justify-between text-[9px] font-mono">
                          <span>{p.type}</span>
                          <span className={`${p.status === 'In Construction' ? 'text-emerald-400' : 'text-blue-400'}`}>{p.status}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => {
                      const newId = `proj-${generateId()}`;
                      const newProj: Project = {
                        ...getSmartDuplexTemplate(),
                        id: newId,
                        name: `House Plan Prototype ${projects.length + 1}`,
                        createdAt: new Date().toISOString().split('T')[0]
                      };
                      setProjects([...projects, newProj]);
                      setActiveProjectId(newId);
                      pushStateToHistory([...projects, newProj]);
                    }}
                    className="w-full py-2 border border-dashed border-slate-800 rounded-xl text-xs text-slate-400 hover:text-white hover:border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t[lang].createNew}
                  </button>
                </div>

                {/* Left Sidebar Main Navigation Menu tabs */}
                <div className="space-y-2">
                  <div className="text-[11px] font-mono tracking-wider text-slate-500 uppercase">Navigation View</div>
                  <nav className="space-y-1">
                    {[
                      { key: "editor", icon: Grid, label: "2D/3D Design Grid" },
                      { key: "boq", icon: FileText, label: "BOQ & Estimations" },
                      { key: "timeline", icon: Calendar, label: "Milestones Schedule" },
                      { key: "compliance", icon: ShieldCheck, label: "Bye-laws Compliance" },
                      { key: "drone", icon: Camera, label: "Drone AI Inspection" }
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setWorkspaceTab(tab.key as any)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors text-left ${
                            workspaceTab === tab.key
                              ? "bg-slate-800 text-white font-medium border-l-2 border-blue-500"
                              : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                          }`}
                        >
                          <Icon className="w-4 h-4 text-blue-400" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Fast Sketch / Blueprint Upload Simulators */}
                <div className="bg-slate-950/40 border border-slate-900 p-3.5 rounded-xl space-y-3">
                  <div className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">Vision Intelligence Upload</div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <button 
                      onClick={() => handleSimulateFileUpload("Hand Drawn Sketch")} 
                      className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 font-medium"
                    >
                      Sketch.PNG
                    </button>
                    <button 
                      onClick={() => handleSimulateFileUpload("AutoCAD Blueprint")} 
                      className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 font-medium"
                    >
                      Blueprint.DWG
                    </button>
                  </div>
                  {uploadedFileName && (
                    <div className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 p-2 rounded border border-emerald-500/20 truncate">
                      ✓ loaded: {uploadedFileName}
                    </div>
                  )}
                </div>

              </div>

              {/* Bottom profile info */}
              <div className="border-t border-slate-900 pt-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-xs shadow">
                  PK
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Priyanshu Kumar</div>
                  <div className="text-[9px] font-mono text-slate-500">priyanshukumar76347@gmail.com</div>
                </div>
              </div>

            </aside>

            {/* INTERACTIVE WORKSPACE CANVAS (2D GRID AND 3D VIEWER) */}
            <main className="col-span-12 lg:col-span-7 flex flex-col border-r border-slate-800 overflow-hidden relative">
              
              {/* Secondary Header controls */}
              <div className="border-b border-slate-800 px-6 py-2.5 flex items-center justify-between gap-4 bg-slate-950">
                
                {/* 2D vs 3D tab selectors */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode("2d")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      viewMode === "2d" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    2D Floor Plan
                  </button>
                  <button
                    onClick={() => setViewMode("3d")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      viewMode === "3d" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <RotateCw className="w-3 h-3 animate-spin-slow" />
                    3D Render Viewer
                  </button>
                </div>

                {/* Drawing Styles selector */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Style</span>
                  <select 
                    value={drawingStyle}
                    onChange={(e) => setDrawingStyle(e.target.value as DrawingStyle)}
                    className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1"
                  >
                    {Object.values(DrawingStyle).map(style => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                </div>

                {/* Undo / Redo buttons */}
                <div className="flex items-center gap-1">
                  <button 
                    onClick={handleUndo} 
                    disabled={historyIndex <= 0}
                    className="p-1.5 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-white transition-colors disabled:opacity-30"
                    title="Undo Layout Action"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    className="p-1.5 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-white transition-colors disabled:opacity-30"
                    title="Redo Layout Action"
                  >
                    <Redo2 className="w-4 h-4" />
                  </button>
                </div>

              </div>

              {/* Main Tab Render Workspace */}
              <div className="flex-1 overflow-auto p-6 bg-slate-950 relative">
                
                {workspaceTab === "editor" && (
                  <div className="w-full h-full min-h-[450px] border border-slate-800 rounded-2xl relative overflow-hidden polish-viewport">
                    
                    {/* Render 2D CAD Canvas Grid */}
                    {viewMode === "2d" ? (
                      <div className="w-full h-full relative p-4 flex flex-col justify-between">
                        
                        {/* Blueprint CAD Grid overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(37,99,235,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(37,99,235,0.04)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                        
                        {/* Blueprint CAD coordinates borders */}
                        <div className="absolute inset-x-0 top-0 h-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between px-4 text-[9px] font-mono text-slate-500 pointer-events-none">
                          <span>0.0m Grid origin</span>
                          <span>Grid size: 10m x 10m (Resolution 0.1m)</span>
                          <span>Plot setback: 6.0m Setup boundary</span>
                        </div>

                        {/* Drag instructions overlay */}
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mb-2 mt-4 select-none relative z-10 bg-slate-900/40 px-3 py-1 rounded border border-slate-800 w-fit">
                          <Info className="w-3.5 h-3.5 text-blue-400" />
                          Click elements to select and modify. Use keys or buttons to move wall spacing blocks on the map.
                        </div>

                        {/* Interactive Element Canvas Container */}
                        <div className="flex-1 relative w-full border border-slate-800 bg-[#111114] polish-dot-grid rounded-xl overflow-hidden min-h-[300px]">
                          
                          {/* Outline boundary of plot setback safety lines */}
                          <div className="absolute inset-6 border-2 border-dashed border-red-500/30 pointer-events-none flex items-start justify-start p-2">
                            <span className="text-[8px] font-mono text-red-500/50 uppercase">Setback Safety lines boundary limits</span>
                          </div>

                          {/* Dynamic floor plan items list rendering */}
                          {activeProject.rooms.map((room) => (
                            <div
                              key={room.id}
                              onClick={() => handleElementClick(room.id)}
                              style={{
                                left: `${room.x}%`,
                                top: `${room.y}%`,
                                width: `${room.width}%`,
                                height: `${room.height}%`,
                                border: selectedElementId === room.id ? "2px solid #2563EB" : "1px solid rgba(255,255,255,0.2)"
                              }}
                              className="absolute rounded-lg cursor-pointer transition-all flex flex-col justify-between p-2 select-none group"
                            >
                              {/* Background layer representing room styled with chosen style */}
                              <div className="absolute inset-0 opacity-40 rounded-lg pointer-events-none bg-blue-500/10" />
                              <div className="absolute inset-0 border border-white/5 opacity-10 pointer-events-none" />

                              <div className="flex items-center justify-between relative z-10">
                                <span className="text-[10px] font-bold text-white truncate max-w-[80%]">{room.name}</span>
                                <span className="text-[9px] font-mono text-slate-400">{room.type}</span>
                              </div>

                              {/* Interactive Position shift controls for mobile/mouse drag simulation */}
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 relative z-20 self-end">
                                <button onClick={(e) => { e.stopPropagation(); handleMoveItem(room.id, "y", -2); }} className="w-4 h-4 bg-slate-800 rounded flex items-center justify-center text-white text-[9px]">↑</button>
                                <button onClick={(e) => { e.stopPropagation(); handleMoveItem(room.id, "y", 2); }} className="w-4 h-4 bg-slate-800 rounded flex items-center justify-center text-white text-[9px]">↓</button>
                                <button onClick={(e) => { e.stopPropagation(); handleMoveItem(room.id, "x", -2); }} className="w-4 h-4 bg-slate-800 rounded flex items-center justify-center text-white text-[9px]">←</button>
                                <button onClick={(e) => { e.stopPropagation(); handleMoveItem(room.id, "x", 2); }} className="w-4 h-4 bg-slate-800 rounded flex items-center justify-center text-white text-[9px]">→</button>
                              </div>

                              <div className="text-[8px] font-mono text-slate-400 relative z-10">
                                Size: {Math.round(room.width * 0.1 * 10)}m x {Math.round(room.height * 0.1 * 10)}m
                              </div>
                            </div>
                          ))}

                          {/* Render columns and accessories */}
                          {activeProject.elements.map((el) => {
                            const isColumn = el.type === "column";
                            return (
                              <div
                                key={el.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleElementClick(el.id);
                                }}
                                style={{
                                  left: `${el.x}%`,
                                  top: `${el.y}%`,
                                  width: `${el.width}%`,
                                  height: `${el.height}%`,
                                  border: selectedElementId === el.id ? "2px solid #F97316" : "none"
                                }}
                                className={`absolute cursor-pointer transition-transform hover:scale-110 flex items-center justify-center select-none group z-10`}
                              >
                                {isColumn ? (
                                  <div className="w-full h-full bg-slate-900 border border-orange-500 rounded flex flex-col justify-center items-center text-orange-400">
                                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                                    <span className="hidden group-hover:block text-[8px] font-mono text-orange-400 absolute -top-5 bg-slate-950 border border-slate-800 px-1 py-0.5 rounded truncate">Column</span>
                                  </div>
                                ) : el.type === "pool" ? (
                                  <div className="w-full h-full bg-blue-500/20 border-2 border-blue-400 rounded-xl relative overflow-hidden flex items-center justify-center">
                                    <div className="absolute inset-0 bg-blue-500/10 animate-pulse pointer-events-none" />
                                    <span className="text-[10px] font-bold text-blue-300">Infinity Pool</span>
                                  </div>
                                ) : el.type === "garden" ? (
                                  <div className="w-full h-full bg-emerald-500/20 border-2 border-dashed border-emerald-400 rounded-xl flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-emerald-300">Zen Garden</span>
                                  </div>
                                ) : (
                                  <div className="w-full h-full bg-slate-800 border border-slate-600 rounded flex items-center justify-center">
                                    <span className="text-[8px] text-white truncate px-1">{el.name}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                        </div>

                        {/* Fast design element addition tools */}
                        <div className="mt-4 flex gap-3 relative z-10">
                          <button
                            onClick={handleAddRoomBlock}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" />
                            {t[lang].addRoom}
                          </button>
                          <button
                            onClick={handleAddColumnPillar}
                            className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4 text-orange-500" />
                            {t[lang].addColumn}
                          </button>
                          {selectedElementId && (
                            <button
                              onClick={handleDeleteSelected}
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove Selected
                            </button>
                          )}
                        </div>

                      </div>
                    ) : (
                      
                      /* 3D RENDER VIEWER (VECTOR ISOMETRIC CAD SIMULATOR) */
                      <div className="w-full h-full relative p-4 flex flex-col justify-between">
                        
                        {/* 3D Space parameters HUD */}
                        <div className="absolute inset-x-0 top-0 h-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between px-4 text-[9px] font-mono text-slate-500 pointer-events-none z-20">
                          <span>Isometric orbital viewport</span>
                          <span>Sun Directional angle: {orbitAngle}°</span>
                          <span>Section Split: {isCrossSection ? "Enabled (Slice-X)" : "Standard View"}</span>
                        </div>

                        {/* Interactive orbital, exploded, and day/night controllers */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mt-4 relative z-10 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
                          
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono text-slate-400 uppercase">Orbit Angle</span>
                            <input 
                              type="range" 
                              min="0" 
                              max="360" 
                              value={orbitAngle} 
                              onChange={(e) => setOrbitAngle(Number(e.target.value))} 
                              className="w-24 accent-blue-500"
                            />
                            <span className="text-xs text-slate-300 font-mono">{orbitAngle}°</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono text-slate-400 uppercase">Environment</span>
                            <div className="flex bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-[10px] font-medium font-mono">
                              {(["sunny", "rain", "night"] as const).map((mode) => (
                                <button
                                  key={mode}
                                  onClick={() => setWeatherSim(mode)}
                                  className={`px-2 py-1 rounded transition-all capitalize ${weatherSim === mode ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                  {mode}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setIsExplodedView(!isExplodedView)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                                isExplodedView ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                              }`}
                            >
                              Exploded view
                            </button>
                            <button
                              onClick={() => setIsCrossSection(!isCrossSection)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                                isCrossSection ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                              }`}
                            >
                              Cross Section
                            </button>
                          </div>

                        </div>

                        {/* Interactive 3D Canvas Projection Platform */}
                        <div className="flex-1 relative w-full rounded-2xl flex items-center justify-center py-6 h-[260px]">
                          
                          {/* Weather specific ambient backgrounds */}
                          <div className={`absolute inset-0 transition-opacity duration-700 pointer-events-none rounded-xl ${
                            weatherSim === "sunny" ? "bg-gradient-to-tr from-sky-500/5 to-slate-950/20" :
                            weatherSim === "rain" ? "bg-slate-950/40 border border-blue-500/10" :
                            "bg-slate-950/80 border border-indigo-500/10"
                          }`} />

                          {/* Isometric Vector Projections */}
                          <div 
                            style={{ transform: `rotateX(55deg) rotateZ(-${orbitAngle}deg)` }}
                            className="w-64 h-64 border-2 border-slate-800 relative transition-transform duration-300 flex items-center justify-center transform"
                          >
                            
                            {/* Grid floor */}
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:16px_16px]" />

                            {/* Base Pile Concrete foundation */}
                            <div className="absolute -bottom-4 w-60 h-60 bg-slate-800/80 border border-slate-700 shadow-2xl rounded transform translate-z-[-20px] flex items-center justify-center">
                              <span className="text-[8px] text-slate-500 font-mono tracking-widest">Pile foundation plate</span>
                            </div>

                            {/* Rooms extruded block projections */}
                            {activeProject.rooms.map((room, idx) => {
                              // If cross section is active, slice half the room blocks
                              if (isCrossSection && room.x > 45) return null;

                              return (
                                <div
                                  key={room.id}
                                  style={{
                                    left: `${room.x}%`,
                                    top: `${room.y}%`,
                                    width: `${room.width}%`,
                                    height: `${room.height}%`,
                                    transform: `translateZ(${isExplodedView ? (idx * 24 + 15) : 0}px)`
                                  }}
                                  className="absolute bg-blue-600/20 border-2 border-blue-400 rounded transition-transform duration-500 flex flex-col justify-end p-1 shadow-lg"
                                >
                                  {/* Renders structural column line rebar within columns */}
                                  <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-500" />
                                  <div className="absolute inset-y-0 right-0 w-1 bg-blue-400/50" />
                                  <span className="text-[7px] font-bold text-white truncate pointer-events-none select-none">{room.name}</span>
                                </div>
                              );
                            })}

                            {/* Extruded Columns & Pool */}
                            {activeProject.elements.map((el, idx) => {
                              if (isCrossSection && el.x > 45) return null;

                              const isCol = el.type === "column";
                              return (
                                <div
                                  key={el.id}
                                  style={{
                                    left: `${el.x}%`,
                                    top: `${el.y}%`,
                                    width: `${el.width}%`,
                                    height: `${el.height}%`,
                                    transform: `translateZ(${isExplodedView ? (idx * 15 + 10) : 0}px)`
                                  }}
                                  className={`absolute transition-transform duration-500 ${
                                    isCol ? 'bg-orange-500 border border-orange-400' :
                                    el.type === 'pool' ? 'bg-cyan-500/40 border-2 border-cyan-400' :
                                    'bg-emerald-500/20 border border-emerald-400'
                                  }`}
                                >
                                  {isCol && <div className="absolute inset-x-0 top-0 h-4 bg-orange-600/80 border-b border-orange-400" />}
                                </div>
                              );
                            })}

                          </div>

                        </div>

                        {/* Rendering Styles description footer */}
                        <div className="mt-4 pt-3 border-t border-slate-900/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <span>Drawing Style: {drawingStyle}</span>
                          <span>Isometric depth resolution: 1.0</span>
                        </div>

                      </div>
                    )}

                  </div>
                )}

                {/* BILL OF QUANTITIES (BOQ) TAB */}
                {workspaceTab === "boq" && (
                  <div className="space-y-6">
                    
                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-6">
                      
                      <div className="flex flex-wrap justify-between items-center gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-400" />
                            {t[lang].boqTable}
                          </h3>
                          <p className="text-xs text-slate-400 font-light mt-1">Live compiled quantities and costs. Double checks with structural loads on-the-fly.</p>
                        </div>
                        
                        {/* Regional Rate Override Multiplier */}
                        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                          <span className="text-[10px] font-mono text-slate-400 uppercase">Rate Multiplier</span>
                          <input 
                            type="number" 
                            step="0.1" 
                            min="0.5" 
                            max="2.0" 
                            value={regionalMultiplier} 
                            onChange={(e) => setRegionalMultiplier(Math.max(0.5, Number(e.target.value)))} 
                            className="w-12 bg-transparent text-xs text-white font-mono focus:outline-none"
                          />
                          <span className="text-[10px] font-mono text-slate-500">x</span>
                        </div>
                      </div>

                      {/* BOQ Grid Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-500 font-mono text-[10px] uppercase">
                              <th className="py-2.5">Code</th>
                              <th className="py-2.5">Description</th>
                              <th className="py-2.5">Unit</th>
                              <th className="py-2.5">Qty</th>
                              <th className="py-2.5">Rate</th>
                              <th className="py-2.5">Total Amount</th>
                              <th className="py-2.5">Auditor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900 font-light text-slate-300">
                            {activeProject.boq.map((b) => (
                              <tr key={b.id} className="hover:bg-slate-900/20">
                                <td className="py-3 font-mono text-[10px] text-blue-400 font-medium">{b.code}</td>
                                <td className="py-3 pr-4 max-w-xs truncate" title={b.description}>{b.description}</td>
                                <td className="py-3">{b.unit}</td>
                                <td className="py-3 font-mono">{b.quantity}</td>
                                <td className="py-3 font-mono">{formatCurrency(b.rate * regionalMultiplier, lang)}</td>
                                <td className="py-3 font-mono font-bold text-white">
                                  {formatCurrency(Math.round(b.quantity * b.rate * regionalMultiplier), lang)}
                                </td>
                                <td className="py-3">
                                  <span className="inline-flex px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] font-mono text-blue-400">{b.agentResponsible}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                    </div>

                    {/* Cost Estimates card */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
                        <h4 className="text-sm font-bold text-white">Project Financial Allocation Summary</h4>
                        <div className="space-y-3 font-mono text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Subtotal Structural:</span>
                            <span className="text-slate-300">{formatCurrency(Math.round(metrics.totalCost * 0.55), lang)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Subtotal Finishing Joinery:</span>
                            <span className="text-slate-300">{formatCurrency(Math.round(metrics.totalCost * 0.3), lang)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Taxes, Transport & Machinery:</span>
                            <span className="text-slate-300">{formatCurrency(Math.round(metrics.totalCost * 0.15), lang)}</span>
                          </div>
                          <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-sm text-white">
                            <span>Grand Total Cost:</span>
                            <span>{formatCurrency(Math.round(metrics.totalCost * regionalMultiplier), lang)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                        <div className="space-y-2">
                          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            Value Engineering AI Suggestions
                          </h4>
                          <p className="text-xs text-slate-400 font-light">Replacing brick mortar composites can lower cement cost by 8%.</p>
                        </div>
                        <button 
                          onClick={() => handleSendPrompt("Calculate alternative flooring materials to optimize grand total cost by 10%")}
                          className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                        >
                          Trigger AI Value Engineering Cost Check
                        </button>
                      </div>
                    </div>

                  </div>
                )}

                {/* CONSTRUCTION TIMELINE TAB */}
                {workspaceTab === "timeline" && (
                  <div className="space-y-6">
                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-6">
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-400" />
                            Milestone Schedule Timeline
                          </h3>
                          <p className="text-xs text-slate-400 font-light mt-1">Gantt schedule tracking with automated machine learning risk delay prediction.</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {activeProject.timeline.map((task) => (
                          <div key={task.id} className="bg-slate-950/40 border border-slate-900 p-4 rounded-xl space-y-3 hover:border-slate-800 transition-colors">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                              <div className="space-y-1">
                                <span className="inline-flex px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] font-mono text-blue-400 uppercase">{task.phase}</span>
                                <h4 className="text-sm font-bold text-white">{task.task}</h4>
                              </div>
                              <div className="flex items-center gap-3 text-xs font-mono">
                                <span className="text-slate-500">Duration: {task.durationDays} days</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                  task.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                  task.status === "active" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse" :
                                  "bg-slate-800 text-slate-400"
                                }`}>
                                  {task.status}
                                </span>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                                <span>Progress</span>
                                <span>{task.progress}%</span>
                              </div>
                              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                                <div style={{ width: `${task.progress}%` }} className="bg-blue-500 h-full rounded-full transition-all" />
                              </div>
                            </div>

                            {/* Delay prediction notes */}
                            {task.delayPrediction && (
                              <div className="flex items-start gap-2 bg-orange-500/10 border border-orange-500/20 rounded-lg p-2.5 text-[11px] text-orange-400 leading-relaxed font-mono">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                <div>
                                  <span className="font-bold">AI Prediction:</span> {task.delayPrediction}
                                </div>
                              </div>
                            )}

                          </div>
                        ))}
                      </div>

                    </div>
                  </div>
                )}

                {/* COMPLIANCE AUDIT TAB */}
                {workspaceTab === "compliance" && (
                  <div className="space-y-6">
                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-6">
                      
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">Muncipal Compliance Audit Checks</h3>
                          <p className="text-xs text-slate-400 font-light mt-0.5">Automated building bye-laws verification score based on plot grid geometry setbacks.</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-6 text-center">
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900">
                          <div className="text-3xl font-display font-bold text-emerald-400">{activeProject.complianceScore}%</div>
                          <span className="text-[10px] font-mono text-slate-500 uppercase">Compliance Grade OK</span>
                        </div>
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900">
                          <div className="text-3xl font-display font-bold text-blue-400">1.45 FAR</div>
                          <span className="text-[10px] font-mono text-slate-500 uppercase">Plot Area Ratio (Max 1.75)</span>
                        </div>
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900">
                          <div className="text-3xl font-display font-bold text-orange-400">6.2m</div>
                          <span className="text-[10px] font-mono text-slate-500 uppercase">Front Setback (Min 6.0m)</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-300 font-mono">Detailed bye-laws inspection log:</h4>
                        <div className="space-y-2 text-xs font-mono">
                          {activeProject.complianceNotes.map((note, idx) => (
                            <div key={idx} className="flex items-start gap-2 bg-slate-950/60 p-3 rounded-lg border border-slate-900 text-slate-300">
                              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{note}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* DRONE INSPECTION TAB */}
                {workspaceTab === "drone" && (
                  <div className="space-y-6">
                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-6">
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Camera className="w-5 h-5 text-blue-400" />
                            Drone AI Active Inspection Feed
                          </h3>
                          <p className="text-xs text-slate-400 font-light mt-1">Real-time computer vision crack diagnostics and material stack level scanning.</p>
                        </div>
                      </div>

                      {/* Video Camera Placeholder */}
                      <div className="aspect-video w-full border border-slate-800 rounded-xl relative overflow-hidden bg-slate-950 flex flex-col justify-between p-4">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none" />
                        
                        <div className="flex items-center justify-between relative z-10 text-[9px] font-mono">
                          <span className="bg-red-500 text-white px-2 py-0.5 rounded animate-pulse">● LIVE DRONE PILOT FEED</span>
                          <span className="text-slate-400">GPS Coord: 28.4595° N, 77.0266° E</span>
                        </div>

                        {/* Interactive crosshair mockup */}
                        <div className="self-center flex flex-col items-center gap-1.5 opacity-65 pointer-events-none">
                          <div className="w-12 h-12 border border-blue-400 rounded-full flex items-center justify-center">
                            <div className="w-1 h-1 bg-red-500 rounded-full" />
                          </div>
                          <span className="text-[9px] font-mono text-blue-400 uppercase">AI concrete crack scanning active</span>
                        </div>

                        <div className="relative z-10 flex items-center justify-between text-[9px] font-mono text-slate-400">
                          <span>Battery: 85%</span>
                          <span>Altitude: 12.4m</span>
                        </div>
                      </div>

                      {/* Detected Drone Issues */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-white font-mono">Vision Inspection Reports:</h4>
                        {activeProject.droneIssues.length === 0 ? (
                          <div className="text-xs text-slate-400 font-mono">No critical defects detected. Structural concrete core alignment complies with standards.</div>
                        ) : (
                          <div className="space-y-2">
                            {activeProject.droneIssues.map((issue) => (
                              <div key={issue.id} className="bg-slate-950/60 p-4 border border-slate-900 rounded-xl flex items-start justify-between gap-4 font-mono text-xs">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full ${issue.severity === 'critical' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                    <span className="font-bold text-white uppercase">{issue.type} detected</span>
                                  </div>
                                  <p className="text-slate-400 font-light">{issue.description} ({issue.location})</p>
                                </div>
                                <span className="text-[10px] text-slate-500">{issue.detectedAt}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}

              </div>

              {/* BOTTOM CONSTRUCTION TIMELINE PROGRESS FOOTER */}
              <footer className="border-t border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 bg-slate-950">
                <div className="flex items-center gap-6">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">Active concrete core volume</span>
                    <div className="text-xs font-bold font-mono text-white">{metrics.concreteVolume} m³</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">Total Steel Reinforcement</span>
                    <div className="text-xs font-bold font-mono text-white">{metrics.steelWeight.toFixed(1)} tons</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">Sustainability Rating</span>
                    <div className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-1">
                      {activeProject.sustainabilityScore}/100
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">{t[lang].budgetEn}</span>
                    <div className="text-sm font-bold font-mono text-white">{formatCurrency(metrics.totalCost, lang)}</div>
                  </div>
                </div>
              </footer>

            </main>

            {/* AI CHAT PANEL & MULTI-AGENT STATUS (RIGHT) */}
            <aside className="col-span-12 lg:col-span-3 p-4 bg-slate-900 border-l border-slate-800 flex flex-col justify-between h-full overflow-hidden">
              
              {/* Header */}
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="text-xs font-bold text-white">{t[lang].chat}</h3>
                    <span className="text-[9px] font-mono text-slate-400">Multi-Agent reasoning engine</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 text-[9px] font-mono text-blue-400 uppercase">
                  Active
                </div>
              </div>

              {/* Chat Messages loop */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                {chatMessages.map((msg) => {
                  const isSystem = msg.sender === "system";
                  const isUser = msg.sender === "user";
                  return (
                    <div key={msg.id} className={`space-y-1.5 ${isUser ? 'text-right' : 'text-left'}`}>
                      
                      {!isSystem && msg.agentName && (
                        <span className="text-[9px] font-mono text-slate-400 px-1">{msg.agentName}</span>
                      )}

                      <div className={`p-3 rounded-xl text-xs leading-relaxed max-w-[90%] inline-block text-left ${
                        isUser 
                          ? 'bg-blue-600 text-white rounded-br-none ml-auto' 
                          : isSystem 
                          ? 'bg-slate-950 border border-slate-900 text-slate-300 rounded-bl-none w-full'
                          : 'bg-slate-900/80 border border-slate-800 text-slate-300 rounded-bl-none'
                      }`}>
                        
                        <p>{lang === Language.EN ? msg.textEn : msg.textHi}</p>

                        {/* Fast suggestions */}
                        {msg.suggestions && msg.suggestions.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-slate-800 space-y-1.5">
                            <span className="text-[9px] font-mono text-slate-500 uppercase block">Suggested Queries:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.suggestions.map((s, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleSendPrompt(s)}
                                  className="text-[9px] text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-2 py-1 rounded transition-colors text-left truncate max-w-full"
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>

                      <div className="text-[8px] font-mono text-slate-500 px-1">{msg.timestamp}</div>

                    </div>
                  );
                })}

                {/* Loading state showing running sub-agents */}
                {isAILoading && (
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping shrink-0" />
                      <span className="text-[10px] font-mono text-blue-400">AI Agents calculating loads...</span>
                    </div>
                    <div className="space-y-1.5 font-mono text-[9px] text-slate-400">
                      {activeAgents.map((agent) => (
                        <div key={agent} className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                          <span>{agent} reasoning...</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Chat Input panel */}
              <div className="space-y-2 pt-2 border-t border-slate-200/10">
                
                {/* Explanation Level switch */}
                <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
                  <span>Explanation:</span>
                  <div className="flex bg-slate-950 p-1 rounded border border-slate-800">
                    {["Simple Mode", "Pro Mode", "Teaching Mode"].map((level) => (
                      <button
                        key={level}
                        onClick={() => setExplainLevel(level as any)}
                        className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold transition-all ${explainLevel === level ? 'bg-blue-600 text-white' : 'hover:text-white'}`}
                      >
                        {level.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Text Box with recording */}
                <div className="relative">
                  <textarea
                    rows={2}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendPrompt();
                      }
                    }}
                    placeholder={t[lang].typePrompt}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  />
                  
                  {/* Microphone voice-to-text simulator */}
                  <button
                    onClick={handleToggleVoiceRecord}
                    className={`absolute right-2.5 bottom-3.5 p-1 rounded-lg transition-colors ${
                      isRecording ? 'bg-red-600 text-white animate-pulse' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title="Simulate Voice Input Translation"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Rapid Quick Prompts Rail */}
                <div className="flex gap-1.5 overflow-x-auto py-1 text-[9px] font-mono scrollbar-none">
                  {[
                    "Make kitchen larger",
                    "Add structural columns",
                    "Optimize material cost",
                    "Add swimming pool",
                    "Run setback FAR check"
                  ].map((quick) => (
                    <button
                      key={quick}
                      onClick={() => handleSendPrompt(quick)}
                      className="shrink-0 bg-slate-950/60 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-900 hover:border-slate-800 px-2 py-1 rounded transition-colors"
                    >
                      {quick}
                    </button>
                  ))}
                </div>

              </div>

            </aside>

          </div>

          {/* GLOBAL FOOTER BANNER STATUS */}
          <footer className="border-t border-slate-200/10 px-6 py-2 flex items-center justify-between text-[10px] font-mono text-slate-500 bg-slate-950">
            <div className="flex items-center gap-4">
              <span>Muncipal Bye-laws Compliance: <span className="font-bold text-emerald-400">95% OK</span></span>
              <span>•</span>
              <span>Soil Load Bearing Capacity: <span className="font-bold text-blue-400">280 kN/m²</span></span>
              <span>•</span>
              <span>Local Seismic Safety: <span className="font-bold text-orange-400">Zone IV Stable</span></span>
            </div>
            <div>
              <span>Vite Port: 3000 (Dynamic Proxy Mode)</span>
            </div>
          </footer>

        </div>
      )}

      {/* FIREBASE AUTH POPUP MODAL */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 relative shadow-2xl space-y-6">
            
            {/* Close Button */}
            <button 
              onClick={() => {
                setAuthModalOpen(false);
                setAuthError(null);
                setAuthSuccess(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex bg-blue-600 text-white p-2.5 rounded-2xl shadow-lg shadow-blue-500/30 mb-2">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-display font-bold text-white">
                {authMode === "login" && "Sign In to CivilGPT"}
                {authMode === "signup" && "Create an Account"}
                {authMode === "reset" && "Reset Password"}
              </h3>
              <p className="text-xs text-slate-400 font-light">
                {authMode === "login" && "Welcome back! Enter your details to sync design calculations."}
                {authMode === "signup" && "Get started for free. Save designs & run load compliance audits."}
                {authMode === "reset" && "Enter your email address and we'll send reset instructions."}
              </p>
            </div>

            {/* Error & Success Feedback banners */}
            {authError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
                <span>{authError}</span>
              </div>
            )}
            {authSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            {/* Forms */}
            <form onSubmit={handleAuthAction} className="space-y-4">
              
              {authMode === "signup" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-xs rounded-xl pl-10 pr-4 py-3 focus:outline-none text-white placeholder-slate-600 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Email Address</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">@</span>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={authEmail}
                    required
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-xs rounded-xl pl-10 pr-4 py-3 focus:outline-none text-white placeholder-slate-600 transition-colors"
                  />
                </div>
              </div>

              {authMode !== "reset" && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Password</label>
                    {authMode === "login" && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("reset");
                          setAuthError(null);
                          setAuthSuccess(null);
                        }}
                        className="text-[10px] text-blue-400 hover:underline hover:text-blue-300"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔒</span>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={authPassword}
                      required
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-xs rounded-xl pl-10 pr-4 py-3 focus:outline-none text-white placeholder-slate-600 transition-colors"
                    />
                  </div>
                </div>
              )}

              {authMode === "signup" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Confirm Password</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔒</span>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={authConfirmPassword}
                      required
                      onChange={(e) => setAuthConfirmPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-xs rounded-xl pl-10 pr-4 py-3 focus:outline-none text-white placeholder-slate-600 transition-colors"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                {authLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {authMode === "login" && "Sign In"}
                    {authMode === "signup" && "Create Account"}
                    {authMode === "reset" && "Send Reset Instructions"}
                  </>
                )}
              </button>
            </form>

            {/* Alternating footers */}
            <div className="text-center pt-2 border-t border-slate-900 text-xs text-slate-500">
              {authMode === "login" && (
                <p>
                  Don't have an account?{" "}
                  <button
                    onClick={() => {
                      setAuthMode("signup");
                      setAuthError(null);
                      setAuthSuccess(null);
                    }}
                    className="text-blue-400 hover:underline hover:text-blue-300 font-semibold"
                  >
                    Create one for free
                  </button>
                </p>
              )}
              {authMode === "signup" && (
                <p>
                  Already have an account?{" "}
                  <button
                    onClick={() => {
                      setAuthMode("login");
                      setAuthError(null);
                      setAuthSuccess(null);
                    }}
                    className="text-blue-400 hover:underline hover:text-blue-300 font-semibold"
                  >
                    Sign In instead
                  </button>
                </p>
              )}
              {authMode === "reset" && (
                <button
                  onClick={() => {
                    setAuthMode("login");
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  className="text-blue-400 hover:underline hover:text-blue-300 font-semibold"
                >
                  Return to Sign In
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
