import { GuideStep } from "./types";

export const TUTORIAL_STEPS: GuideStep[] = [
  {
    id: "init",
    title: "1. Meet Antigravity 2.0",
    badge: "Agent Basics",
    description: "Learn how the agentic AI works and how it translates natural language requests into full-stack web applications.",
    instructions: [
      "Antigravity 2.0 is a highly capable AI coding agent running on a fully managed Cloud Run container workspace.",
      "The agent works asynchronously, executing structural files changes, running builds, installing packages, and performing terminal checks.",
      "Every prompt you send is reviewed by the agent, which plans code modifications, runs validation compilers and outputs summaries.",
      "Tip: You can close your browser tab during complex workflows. Antigravity 2.0 runs server-side and will continue building in the background."
    ]
  },
  {
    id: "fs-config",
    title: "2. The Express-Vite Full Stack Protocol",
    badge: "Architecture",
    description: "Learn how frontends and backends are integrated in a single container behind our reverse-proxy.",
    instructions: [
      "For standard browser tasks, simple SPA React applications are standard.",
      "When using the Gemini AI API, third-party API keys (Stripe, Twilio, Firebase), a server-side backend is required to avoid leaking API credentials.",
      "Vite is run as a development middleware inside Express. In production, Express hosts Vite's statically built outputs straight from `/dist`.",
      "CRITICAL: The runtime port 3000 is hardcoded by the infrastructure. Dev and production servers must always bind to port 0.0.0.0 and port 3000."
    ]
  },
  {
    id: "agents-md",
    title: "3. Custom Rules with AGENTS.md",
    badge: "Prompts",
    description: "Create custom workspace files that customize how the AI agent edits, models, and styles your codebase.",
    instructions: [
      "You can inject persistent rules, custom guidelines, or framework configurations using a file called AGENTS.md or GEMINI.md in the root directory.",
      "Antigravity automatically reads the instructions inside these documents on every single prompt turn.",
      "This prevents the need to repeat styling suggestions (e.g. 'Always use Tailwind CSS and Inter format') or database models in your chat prompt.",
      "Add personal styles or coding principles there to maintain absolute consistency across features."
    ]
  },
  {
    id: "cloud-run",
    title: "4. Cloud Run Deployment Lifecycle",
    badge: "Deploy",
    description: "See the exact build stages, compiling sequences, and routing configurations that prepare your app for production.",
    instructions: [
      "When you hit Deploy inside Google AI Studio, a containerization pipeline is kicked off.",
      "Phase 1 (Vite Build): Generates production static chunks (JS, CSS, HTML) in the `/dist` directory.",
      "Phase 2 (Server Bundler): Compiles `server.ts` to a self-contained CommonJS `dist/server.cjs` file via esbuild to bypass Node's relative path checks.",
      "Phase 3 (Production Run): Container launches direct server startup via `node dist/server.cjs` instantly."
    ]
  }
];

export const BOILERPLATES = [
  {
    title: "Tailwind Theme Injection",
    subtitle: "Typography & custom color standards",
    code: `@import "tailwindcss";

@theme {
  --font-sans: "Inter", sans-serif;
  --font-display: "Outfit", sans-serif;
  --color-brand-cyan: #06b6d4;
  --color-brand-dark: #0f172a;
}`
  },
  {
    title: "Server-side Gemini proxy",
    subtitle: "Secure server.ts API route with telemetry",
    code: `import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

app.post("/api/ask", async (req, res) => {
  const result = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: req.body.prompt,
  });
  res.json({ reply: result.text });
});`
  },
  {
    title: "Express Vite SPA routing",
    subtitle: "Production static folder mapping",
    code: `if (process.env.NODE_ENV !== "production") {
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}`
  }
];
