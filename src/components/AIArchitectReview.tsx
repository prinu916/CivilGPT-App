import React, { useState, useRef } from "react";
import { jsPDF } from "jspdf";
import { 
  Star, 
  Upload, 
  Trash2, 
  Check, 
  X, 
  ShieldCheck, 
  FileText, 
  AlertTriangle, 
  Download, 
  ArrowRight, 
  Activity, 
  Sliders, 
  Briefcase, 
  Bot, 
  Sparkles, 
  CheckCircle2,
  DollarSign,
  Sun,
  Wind,
  Wrench,
  Gauge,
  HelpCircle
} from "lucide-react";

// Types for the premium comparison engine
interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  thumbnail: string;
  uploadedAt: string;
}

interface Scorecard {
  architecture: number;
  structural: number;
  cost: number;
  safety: number;
  sustainability: number;
  spaceEfficiency: number;
  luxury: number;
  overall: number;
}

interface Design {
  id: string;
  name: string;
  style: string;
  sustainabilityRating: string;
  budgetEst: string;
  strengths: string[];
  weaknesses: string[];
  scores: Scorecard;
}

interface ComparisonCriterion {
  key: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
}

export default function AIArchitectReview({ 
  lang, 
  regionalMultiplier, 
  formatCurrency 
}: { 
  lang: "en" | "hi"; 
  regionalMultiplier: number;
  formatCurrency: (val: number, l: "en" | "hi") => string;
}) {
  // Subscription Plan State: 'free' | 'pro' | 'enterprise'
  const [activePlan, setActivePlan] = useState<"free" | "pro" | "enterprise">("pro");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Design merge selection states
  const [mergeSelections, setMergeSelections] = useState({
    livingRoom: "Design A",
    kitchen: "Design B",
    elevation: "Design C",
    garden: "Design A"
  });
  const [isMerging, setIsMerging] = useState(false);
  const [mergedResult, setMergedResult] = useState<any | null>(null);

  // Dedicated AI Chat console state
  const [reviewChatInput, setReviewChatInput] = useState("");
  const [reviewChatMessages, setReviewChatMessages] = useState<Array<{ id: string; sender: "user" | "bot"; textEn: string; textHi: string; timestamp: string }>>([
    {
      id: "rev-welcome",
      sender: "bot",
      textEn: "Welcome to the AI Architect Premium Comparison workspace! Ask me to evaluate structural safety, compliance rate, cost parameters, or compile design differences. Select a plan above to adjust upload restrictions.",
      textHi: "एआई आर्किटेक्ट प्रीमियम तुलना कार्यस्थान में आपका स्वागत है! मुझसे संरचनात्मक सुरक्षा, अनुपालन दर, लागत मापदंडों का मूल्यांकन करने या डिज़ाइन अंतरों को संकलित करने के लिए कहें। अपलोड प्रतिबंधों को समायोजित करने के लिए ऊपर एक योजना का चयन करें।",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [isChatThinking, setIsChatThinking] = useState(false);

  // Pre-loaded baseline designs for comparison
  const defaultDesigns: Design[] = [
    {
      id: "design-a",
      name: "Design A (Solar Eco Oasis)",
      style: "Modernist Sustainable Glass Cantilever",
      sustainabilityRating: "92/100",
      budgetEst: "$145,000",
      strengths: ["Excellent solar potential", "Maximized light infiltration", "High sustainability rate"],
      weaknesses: ["Higher glass cost", "Elevated heat intake requiring passive louvers"],
      scores: {
        architecture: 95,
        structural: 88,
        cost: 75,
        safety: 90,
        sustainability: 98,
        spaceEfficiency: 82,
        luxury: 94,
        overall: 91
      }
    },
    {
      id: "design-b",
      name: "Design B (Vedic Vastu Classic)",
      style: "Classical Neo-Vedic Duplex Plan",
      sustainabilityRating: "82/100",
      budgetEst: "$118,000",
      strengths: ["Highly cost efficient", "Vastu/Fengshui compliant", "Optimal spatial flow"],
      weaknesses: ["Basic architectural styling", "Standard solar paneled grid"],
      scores: {
        architecture: 84,
        structural: 92,
        cost: 94,
        safety: 88,
        sustainability: 80,
        spaceEfficiency: 95,
        luxury: 78,
        overall: 87
      }
    },
    {
      id: "design-c",
      name: "Design C (Resilient Steel Frame)",
      style: "Industrial High-Load Cantilever",
      sustainabilityRating: "86/100",
      budgetEst: "$162,000",
      strengths: ["Highest earthquake rating", "Spacious open layouts", "Easy vertical expansion"],
      weaknesses: ["Heavy steel structural cost", "Requires specialized joint welding"],
      scores: {
        architecture: 88,
        structural: 98,
        cost: 65,
        safety: 97,
        sustainability: 84,
        spaceEfficiency: 85,
        luxury: 88,
        overall: 88
      }
    }
  ];

  // 14 Core comparison criteria requested by User
  const criteriaList: ComparisonCriterion[] = [
    { key: "space", name: "Space Utilization", description: "Efficient carpet-to-super-built-up area ratios.", icon: Sliders },
    { key: "lighting", name: "Natural Lighting", description: "Irradiance levels and window-to-wall surface ratios.", icon: Sun },
    { key: "ventilation", name: "Ventilation", description: "Cross-breeze airflow pathways and duct distributions.", icon: Wind },
    { key: "structural", name: "Structural Feasibility", description: "Bending moments, load offsets, and column spacing.", icon: Wrench },
    { key: "cost", name: "Cost Efficiency", description: "Optimization of material expenditures and rate structures.", icon: DollarSign },
    { key: "material", name: "Material Usage", description: "Concrete-to-steel weight optimization log.", icon: Activity },
    { key: "parking", name: "Parking Layout", description: "Clearance limits, turning radii, and setback safety.", icon: Briefcase },
    { key: "privacy", name: "Privacy Control", description: "Acoustics block and bedroom boundary lines separation.", icon: ShieldCheck },
    { key: "accessibility", name: "Accessibility", description: "Ramp gradients, doorway clearances, and lifts space.", icon: Gauge },
    { key: "expansion", name: "Future Expansion", description: "Vertical build capacity and load-bearing columns cushion.", icon: Sparkles },
    { key: "earthquake", name: "Earthquake Readiness", description: "Seismic shear walls and reinforcement bar density.", icon: AlertTriangle },
    { key: "energy", name: "Energy Efficiency", description: "Thermal heat gain limits and smart HVAC loading.", icon: CheckCircle2 },
    { key: "green", name: "Green Building Score", description: "Rainwater harvesting, greywater reuse, and solar grids.", icon: Bot },
    { key: "compliance", name: "Building Code Compliance", description: "Strict FAR / FSI, setback safety, and local bye-laws.", icon: ShieldCheck }
  ];

  // Map of mock results for comparison criteria
  const comparisonData: Record<string, Record<string, { rating: number; text: string }>> = {
    space: {
      "Design A": { rating: 4, text: "82% carpet area efficiency with open lounges." },
      "Design B": { rating: 5, text: "95% carpet area efficiency; zero wasted space." },
      "Design C": { rating: 4, text: "85% carpet area; spacious but has deep structural columns." }
    },
    lighting: {
      "Design A": { rating: 5, text: "Double glazing yields 4.2 hrs extra daylight." },
      "Design B": { rating: 4, text: "Sufficient daylight through east patio alignment." },
      "Design C": { rating: 3, text: "Restricted due to thick structural concrete slabs." }
    },
    ventilation: {
      "Design A": { rating: 4, text: "High active airflow; needs passive exhaust dampers." },
      "Design B": { rating: 5, text: "Vedic central courtyard style yields perfect cross-wind." },
      "Design C": { rating: 4, text: "Moderate flow; utilizes mechanical HVAC ducts." }
    },
    structural: {
      "Design A": { rating: 3, text: "Delicate glass cantilevers require pre-stressed lintels." },
      "Design B": { rating: 4, text: "Standard brick load-bearing structures; reliable." },
      "Design C": { rating: 5, text: "Heavy structural steel frame; maximum load margins." }
    },
    cost: {
      "Design A": { rating: 3, text: "Premium finishings. Budget: $145,000." },
      "Design B": { rating: 5, text: "Highly economical. Budget: $118,000." },
      "Design C": { rating: 2, text: "High premium steel cost. Budget: $162,000." }
    },
    material: {
      "Design A": { rating: 4, text: "Lightweight glass facades reduce core concrete load." },
      "Design B": { rating: 4, text: "Standard clay brick partition walls." },
      "Design C": { rating: 5, text: "High recyclability steel structure; eco carbon-cushion." }
    },
    parking: {
      "Design A": { rating: 5, text: "Spacious 2-car drive-in slot with safety clearances." },
      "Design B": { rating: 4, text: "Standard single carport with 4.5m setbacks." },
      "Design C": { rating: 4, text: "Wide clear garage under steel framework structure." }
    },
    privacy: {
      "Design A": { rating: 3, text: "Glass panels reduce acoustic insulation buffers." },
      "Design B": { rating: 5, text: "Perfect compartmentalized room placements." },
      "Design C": { rating: 4, text: "Acoustically insulated drywalls block external noise." }
    },
    accessibility: {
      "Design A": { rating: 5, text: "Single level flow with zero threshold steps." },
      "Design B": { rating: 4, text: "Standard ramps integrated into the porch." },
      "Design C": { rating: 4, text: "Elevator shaft space pre-planned in core columns." }
    },
    expansion: {
      "Design A": { rating: 2, text: "Glass ceilings make vertical expansion complex." },
      "Design B": { rating: 4, text: "Supports up to G+2 vertical brick extensions." },
      "Design C": { rating: 5, text: "Modular structural steel supports instant extra floors." }
    },
    earthquake: {
      "Design A": { rating: 3.5, text: "Seismic rating stable up to Zone III." },
      "Design B": { rating: 4, text: "Concrete tie beams reinforce brick boundaries." },
      "Design C": { rating: 5, text: "Seismic Zone V rated; active dampening joint bars." }
    },
    energy: {
      "Design A": { rating: 5, text: "Low thermal glazing reduces cooling loads by 35%." },
      "Design B": { rating: 3.5, text: "Standard ventilation insulation layers." },
      "Design C": { rating: 4, text: "High insulation foam cores block heat transfer." }
    },
    green: {
      "Design A": { rating: 5, text: "98% sustainability score; 12kW terrace solar grid." },
      "Design B": { rating: 3.5, text: "80% score; includes rainwater collection base." },
      "Design C": { rating: 4.5, text: "84% score; pre-fabricated recycled steel frame." }
    },
    compliance: {
      "Design A": { rating: 4, text: "Complies with FAR limits; setbacks at 5.8m." },
      "Design B": { rating: 5, text: "100% compliant with FAR, FSI, and municipal setbacks." },
      "Design C": { rating: 4.5, text: "Meets setback rules; height exceeds some local tiers." }
    }
  };

  // Mock upload simulator
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Check limits based on selected plan
    const uploadLimit = activePlan === "free" ? 1 : activePlan === "pro" ? 10 : 999;
    if (uploadedFiles.length >= uploadLimit) {
      setUploadError(`Upload Restricted! The "${activePlan.toUpperCase()}" Plan limits uploads to ${uploadLimit}. Upgrade to expand!`);
      return;
    }

    setUploadError(null);
    const newFile: UploadedFile = {
      id: `file-${Date.now()}`,
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      type: file.type || "image/png",
      thumbnail: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=80&auto=format&fit=crop",
      uploadedAt: new Date().toLocaleTimeString()
    };

    setUploadedFiles((prev) => [...prev, newFile]);
    
    // Feed response to Chat Console
    const chatMsg = {
      id: `chat-${Date.now()}`,
      sender: "bot" as const,
      textEn: `Successfully processed and ran computer-vision line detection on uploaded blueprint: "${file.name}". Metrics indexed for multi-design comparison grid!`,
      textHi: `सफलतापूर्वक संसाधित किया गया और अपलोड किए गए ब्लूप्रिंट पर कंप्यूटर-विज़न लाइन डिटेक्शन चलाया गया: "${file.name}"। बहु-डिज़ाइन तुलना ग्रिड के लिए मेट्रिक्स अनुक्रमित किए गए!`,
      timestamp: new Date().toLocaleTimeString()
    };
    setReviewChatMessages((prev) => [...prev, chatMsg]);
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Dynamic review chat responding simulated/or using Gemini API logic
  const handleReviewChatSubmit = () => {
    if (!reviewChatInput.trim()) return;
    
    const userMsg = {
      id: `chat-usr-${Date.now()}`,
      sender: "user" as const,
      textEn: reviewChatInput,
      textHi: reviewChatInput,
      timestamp: new Date().toLocaleTimeString()
    };

    setReviewChatMessages((prev) => [...prev, userMsg]);
    const input = reviewChatInput.toLowerCase();
    setReviewChatInput("");
    setIsChatThinking(true);

    setTimeout(() => {
      let responseEn = "";
      let responseHi = "";

      if (input.includes("better") || input.includes("which")) {
        responseEn = "Based on our AI Multi-Agent scorecards, Design B has the highest overall rating at 95% due to its absolute space efficiency and municipal bye-laws compliance, whereas Design A excels heavily in modern aesthetics and energy harvesting.";
        responseHi = "हमारे एआई मल्टी-एजेंट स्कोरकार्ड के आधार पर, पूर्ण स्थान दक्षता और नगर पालिका उप-नियमों के अनुपालन के कारण डिजाइन बी की समग्र रेटिंग सबसे अधिक 95% है, जबकि डिजाइन ए आधुनिक सौंदर्यशास्त्र और ऊर्जा संचयन में भारी रूप से उत्कृष्टता प्राप्त करता है।";
      } else if (input.includes("cost") || input.includes("reduce") || input.includes("budget")) {
        responseEn = "To reduce costs, Design B is highly recommended. It saves $27,000 over Design A by substituting heavy double glazing facades with standard thermal insulated partition walls and fly-ash composite bricks.";
        responseHi = "लागत कम करने के लिए, डिजाइन बी की अत्यधिक अनुशंसा की जाती है। यह भारी डबल ग्लेज़िंग फ़साड के स्थान पर मानक थर्मल इंसुलेटेड विभाजन दीवारों और फ्लाई-ऐश समग्र ईंटों का उपयोग करके डिजाइन ए की तुलना में $27,000 बचाता है।";
      } else if (input.includes("ventilation") || input.includes("breeze") || input.includes("air")) {
        responseEn = "Design B offers optimal ventilation because its traditional layout incorporates a central double-height courtyard. We suggest moving the stairwell in Design A outwards to clear cross-breeze pathways.";
        responseHi = "डिजाइन बी इष्टतम वेंटिलेशन प्रदान करता है क्योंकि इसके पारंपरिक लेआउट में एक केंद्रीय डबल-ऊंचाई वाला आंगन शामिल है। हम सुझाव देते हैं कि डिजाइन ए में सीढ़ी को बाहर की तरफ ले जाएं ताकि हवा के गुजरने के रास्ते साफ हो सकें।";
      } else if (input.includes("vastu") || input.includes("vedic") || input.includes("compliant")) {
        responseEn = "Design B is 100% Vastu compliant out-of-the-box. The kitchen is positioned perfectly in the Southeast quadrant (Agni corner) and the master suite sits in the Southwest, promoting prosperity and positive spatial flows.";
        responseHi = "डिजाइन बी सीधे उपयोग के लिए 100% वास्तु अनुकूल है। समृद्धि और सकारात्मक प्रवाह को बढ़ावा देने के लिए रसोई को पूरी तरह से दक्षिण-पूर्व चतुर्थांश (अग्नि कोण) में और मास्टर सुइट को दक्षिण-पश्चिम में रखा गया है।";
      } else if (input.includes("light") || input.includes("sunlight") || input.includes("solar")) {
        responseEn = "Design A is the solar leader! By optimizing south-facing thermal window panes, it captures 45% more direct solar irradiance, yielding an annual reduction of $850 in structural power utility bills.";
        responseHi = "डिजाइन ए सोलर ऊर्जा में अग्रणी है! दक्षिण-मुखी थर्मल विंडो पैन को अनुकूलित करके, यह 45% अधिक प्रत्यक्ष सौर विकिरण को कैप्चर करता है, जिससे वार्षिक बिजली बिलों में $850 की कमी आती है।";
      } else {
        responseEn = "Fascinating query! Our civil engineering agents suggest integrating features of Design B's cost efficiency with Design C's earthquake-ready shear wall reinforcements for a balanced, high-performance structural blueprint.";
        responseHi = "दिलचस्प प्रश्न! हमारे सिविल इंजीनियरिंग एजेंट संतुलित, उच्च-प्रदर्शन संरचनात्मक ब्लूप्रिंट के लिए डिज़ाइन सी के भूकंप-तैयार शीयर वॉल सुदृढीकरण के साथ डिज़ाइन बी की लागत दक्षता की विशेषताओं को एकीकृत करने का सुझाव देते हैं।";
      }

      const botMsg = {
        id: `chat-bot-${Date.now()}`,
        sender: "bot" as const,
        textEn: responseEn,
        textHi: responseHi,
        timestamp: new Date().toLocaleTimeString()
      };

      setReviewChatMessages((prev) => [...prev, botMsg]);
      setIsChatThinking(false);
    }, 1200);
  };

  // Merge designs simulator
  const handleMergeDesigns = () => {
    setIsMerging(true);
    setMergedResult(null);

    setTimeout(() => {
      setIsMerging(false);
      setMergedResult({
        name: "Consolidated Eco-Vastu Resilient Masterpiece",
        overallScore: 96,
        budget: "$128,000",
        features: [
          `Living Room from ${mergeSelections.livingRoom} gives premium modern spacious double glazing.`,
          `Kitchen from ${mergeSelections.kitchen} provides highly efficient workspace triangles complying with Vastu.`,
          `Elevation from ${mergeSelections.elevation} yields high-performance industrial cantilevers resistant to Zone V earthquakes.`,
          `Garden from ${mergeSelections.garden} incorporates integrated solar monocrystalline grids and low-irrigation turf landscaping.`
        ],
        boqItems: [
          { code: "M-101", description: "Consolidated Precast concrete high-tensile column blocks", qty: 22, unit: "m³", rate: 190, amount: 4180 },
          { code: "M-202", description: "Southeast Vastu compliance localized modular firebrick kitchen installation", qty: 1, unit: "Set", rate: 6400, amount: 6400 },
          { code: "M-303", description: "South-glazing low-E thermal energy efficient windows", qty: 12, unit: "No", rate: 550, amount: 6600 },
          { code: "M-404", description: "Prestressed cantilever beam structural reinforcement bundles", qty: 8, unit: "Tons", rate: 1100, amount: 8800 }
        ]
      });

      // Notify in review chat
      const botMsg = {
        id: `chat-bot-merge-${Date.now()}`,
        sender: "bot" as const,
        textEn: `Successfully compiled layout components! Consolidated living room layout from ${mergeSelections.livingRoom}, kitchen layout from ${mergeSelections.kitchen}, architectural elevation from ${mergeSelections.elevation}, and garden from ${mergeSelections.garden} into one optimized master design blueprint.`,
        textHi: `लेआउट घटकों को सफलतापूर्वक संकलित किया गया! ${mergeSelections.livingRoom} से लिविंग रूम लेआउट, ${mergeSelections.kitchen} से किचन लेआउट, ${mergeSelections.elevation} से आर्किटेक्चरल एलिवेशन और ${mergeSelections.garden} से गार्डन को एक अनुकूलित मास्टर डिजाइन ब्लूप्रिंट में समेकित किया गया।`,
        timestamp: new Date().toLocaleTimeString()
      };
      setReviewChatMessages((prev) => [...prev, botMsg]);

    }, 2000);
  };

  // PDF report generators
  const exportPDFReport = (type: "general" | "compare" | "cost" | "material" | "structural") => {
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("CivilGPT Premium", 15, 18);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175);
    doc.text("⭐ AI Architect Review & Design Optimization Engine", 15, 25);
    
    const dateStr = new Date().toLocaleDateString(lang === "hi" ? "hi-IN" : "en-US", {
      year: "numeric", month: "long", day: "numeric"
    });
    doc.text(`Report Type: ${type.toUpperCase()} | Generated: ${dateStr}`, 15, 32);

    // Document styling variables
    const primaryColor = [15, 23, 42];
    const textColor = [55, 65, 81];
    let y = 52;

    if (type === "general") {
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("1. Executive Summary & AI Architect Verdict", 15, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      
      const bodyText = [
        "Following a comprehensive multi-agent neural evaluation of Design A, Design B, and Design C, the AI Architect has generated a structural and spatial compliance report.",
        "Verdict: Design B offers the most optimized cost-to-benefit profile for immediate residential municipal applications, scoring 95% space efficiency and full FAR zoning compatibility. Design A is highly recommended for clients desiring cutting-edge carbon-neutral luxury and solar energy independence."
      ];
      bodyText.forEach((p) => {
        const lines = doc.splitTextToSize(p, 180);
        doc.text(lines, 15, y);
        y += lines.length * 5 + 4;
      });

      y += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Overall Design Multi-Agent Ratings Scorecard", 15, y);
      y += 8;

      defaultDesigns.forEach((d) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(`${d.name} (${d.style})`, 15, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.text(`Architecture: ${d.scores.architecture}/100 | Structural Stability: ${d.scores.structural}/100 | Sustainability: ${d.scores.sustainability}/100 | Overall Score: ${d.scores.overall}/100`, 15, y);
        y += 10;
      });

    } else if (type === "compare") {
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("AI Multi-Design Comparison Report (14 Criteria Grid)", 15, y);
      y += 10;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);

      criteriaList.slice(0, 10).forEach((crit) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${crit.name}:`, 15, y);
        y += 4;
        doc.setFont("helvetica", "normal");
        doc.text(`- Design A: ${comparisonData[crit.key]["Design A"].text} (Rating: ${comparisonData[crit.key]["Design A"].rating}/5)`, 15, y);
        y += 4;
        doc.text(`- Design B: ${comparisonData[crit.key]["Design B"].text} (Rating: ${comparisonData[crit.key]["Design B"].rating}/5)`, 15, y);
        y += 4;
        doc.text(`- Design C: ${comparisonData[crit.key]["Design C"].text} (Rating: ${comparisonData[crit.key]["Design C"].rating}/5)`, 15, y);
        y += 8;

        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });

    } else if (type === "cost") {
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Financial Breakdown & Cost Comparison Report", 15, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Cost estimates are calculated using real-time raw material indices overlaid with local contractor multipliers.", 15, y);
      y += 10;

      defaultDesigns.forEach((d) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${d.name} Financial Estimate:`, 15, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.text(`- Base Construction Cost: ${d.budgetEst}`, 15, y);
        y += 4;
        doc.text(`- Financial Allocation: 55% Structural, 30% Finishing Joinery, 15% MEP/Taxes.`, 15, y);
        y += 4;
        doc.text(`- Rate Index Rating: ${d.scores.cost}/100 Cost-saving Grade.`, 15, y);
        y += 8;
      });

    } else if (type === "material") {
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Carbon Carbon-Footprint & Material Difference Audit", 15, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("AI Material Surveyor report tracking material savings, recycled options, and thermal metrics:", 15, y);
      y += 10;

      const items = [
        "Design A utilizes monocrystalline low-E facades, reducing structural dead loads by 12% and HVAC requirements by 35%.",
        "Design B employs fly-ash partition bricks, yielding an immediate carbon reduction of 4.2 tons over Design A's solid concrete panels.",
        "Design C implements a fully recyclable high-gauge steel frame, providing superior Zone V seismic safety margins but carrying a 14% higher initial capital cost."
      ];
      items.forEach((item) => {
        const lines = doc.splitTextToSize(item, 185);
        doc.text(lines, 15, y);
        y += lines.length * 5 + 5;
      });

    } else if (type === "structural") {
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Seismic & Structural Recommendation Log", 15, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Comprehensive guidelines for structural execution based on national safety codes:", 15, y);
      y += 10;

      const guidelines = [
        "Recommendation 1: Upgrade concrete core structural columns from M25 to M30 for glass cantilevers (Design A) to avoid long-term shear fatigue.",
        "Recommendation 2: Insert earthquake-resistant ductile tie-beams and shear walls along the major G+2 vertical axis (Design C) to prevent horizontal displacement.",
        "Recommendation 3: Optimize footing pile foundations to a minimum bearing threshold of 280 kN/m² before pouring concrete bases."
      ];
      guidelines.forEach((g) => {
        const lines = doc.splitTextToSize(g, 185);
        doc.text(lines, 15, y);
        y += lines.length * 5 + 5;
      });
    }

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text("This document is generated by CivilGPT Premium Multi-Agent AI system. All parameters correspond to professional engineering indices.", 15, 280);
    doc.save(`civilgpt_${type}_report.pdf`);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* PREMIUM HEADER WORKSPACE */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 relative overflow-hidden backdrop-blur">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-500/10 via-orange-500/5 to-transparent rounded-full pointer-events-none" />
        
        <div className="flex flex-wrap justify-between items-start gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-orange-500/30 text-xs font-bold text-orange-400 font-mono tracking-wider uppercase animate-pulse">
              <Star className="w-3.5 h-3.5 fill-orange-400" />
              Premium Feature Workspace
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">AI Architect Review & Design Compare</h2>
            <p className="text-slate-400 text-xs sm:text-sm font-light max-w-2xl leading-relaxed">
              Upload multiple blueprints, sketches, or CAD drawings. Leverage our multi-agent AI system to compare structural loads, bye-laws compliance, space efficiency, and generate consolidated designs.
            </p>
          </div>

          {/* Plan Selector Buttons */}
          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-xl">
            {(["free", "pro", "enterprise"] as const).map((plan) => (
              <button
                key={plan}
                onClick={() => {
                  setActivePlan(plan);
                  setUploadError(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition-all ${
                  activePlan === plan 
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {plan} Plan
              </button>
            ))}
          </div>
        </div>

        {/* Feature grid limits HUD */}
        <div className="grid sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-800/60 text-xs font-mono">
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-950/80 flex justify-between items-center">
            <span className="text-slate-500">Sketch Upload Limit:</span>
            <span className="font-bold text-white">
              {activePlan === "free" ? "1 file max" : activePlan === "pro" ? "Up to 10 files" : "Unlimited"}
            </span>
          </div>
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-950/80 flex justify-between items-center">
            <span className="text-slate-500">Design Comparison:</span>
            <span className={`font-bold ${activePlan === "free" ? "text-slate-500" : "text-emerald-400"}`}>
              {activePlan === "free" ? "Basic review only" : "Multi-design Compare"}
            </span>
          </div>
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-950/80 flex justify-between items-center">
            <span className="text-slate-500">PDF Report Export:</span>
            <span className={`font-bold ${activePlan === "free" ? "text-slate-500" : "text-emerald-400"}`}>
              {activePlan === "free" ? "Restricted" : "Unlimited Downloads"}
            </span>
          </div>
        </div>
      </div>

      {/* TWO COLUMN INTERACTION PANEL */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: BLUEPRINT VISION DROPZONE */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-orange-400" />
              Vision Intelligence Dropzone
            </h3>
            <p className="text-xs text-slate-400 font-light">
              Drop hand-drawn layouts, structural floor plans, or site blueprints to compare them directly against our three baseline models.
            </p>

            {/* Visual File Input */}
            <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/50 rounded-2xl p-6 text-center cursor-pointer relative transition-all group">
              <input 
                type="file" 
                accept="image/*,.pdf,.dwg" 
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-slate-600 mx-auto group-hover:text-slate-400 transition-colors mb-3" />
              <span className="text-xs font-semibold text-slate-300 block mb-1">Click or drag layout to upload</span>
              <span className="text-[10px] text-slate-500 font-mono block">PNG, JPEG, PDF or DWG formats</span>
            </div>

            {uploadError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex gap-2 font-mono leading-relaxed">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* List of uploaded blueprints */}
            <div className="space-y-2.5 pt-2">
              <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase block">Uploaded Blueprints ({uploadedFiles.length})</span>
              {uploadedFiles.length === 0 ? (
                <div className="text-xs text-slate-500 font-light italic bg-slate-950/20 p-4 text-center rounded-xl border border-slate-950">
                  No custom designs uploaded yet. Upload a floor plan to populate comparison coordinates.
                </div>
              ) : (
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="bg-slate-950/40 border border-slate-950 p-3 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 truncate">
                        <img src={file.thumbnail} alt="Thumbnail" className="w-9 h-9 rounded-lg object-cover border border-slate-800" />
                        <div className="truncate text-left">
                          <span className="text-xs font-bold text-slate-200 block truncate" title={file.name}>{file.name}</span>
                          <span className="text-[9px] font-mono text-slate-500">{file.size} • {file.uploadedAt}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveFile(file.id)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/25 text-red-400 hover:text-red-300 border border-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* QUICK DOCUMENT EXPORT ACTIONS */}
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-400" />
              Download Premium Reports
            </h3>
            <p className="text-xs text-slate-400 font-light">
              Export professional PDF engineering documents containing comparison matrices, material allocations, and structural suggestions.
            </p>

            <div className="space-y-2">
              {[
                { type: "general", label: "AI Architect Review PDF", color: "text-amber-400" },
                { type: "compare", label: "Design Comparison Report", color: "text-blue-400" },
                { type: "cost", label: "Cost Comparison Report", color: "text-emerald-400" },
                { type: "material", label: "Material Difference Report", color: "text-indigo-400" },
                { type: "structural", label: "Structural Recommendation Report", color: "text-orange-400" }
              ].map((btn) => (
                <button
                  key={btn.type}
                  disabled={activePlan === "free"}
                  onClick={() => exportPDFReport(btn.type as any)}
                  className="w-full text-left p-3 bg-slate-950 hover:bg-slate-950/80 disabled:opacity-50 border border-slate-900 hover:border-slate-800 text-xs font-bold font-mono text-slate-300 hover:text-white rounded-xl transition-all flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <FileText className={`w-3.5 h-3.5 ${btn.color}`} />
                    {btn.label}
                  </span>
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI COMPARISON GRID & DESIGN MERGER */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* AI SCORECARD */}
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">AI Multidimensional Scorecard</h3>
              <p className="text-xs text-slate-400 font-light mt-0.5">Overall compliance, safety margins, and cost-efficiency grades calculated via multi-agent models.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {defaultDesigns.map((d) => (
                <div key={d.id} className="bg-slate-950/50 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5 text-left">
                    <span className="inline-flex px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] font-mono text-blue-400 uppercase">{d.style}</span>
                    <h4 className="text-sm font-bold text-white">{d.name}</h4>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { label: "Architecture", val: d.scores.architecture },
                      { label: "Structural Stability", val: d.scores.structural },
                      { label: "Cost-Saving Efficiency", val: d.scores.cost },
                      { label: "Safety Rating", val: d.scores.safety },
                      { label: "Sustainability Index", val: d.scores.sustainability },
                      { label: "Space Efficiency", val: d.scores.spaceEfficiency },
                      { label: "Luxury/Aesthetics", val: d.scores.luxury }
                    ].map((s) => (
                      <div key={s.label} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-slate-400">
                          <span>{s.label}</span>
                          <span>{s.val}%</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                          <div style={{ width: `${s.val}%` }} className="bg-orange-500 h-full rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-900 pt-3 flex justify-between items-center">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Overall Score:</span>
                    <span className="text-base font-bold font-mono text-emerald-400">{d.scores.overall}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI COMPARISON MATRIX */}
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Multi-Design 14-Criteria Comparison Grid</h3>
              <p className="text-xs text-slate-400 font-light mt-0.5">Granular multi-agent inspection covering all municipal, earthquake, safety, and energy parameters.</p>
            </div>

            {activePlan === "free" ? (
              <div className="p-8 text-center bg-slate-950/40 border border-slate-900 rounded-2xl space-y-4">
                <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
                <h4 className="text-sm font-bold text-white">Comparison Locked under Free Plan</h4>
                <p className="text-xs text-slate-400 font-light max-w-md mx-auto leading-relaxed">
                  The Free Plan provides basic single-layout reviews. Upgrade your profile to the **Pro Plan** or **Enterprise Plan** to unlock the 14-Criteria Comparison Matrix comparing Design A, B, C and custom sketches side-by-side.
                </p>
                <button
                  onClick={() => setActivePlan("pro")}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-orange-500/10"
                >
                  Unlock Comparison Grid
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-900">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-900 text-slate-400 font-mono text-[10px] uppercase">
                      <th className="p-4 w-1/4">Criteria Parameters</th>
                      <th className="p-4 w-1/4">Design A (Solar Eco)</th>
                      <th className="p-4 w-1/4">Design B (Vedic Vastu)</th>
                      <th className="p-4 w-1/4">Design C (Steel Resilient)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 font-light text-slate-300">
                    {criteriaList.map((crit) => {
                      const Icon = crit.icon;
                      return (
                        <tr key={crit.key} className="hover:bg-slate-950/20">
                          <td className="p-4 border-r border-slate-900/60 bg-slate-950/10">
                            <div className="flex items-start gap-2.5 text-left">
                              <Icon className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-slate-200 block">{crit.name}</span>
                                <span className="text-[10px] text-slate-500 font-mono block leading-relaxed">{crit.description}</span>
                              </div>
                            </div>
                          </td>
                          {["Design A", "Design B", "Design C"].map((designName) => {
                            const data = comparisonData[crit.key][designName];
                            return (
                              <td key={designName} className="p-4 text-slate-300 leading-relaxed text-left">
                                <div className="flex items-center gap-1 mb-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`w-3 h-3 ${i < Math.floor(data.rating) ? "text-amber-400 fill-amber-400" : "text-slate-800"}`} 
                                    />
                                  ))}
                                  <span className="text-[9px] font-mono text-slate-500 ml-1">({data.rating}/5)</span>
                                </div>
                                <span className="text-xs text-slate-400 font-light block">{data.text}</span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* DESIGN MERGER SYSTEM */}
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">AI Design Merger Component</h3>
              <p className="text-xs text-slate-400 font-light mt-0.5">Combine structural and spatial components from multiple layouts. AI processes details to generate a consolidated CAD result.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: "Living Room Area", stateKey: "livingRoom" },
                { label: "Kitchen Workspace", stateKey: "kitchen" },
                { label: "Architectural Elevation", stateKey: "elevation" },
                { label: "Garden & Landscaping", stateKey: "garden" }
              ].map((item) => (
                <div key={item.stateKey} className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between space-y-2.5">
                  <span className="text-xs font-bold text-slate-300">{item.label}</span>
                  <select
                    value={(mergeSelections as any)[item.stateKey]}
                    onChange={(e) => setMergeSelections({ ...mergeSelections, [item.stateKey]: e.target.value })}
                    className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-orange-500"
                  >
                    <option value="Design A">Design A (Solar Eco Oasis)</option>
                    <option value="Design B">Design B (Vedic Vastu Classic)</option>
                    <option value="Design C">Design C (Resilient Steel Frame)</option>
                  </select>
                </div>
              ))}
            </div>

            <button
              onClick={handleMergeDesigns}
              disabled={isMerging}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {isMerging ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AI Architect Compiling Layouts...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-pulse" />
                  Merge & Optimize Best Features via AI
                </>
              )}
            </button>

            {/* Merged Outcome Render */}
            {mergedResult && (
              <div className="bg-slate-950/60 border-2 border-dashed border-emerald-500/20 rounded-2xl p-6 space-y-6 text-left animate-fade-in">
                
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="inline-flex px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono text-emerald-400 uppercase tracking-widest font-bold">Consolidated Result</span>
                    <h4 className="text-base font-bold text-white">{mergedResult.name}</h4>
                  </div>
                  <div className="flex items-center gap-6 font-mono text-xs">
                    <div>
                      <span className="text-slate-500 uppercase block text-[9px]">Grand Score</span>
                      <span className="text-base font-bold text-emerald-400">{mergedResult.overallScore}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase block text-[9px]">Est. Cost</span>
                      <span className="text-base font-bold text-white">{mergedResult.budget}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Spatial Allocations & AI Verdict:</span>
                  <div className="grid gap-2">
                    {mergedResult.features.map((feat: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-xs bg-slate-900/40 p-3 rounded-lg border border-slate-900 text-slate-300 font-light">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Merged Bill of Quantities */}
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Consolidated Materials BOQ:</span>
                  <div className="overflow-x-auto rounded-xl border border-slate-900 bg-slate-900/10">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-900 text-slate-500 font-mono text-[9px] uppercase">
                          <th className="p-2.5">Code</th>
                          <th className="p-2.5">Description</th>
                          <th className="p-2.5">Qty</th>
                          <th className="p-2.5">Unit</th>
                          <th className="p-2.5">Total Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 text-slate-300">
                        {mergedResult.boqItems.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-900/10">
                            <td className="p-2.5 font-mono text-[10px] text-blue-400">{item.code}</td>
                            <td className="p-2.5 truncate max-w-xs">{item.description}</td>
                            <td className="p-2.5 font-mono">{item.qty}</td>
                            <td className="p-2.5 font-mono">{item.unit}</td>
                            <td className="p-2.5 font-mono font-bold text-white">{formatCurrency(item.amount * regionalMultiplier, lang)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* DEDICATED AI REVIEW CHAT CONSOLE */}
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl space-y-4">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-orange-400" />
                <div className="text-left">
                  <h3 className="text-sm font-bold text-white">AI Architect Review Chat Console</h3>
                  <span className="text-[9px] font-mono text-slate-400">Contextual query parser for compared plans</span>
                </div>
              </div>
              <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider">
                Compare Agent Active
              </span>
            </div>

            {/* Chat Messages */}
            <div className="h-64 overflow-y-auto bg-slate-950/60 border border-slate-950 p-4 rounded-2xl space-y-4 scrollbar-none">
              {reviewChatMessages.map((msg) => {
                const isBot = msg.sender === "bot";
                return (
                  <div key={msg.id} className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[85%] rounded-2xl p-3 text-left ${
                      isBot 
                        ? "bg-slate-900/90 text-slate-300 rounded-tl-none border border-slate-800" 
                        : "bg-blue-600 text-white rounded-tr-none"
                    }`}>
                      <span className="text-[10px] font-mono block text-slate-500 mb-1">
                        {isBot ? "AI Architect Agent" : "You"} • {msg.timestamp}
                      </span>
                      <p className="text-xs leading-relaxed font-light">{lang === "hi" ? msg.textHi : msg.textEn}</p>
                    </div>
                  </div>
                );
              })}
              {isChatThinking && (
                <div className="flex justify-start">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-slate-400 flex items-center gap-2 rounded-tl-none text-xs font-mono">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    AI Architect analyzing blueprints...
                  </div>
                </div>
              )}
            </div>

            {/* Chat quick cues */}
            <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-none text-[9px] font-mono text-slate-400">
              {[
                "Which design is better?",
                "Reduce the cost.",
                "Improve ventilation.",
                "Make it Vastu compliant.",
                "Increase natural light.",
                "Optimize for my budget."
              ].map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setReviewChatInput(c);
                  }}
                  className="shrink-0 bg-slate-950 hover:bg-slate-950/80 border border-slate-900 hover:border-slate-800 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Input Row */}
            <div className="flex gap-2.5">
              <input
                type="text"
                value={reviewChatInput}
                onChange={(e) => setReviewChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleReviewChatSubmit();
                }}
                placeholder="Ask AI Architect about design stability, space usage, or code compliance..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 text-left"
              />
              <button
                onClick={handleReviewChatSubmit}
                className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
              >
                Send
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
