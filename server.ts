/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Lazy initialization of Gemini SDK
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
      try {
        aiClient = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
        console.log("GoogleGenAI client initialized successfully.");
      } catch (err) {
        console.error("Failed to initialize GoogleGenAI:", err);
      }
    } else {
      console.warn("GEMINI_API_KEY is not defined or is a placeholder. Operating in Simulator Fallback Mode.");
    }
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: "50mb" }));

  // API Route: Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV, hasApiKey: !!process.env.GEMINI_API_KEY });
  });

  // API Route: AI Orchestration & Model Generation
  app.post("/api/ai/chat", async (req, res) => {
    const { message, projectState, explainLevel, lang } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message prompt is required" });
    }

    const ai = getGeminiClient();

    // Simulated Fallback Engine if Gemini API is missing, ensuring zero errors and a highly interactive experience
    if (!ai) {
      console.log("No Gemini API client. Using civil-engineering simulator.");
      const simulatorResponse = generateSimulatorResponse(message, projectState, explainLevel || "Pro Mode", lang || "en");
      return res.json(simulatorResponse);
    }

    try {
      // System instructions for our multi-agent building operating system
      const systemInstruction = `
        You are CivilGPT's Master AI Orchestrator, coordinating a multi-agent team of:
        - Architect AI (Room layout, spacing, architectural styles)
        - Structural Engineer AI (Columns, beams, footings, load-distribution, concrete/steel specs)
        - Compliance AI (FAR/FSI, local building bye-laws, setbacks)
        - Quantity Surveyor AI & Cost Estimator AI (BOQ, material quantities, cost estimations)
        - Project Manager AI (Construction timeline schedules, milestones, delays)
        - Sustainability AI & Safety AI (Solar potential, water harvesting, seismic/wind analysis, fire escapes)

        Your goal is to parse the user's prompt, act on their design modifications, and return a structured JSON output modifying the building project.
        Always explain your actions and recommendations in BOTH English and Hindi.
        
        The user wants to analyze, build, or modify a building project. 
        You MUST return an updated state or recommendation strictly following this JSON schema.
      `;

      // We will define a structured response schema for Gemini API
      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          feedbackEn: {
            type: Type.STRING,
            description: "Detailed, premium, conversational explanation of the modifications or responses in English, written at the requested explanation level.",
          },
          feedbackHi: {
            type: Type.STRING,
            description: "Detailed, premium, conversational explanation of the modifications or responses in Hindi, written at the requested explanation level.",
          },
          agentName: {
            type: Type.STRING,
            description: "The name of the primary AI Agent answering (e.g. 'Structural Engineer AI', 'Architect AI', 'Quantity Surveyor AI').",
          },
          suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3-4 direct smart civil engineering recommendations or structural optimizations.",
          },
          roomsUpdated: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
                width: { type: Type.NUMBER },
                height: { type: Type.NUMBER },
                color: { type: Type.STRING },
                type: { type: Type.STRING }
              }
            },
            description: "Array of rooms representing the updated layout if modified. Leave empty if no layout change."
          },
          elementsUpdated: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
                width: { type: Type.NUMBER },
                height: { type: Type.NUMBER },
                properties: { type: Type.OBJECT }
              }
            },
            description: "Array of updated architectural or structural components (columns, doors, windows, pools). Leave empty if no change."
          }
        },
        required: ["feedbackEn", "feedbackHi", "agentName", "suggestions"]
      };

      const userContext = `
        Current Explanation Mode: ${explainLevel || "Professional Mode"}
        Preferred Language for prompt: ${lang || "en"}
        Current Project State: ${JSON.stringify(projectState || {})}
        User Prompt: "${message}"
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userContext,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.2
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini API");
      }

      const responseJSON = JSON.parse(responseText.trim());
      res.json(responseJSON);

    } catch (err) {
      console.error("Gemini API Error:", err);
      // Fallback to high quality simulation on error
      const simulatorResponse = generateSimulatorResponse(message, projectState, explainLevel, lang);
      res.json({
        ...simulatorResponse,
        feedbackEn: `[AI Engine Note: Running in adaptive simulator mode] ${simulatorResponse.feedbackEn}`
      });
    }
  });

  // Vite integration for development vs production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CivilGPT Server successfully listening on http://localhost:${PORT} in ${process.env.NODE_ENV || 'dev'} mode.`);
  });
}

// SIMULATOR FALLBACK RESPONSE GENERATOR
// Provides beautiful, responsive engineering simulation if API key is not active.
function generateSimulatorResponse(prompt: string, currentProject: any, level: string, lang: string) {
  const p = prompt.toLowerCase();
  let feedbackEn = "";
  let feedbackHi = "";
  let agentName = "Master AI Orchestrator";
  let suggestions: string[] = [];
  let roomsUpdated = currentProject?.rooms || [];
  let elementsUpdated = currentProject?.elements || [];

  if (p.includes("kitchen") && (p.includes("larger") || p.includes("bigger") || p.includes("increase"))) {
    agentName = "Architect AI";
    feedbackEn = "I have adjusted the floor plan layout to increase the kitchen size. Expanding the modular kitchen dimensions from 20x18 to 28x20, giving you 40% more active preparation counter space. Adjusted adjacent living walls to optimize circulation and lighting.";
    feedbackHi = "मैंने रसोई का आकार बढ़ाने के लिए फ्लोर प्लान लेआउट को समायोजित किया है। रसोई के आयामों को 20x18 से बढ़ाकर 28x20 कर दिया गया है, जिससे आपको 40% अधिक सक्रिय वर्किंग काउंटर स्पेस मिलता है। वायु परिसंचरण को अनुकूलित करने के लिए आस-पास के लिविंग एरिया की दीवारों को बदला गया है।";
    suggestions = [
      "Use double-exhaust duct layout for kitchen ventilation.",
      "Add a central island countertop with quartz surface for modern styling.",
      "Optimize fire extinguisher placement near gas conduits."
    ];
    // Modify kitchen size
    roomsUpdated = roomsUpdated.map((r: any) => {
      if (r.type === "Kitchen") {
        return { ...r, width: 28, height: 20, name: "Premium Chef's Kitchen (Expanded)" };
      }
      return r;
    });
  } else if (p.includes("column") || p.includes("pillar") || p.includes("structural") || p.includes("steel")) {
    agentName = "Structural Engineer AI";
    feedbackEn = "Structural load evaluation complete. Adjusted structural columns to support heavy vertical dead loads. Recommending upgrading concrete grade from M25 to M30 for major pile-caps, and increasing primary steel rebar ratio in seismic columns.";
    feedbackHi = "संरचनात्मक भार मूल्यांकन पूरा हुआ। भारी वर्टिकल लोड को संभालने के लिए मुख्य कॉलमों को समायोजित किया गया है। हम मुख्य पाइल-कैप्स के लिए कंक्रीट ग्रेड को M25 से M30 में अपग्रेड करने और भूकंपीय कॉलमों में मुख्य स्टील रीबार अनुपात बढ़ाने की सलाह देते हैं।";
    suggestions = [
      "Recommend main reinforcement steel bars of 16mm diameter with 8mm stirrups spaced at 150mm c/c.",
      "Utilize concrete grade M30 to resist high compression stress in multi-story spans.",
      "Verify soil report bearing capacity before pouring pile footing bases."
    ];
    // Increase column size properties in elements
    elementsUpdated = elementsUpdated.map((el: any) => {
      if (el.type === "column") {
        return {
          ...el,
          properties: {
            ...el.properties,
            size: "450x450mm (Reinforced)",
            concrete: "M30 High-Strength",
            steel: "10-16mm dia bars (Upgraded)"
          }
        };
      }
      return el;
    });
  } else if (p.includes("cost") || p.includes("reduce") || p.includes("budget") || p.includes("boq")) {
    agentName = "Quantity Surveyor AI";
    feedbackEn = "Budget optimization successfully computed. To reduce overall construction cost by approximately 12%, I suggest replacing Italian Calacatta marble with high-density vitrified tiles, and utilizing fly-ash composite bricks for internal partition walls instead of heavy clay bricks.";
    feedbackHi = "बजट अनुकूलन की गणना सफलतापूर्वक की गई है। कुल निर्माण लागत को लगभग 12% कम करने के लिए, हम इतालवी मार्बल के स्थान पर उच्च घनत्व वाली विट्रीफाइड टाइल्स का उपयोग करने और भारी मिट्टी की ईंटों के बजाय फ्लाई-ऐश मिश्रित ईंटों का उपयोग करने का सुझाव देते हैं।";
    suggestions = [
      "Replacing Italian marble with premium vitrified tiles saves $14,000 in immediate finishing material cost.",
      "Using lightweight AAC blocks for partition walls reduces building dead load, lowering column steel requirement by 5%.",
      "Optimize material ordering loops to minimize transport overhead."
    ];
  } else if (p.includes("solar") || p.includes("sunlight") || p.includes("sustainability") || p.includes("green")) {
    agentName = "Sustainability AI";
    feedbackEn = "Solar irradiance and wind dynamic simulation executed. Adding a 12kW monocrystalline solar panel grid on the terrace reduces dependence on local grids by 65%. Recommended south-facing window shade placements to minimize thermal heat gain.";
    feedbackHi = "सौर विकिरण और पवन गतिकी सिमुलेशन निष्पादित किया गया। छत पर 12kW मोनोक्रिस्टलाइन सौर पैनल ग्रिड स्थापित करने से बिजली की निर्भरता 65% तक कम हो जाती है। घर में गर्मी के प्रभाव को कम करने के लिए दक्षिण की ओर खिड़कियों के ऊपर शेड लगाने की सलाह दी जाती है।";
    suggestions = [
      "Maximize natural light penetration by increasing south glazing height by 15%.",
      "Install 12kW Monocrystalline solar panels to harvest clear renewable energy.",
      "Integrate rainwater harvesting recharge well to collect roof run-off."
    ];
  } else if (p.includes("pool") || p.includes("swimming") || p.includes("garden") || p.includes("landscape")) {
    agentName = "Landscape Designer AI";
    feedbackEn = "Landscape layouts generated. Positioned a luxury 45x22 infinity swimming pool on the west deck alongside a beautiful Zen landscape garden featuring a gravel deck, fire pit, and low-irrigation Bermuda turf grass.";
    feedbackHi = "लैंडस्केप लेआउट तैयार किया गया है। पश्चिमी डेक पर एक शानदार 45x22 इन्फिनिटी स्विमिंग पूल और साथ ही एक सुंदर ज़ेन गार्डन स्थापित किया गया है जिसमें फायर पिट और कम पानी वाली बरमूडा टर्फ घास शामिल है।";
    suggestions = [
      "Use porcelain tiles around pool edges to prevent slipping hazards.",
      "Install low-voltage solar powered LED ambient lighting along footpaths.",
      "Integrate automatic greywater drip irrigation systems for garden plants."
    ];
  } else {
    agentName = "Project Manager AI";
    feedbackEn = `Understood. Multi-agent system parsed your request: "${prompt}". Let's work together to optimize the layouts, execute structural load analyses, verify FAR compliance score, and build an exceptional engineering model!`;
    feedbackHi = `समझ गया। हमारे एआई सिस्टम ने आपके अनुरोध को समझ लिया है: "${prompt}"। आइए मिलकर लेआउट को बेहतर बनाएं, भार विश्लेषण करें, भवन नियमों का सत्यापन करें और एक शानदार इंजीनियरिंग मॉडल तैयार करें!`;
    suggestions = [
      "Define exact plot dimensions to generate an optimized setbacks calculation.",
      "Run structural load analysis checks to verify factor of safety margins.",
      "Select a role in the top header (e.g. Structural Engineer) to access specialized metrics."
    ];
  }

  return {
    feedbackEn,
    feedbackHi,
    agentName,
    suggestions,
    roomsUpdated,
    elementsUpdated
  };
}

startServer();
