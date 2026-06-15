import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// API Route: Diagnostics
app.get("/api/diagnostics", (req, res) => {
  // Return server-side status as well as some high-fidelity statistics mapping
  const uptime = process.uptime();
  res.json({
    status: "healthy",
    engine: "Antigravity DevEngine 2.0",
    nodeVersion: process.version,
    platform: process.platform,
    uptime: Math.floor(uptime),
    memoryUsage: process.memoryUsage(),
    appUrl: process.env.APP_URL || "http://localhost:3000",
    geminiStatus: ai ? "enabled" : "missing_key",
    containerDetails: {
      location: "Cloud Run Container Sandbox",
      cpuAllocation: "2 vCPU (burst enabled)",
      ramAllocation: "4 GB",
      port: PORT,
    },
  });
});

// Helper: Retry mechanism with exponential backoff & dynamic model fallback for transient errors
async function generateWithRetry(aiClient: any, candidateModels: string[], contents: any, config: any, retriesPerModel = 2, initialDelayMs = 1200) {
  let lastError: any = null;
  for (const model of candidateModels) {
    let delayMs = initialDelayMs;
    console.log(`[Gemini Pilot] Attempting generation using model: ${model}`);
    for (let attempt = 1; attempt <= retriesPerModel; attempt++) {
      try {
        return await aiClient.models.generateContent({
          model,
          contents,
          config,
        });
      } catch (error: any) {
        lastError = error;
        // Common transient error markers
        const errStr = String(error.message || "").toUpperCase();
        const statusStr = String(error.status || "").toUpperCase();
        const code = Number(error.code || 0);

        const isTransient = 
          statusStr.includes("UNAVAILABLE") || 
          code === 503 ||
          statusStr.includes("RESOURCE_EXHAUSTED") ||
          statusStr.includes("RATE_LIMIT") ||
          code === 429 ||
          errStr.includes("503") ||
          errStr.includes("UNAVAILABLE") ||
          errStr.includes("RESOURCE") ||
          errStr.includes("EXHAUSTED") ||
          errStr.includes("SPIKES IN DEMAND") ||
          errStr.includes("HIGH DEMAND") ||
          errStr.includes("RATE");

        if (isTransient && attempt < retriesPerModel) {
          console.warn(`[Gemini Retry] Transient error on ${model} (attempt ${attempt}/${retriesPerModel}). Retrying in ${delayMs}ms. Error: ${error.message}`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          delayMs *= 2.0; // Exponential backoff factor
        } else {
          break; // Stop retrying on this model, fall through of loop to try the next model
        }
      }
    }
    console.warn(`[Gemini Fallback] Model ${model} failed or timed out. Moving to next candidate in the pool...`);
  }
  throw lastError || new Error("All candidate models failed to resolve the content request.");
}

// API Route: Prompt Assistant
app.post("/api/gemini/generate", async (req, res) => {
  const { prompt, contextType } = req.body;

  if (!ai) {
    return res.status(403).json({
      error: "Gemini API key is not configured in the Secrets panel. Please set GEMINI_API_KEY.",
    });
  }

  if (!prompt) {
    return res.status(400).json({ error: "No prompt was provided." });
  }

  try {
    let systemInstruction = "";
    if (contextType === "instructions") {
      systemInstruction =
        "You are an expert Google Cloud engineer and AI prompt designer. Draft beautiful, highly effective system instructions (AGENTS.md style) for the user. Highlight safety, role, guidelines, and structural context.";
    } else if (contextType === "architecture") {
      systemInstruction =
        "You are a Senior Architect specializing in Google Cloud Serverless and React development. Provide a structured, beautiful, developer-friendly architecture plan for a Cloud Run deployed app, including folder structure, server configuration, and best practices.";
    } else {
      systemInstruction =
        "You are a helpful software engineering assistant for Antigravity 2.0 and Google AI Studio.";
    }

    // Call generate with multiple models fallback sequence
    const modelCandidates = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    
    const response = await generateWithRetry(
      ai,
      modelCandidates,
      prompt,
      {
        systemInstruction,
        temperature: 0.7,
      }
    );

    res.json({
      success: true,
      text: response?.text || "No response received.",
    });
  } catch (error: any) {
    console.error("Gemini API Error after fallbacks/retries:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An error occurred with the Gemini API.",
      isTransient: true,
    });
  }
});

// Start server setup including Vite development middleware or production handler
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Direct Express to route non-API calls through Vite
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server", err);
});
