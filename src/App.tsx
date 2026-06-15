import React, { useState, useEffect, useRef } from "react";
import { 
  Terminal, 
  Cpu, 
  Layers, 
  Globe, 
  Sparkles, 
  Play, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  Clock, 
  User, 
  RefreshCw, 
  BookOpen, 
  ArrowRight, 
  ShieldAlert,
  HardDrive
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GuideStep, DeploymentLog, DiagnosticsState } from "./types";
import { TUTORIAL_STEPS, BOILERPLATES } from "./data";

export default function App() {
  // Application statistics / metadata from metadata injectors & environment
  const userEmail = "kritigyaojha2003@gmail.com";
  const devUrl = "https://ais-dev-pp3mopi5bn4gqm6cvb6mub-1003467058905.asia-southeast1.run.app";
  const sharedUrl = "https://ais-pre-pp3mopi5bn4gqm6cvb6mub-1003467058905.asia-southeast1.run.app";

  // System Diagnostics status
  const [diagnostics, setDiagnostics] = useState<DiagnosticsState | null>(null);
  const [loadingDiagnostics, setLoadingDiagnostics] = useState<boolean>(true);

  // Guide Steps states
  const [activeStepId, setActiveStepId] = useState<string>("init");
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({
    init: true,
  });

  // Prompt assistant states
  const [promptInput, setPromptInput] = useState<string>("");
  const [contextType, setContextType] = useState<string>("instructions");
  const [aiOutput, setAiOutput] = useState<string>("");
  const [generatingAi, setGeneratingAi] = useState<boolean>(false);
  const [copiedAi, setCopiedAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Deployment Simulator states
  const [deploying, setDeploying] = useState<boolean>(false);
  const [deployProgress, setDeployProgress] = useState<number>(0);
  const [deployLogs, setDeployLogs] = useState<DeploymentLog[]>([]);
  const [deployStepIndex, setDeployStepIndex] = useState<number>(-1);
  
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Fetch initial diagnostics
  const fetchDiagnostics = async () => {
    setLoadingDiagnostics(true);
    try {
      const response = await fetch("/api/diagnostics");
      if (response.ok) {
        const data = await response.json();
        setDiagnostics(data);
        if (data.status === "healthy") {
          // If we successfully communicate with our Express, automatically complete the FS step!
          setCompletedSteps(prev => ({ ...prev, "fs-config": true }));
        }
      }
    } catch (e) {
      console.error("Could not fetch server diagnostics:", e);
    } finally {
      setLoadingDiagnostics(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  // Sync log scrollbar on addition
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [deployLogs]);

  // Set prompt template chips
  const handlePromptChipClick = (type: string, placeholder: string) => {
    setContextType(type);
    setPromptInput(placeholder);
  };

  // Run server Gemini API Call
  const handleGeneratePrompt = async () => {
    if (!promptInput.trim()) return;
    setGeneratingAi(true);
    setAiOutput("");
    setAiError(null);
    try {
      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptInput,
          contextType: contextType,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAiOutput(data.text);
        setCompletedSteps(prev => ({ ...prev, "agents-md": true }));
      } else {
        setAiError(data.error || "Failed to make Gemini request.");
      }
    } catch (error) {
      setAiError("Connection to server API failed. Ensure server.ts is running.");
    } finally {
      setGeneratingAi(false);
    }
  };

  // Run standard clipboard copy
  const handleCopyText = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedAi(true);
    setTimeout(() => setCopiedAi(false), 2000);
  };

  // Simulation Deployment Sequences
  const deploymentSequence = [
    { delay: 1000, msg: "⚡ Init containerization pipeline. Fetching platform blueprints...", pct: 10, type: "info" as const },
    { delay: 2200, msg: "📦 Compiling front-end SPA static assets using Vite @tailwindcss/vite compiler...", pct: 30, type: "info" as const },
    { delay: 3500, msg: "🌲 Front-end compilation success. Created statically optimized assets in /dist. (Typescript validation OK)", pct: 45, type: "success" as const },
    { delay: 4800, msg: "🔨 Bundling server.ts back-end entry point with esbuild into dist/server.cjs. Checking dependencies...", pct: 65, type: "info" as const },
    { delay: 6000, msg: "🔒 Bundling success. CommonJS compilation wrapper active. Stripped unused devDependencies.", pct: 75, type: "success" as const },
    { delay: 7200, msg: "🚀 Submitting build artifact to Google Container Registry (gcr.io). Configured port: 3000.", pct: 85, type: "info" as const },
    { delay: 8400, msg: "🌍 Provisioning Cloud Run revision for 'ai-studio-launchpad' on region: asia-southeast1...", pct: 95, type: "info" as const },
    { delay: 9600, msg: "✅ Deployment SUCCESS! revision 'ais-dev-pp3mopi5bn4gqm' live with burst-enabled CPU routing.", pct: 100, type: "success" as const }
  ];

  const handleStartDeploymentSimulation = () => {
    if (deploying) return;
    setDeploying(true);
    setDeployProgress(0);
    setDeployLogs([]);
    setDeployStepIndex(-1);

    const logList: DeploymentLog[] = [];
    
    // Initial startup log
    const now = new Date().toLocaleTimeString();
    logList.push({
      id: "log-init",
      timestamp: now,
      stream: "system",
      message: "📣 Triggering Cloud Run deployment review...",
      type: "info"
    });
    setDeployLogs([...logList]);

    let logCounter = 0;

    deploymentSequence.forEach((step, idx) => {
      setTimeout(() => {
        const timeStr = new Date().toLocaleTimeString();
        logList.push({
          id: `log-step-${idx}`,
          timestamp: timeStr,
          stream: (step.type as string) === "error" ? "stderr" : "stdout",
          message: step.msg,
          type: step.type
        });
        
        setDeployLogs([...logList]);
        setDeployProgress(step.pct);
        setDeployStepIndex(idx);

        if (idx === deploymentSequence.length - 1) {
          setDeploying(false);
          setCompletedSteps(prev => ({ ...prev, "cloud-run": true }));
        }
      }, step.delay);
    });
  };

  const activeStep = TUTORIAL_STEPS.find(s => s.id === activeStepId) || TUTORIAL_STEPS[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col antialiased">
      
      {/* 1. Header Navigation Cockpit */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Platform Metadata */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl text-white shadow-lg shadow-teal-900/30">
              <Layers className="h-6 w-6" id="logo-icon" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-lg font-bold tracking-tight text-white leading-none">
                  AI Studio Launchpad
                </h1>
                <span className="text-[10px] bg-emerald-950/80 border border-emerald-500/35 text-emerald-400 font-mono px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold animate-pulse">
                  Antigravity 2.0 Live
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Developer cockpit for high-fidelity containerized deployments
              </p>
            </div>
          </div>

          {/* User Email & Active Config */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Email Badge */}
            <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800/65 text-xs text-slate-300">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-mono">{userEmail}</span>
            </div>

            {/* Container Health State Indicator */}
            <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800/65 text-xs">
              <span className={`h-2 w-2 rounded-full ${
                diagnostics?.status === "healthy" ? "bg-emerald-500 animate-pulse" : "bg-yellow-500"
              }`} />
              <span className="text-slate-400">Server:</span>
              <span className="font-mono text-emerald-400 font-semibold uppercase">
                {diagnostics?.status || "Connecting..."}
              </span>
            </div>

            {/* Force diagnostics refresh */}
            <button 
              id="refresh-diagnostics-btn"
              onClick={fetchDiagnostics}
              disabled={loadingDiagnostics}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-40"
              title="Refresh server diagnostics"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingDiagnostics ? "animate-spin" : ""}`} />
            </button>
          </div>

        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ================= LEFT MODULE: GUIDE SHEETS ================= */}
        <section className="lg:col-span-4 flex flex-col gap-6" id="guides-module">
          
          {/* Welcome Dashboard Block */}
          <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl flex flex-col gap-4">
            <h2 className="font-heading text-md font-bold text-white flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-400" />
              Launchpad Protocol
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Step through our interactive workbook to see how Antigravity 2.0 synchronizes the workspace files, queries GenAI server-side, and validates containers before hosting on Cloud Run.
            </p>

            {/* Checklists */}
            <div className="space-y-2 mt-2">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                Operational Checklist
              </div>
              
              <div className="space-y-1.5">
                {TUTORIAL_STEPS.map((step) => {
                  const done = completedSteps[step.id];
                  return (
                    <div 
                      key={step.id} 
                      className="flex items-center justify-between text-xs py-1 px-1.5 bg-slate-950/20 rounded"
                    >
                      <span className="text-slate-400">{step.title.substring(3)}</span>
                      <div className="flex items-center gap-1.5">
                        {done ? (
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 font-mono rounded">
                            Verified
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-500 font-mono rounded">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive Tutorial Stepper */}
          <div className="bg-slate-900/60 border border-slate-900/80 rounded-2xl p-5 flex-1 flex flex-col gap-4">
            <div className="text-xs font-mono text-slate-500 uppercase tracking-widest font-bold">
              Interactive Guide Manual
            </div>

            {/* Scrollable Steps Container */}
            <div className="grid grid-cols-1 gap-2.5">
              {TUTORIAL_STEPS.map((step) => {
                const isActive = activeStepId === step.id;
                const isDone = completedSteps[step.id];

                return (
                  <button
                    key={step.id}
                    id={`guide-tab-${step.id}`}
                    onClick={() => setActiveStepId(step.id)}
                    className={`text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 relative overflow-hidden group ${
                      isActive 
                        ? "bg-slate-900 border-slate-800 text-white shadow-md shadow-slate-950" 
                        : "bg-slate-950/40 border-slate-950 hover:bg-slate-900/30 hover:border-slate-900 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="mt-0.5">
                      {isDone ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 fill-emerald-950/40" />
                      ) : (
                        <span className={`block h-4.5 w-4.5 rounded-full border-2 ${
                          isActive ? "border-emerald-500" : "border-slate-800"
                        } flex items-center justify-center text-[10px] font-mono`}>
                          •
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold truncate block">
                          {step.title}
                        </span>
                        {step.badge && (
                          <span className="text-[9px] bg-slate-800/80 text-slate-400 px-1 py-0.2 rounded font-mono uppercase scale-90">
                            {step.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 group-hover:text-slate-400 transition-colors">
                        {step.description}
                      </p>
                    </div>

                    {isActive && (
                      <motion.div 
                        layoutId="active-indicator"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-400"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Active Step Viewport */}
            <div className="border border-slate-900 bg-slate-950/80 rounded-xl p-4 mt-auto flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-400 font-mono rounded-full font-bold">
                  MANUAL v2.0
                </span>
                <span className="text-xs font-semibold text-white truncate">
                  {activeStep.title}
                </span>
              </div>
              
              <ul className="space-y-2">
                {activeStep.instructions.map((ins, i) => (
                  <li key={i} className="flex gap-2 text-xs leading-relaxed text-slate-300">
                    <span className="text-emerald-500 font-semibold mt-0.5">•</span>
                    <span>{ins}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </section>

        {/* ================= CENTER MODULE: AI PROMPT SUITE ================= */}
        <section className="lg:col-span-5 flex flex-col gap-6" id="ai-workspace">
          
          <div className="bg-slate-900/60 border border-slate-900/80 rounded-2xl p-5 flex flex-col gap-4 h-full relative overflow-hidden">
            
            {/* Top Info Banner */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-sm font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="h-4.5 w-4.5 text-purple-400" />
                  Gemini Prompt Workbench
                </h3>
                <p className="text-xs text-slate-400">
                  Call the server-side Gemini 3.5 API securely to formulate custom rules or files
                </p>
              </div>
              <span className="text-[10px] bg-purple-950/60 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wide">
                MODEL: 3.5-FLASH
              </span>
            </div>

            {/* Template Assist Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-wider font-bold">
                Auto-generate developer templates:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  id="chip-agents-md"
                  onClick={() => handlePromptChipClick("instructions", "Draft an elegant AGENTS.md document specifying a full-stack React Express application focusing on clean typography, Fira Code, and secure API keys.")}
                  className={`text-[10px] px-2 py-1 rounded-lg border text-left transition-all ${
                    contextType === "instructions" 
                      ? "bg-purple-950/50 border-purple-800 text-purple-300" 
                      : "bg-slate-950/50 border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-800"
                  }`}
                >
                  📄 Write Custom AGENTS.md Rules
                </button>
                <button
                  id="chip-architecture"
                  onClick={() => handlePromptChipClick("architecture", "Create a highly complete backend directory structure and architecture config explaining how users deploy an Express app in Docker containers safely.")}
                  className={`text-[10px] px-2 py-1 rounded-lg border text-left transition-all ${
                    contextType === "architecture" 
                      ? "bg-purple-950/50 border-purple-800 text-purple-300" 
                      : "bg-slate-950/50 border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-800"
                  }`}
                >
                  🏗️ Request App Architecture Plan
                </button>
              </div>
            </div>

            {/* Textarea Form */}
            <div className="flex flex-col gap-2">
              <textarea
                id="prompt-input"
                rows={3}
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="Enter prompt e.g., Draft custom system rules..."
                className="w-full bg-slate-950 border border-slate-900 rounded-xl p-3 text-xs leading-relaxed text-slate-200 focus:outline-none focus:border-purple-500 placeholder-slate-600 font-sans resize-none transition-all"
              />
              
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] text-slate-500 font-mono">
                  Characters: {promptInput.length}
                </span>

                <button
                  id="submit-prompt-btn"
                  onClick={handleGeneratePrompt}
                  disabled={generatingAi || !promptInput.trim()}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 select-none shadow-lg shadow-purple-950/30 active:scale-95 transition-all"
                >
                  {generatingAi ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Synthesizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Query Server Gemini
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Response Output Box */}
            <div className="flex-1 flex flex-col min-h-[140px] border border-slate-900 bg-slate-950/60 rounded-xl overflow-hidden mt-2">
              <div className="bg-slate-950 px-3.5 py-2 border-b border-slate-900/85 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5" />
                  WORKSPACE_DRAFT.md
                </span>
                {aiOutput && (
                  <button
                    id="copy-ai-output-btn"
                    onClick={() => handleCopyText(aiOutput)}
                    className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>{copiedAi ? "Copied!" : "Copy"}</span>
                  </button>
                )}
              </div>

              <div className="p-3.5 flex-1 overflow-y-auto text-xs leading-relaxed font-mono relative">
                {generatingAi ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-purple-500 animate-spin" />
                      <Sparkles className="h-4 w-4 text-purple-400 absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <span className="text-[10px] text-slate-400 animate-pulse font-sans">
                      Agent processing pipeline stream...
                    </span>
                  </div>
                ) : aiError ? (
                  <div className="flex flex-col gap-3">
                    <div className="bg-amber-950/30 border border-amber-500/30 p-3.5 rounded-xl text-amber-200 flex items-start gap-3">
                      <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-bold text-[11px] uppercase tracking-wider block mb-1">
                          Gemini Service Capacity Notice
                        </span>
                        <p className="font-sans text-[11px] text-amber-100/90 leading-relaxed">
                          The Gemini server endpoints are experiencing a temporary spike in global demand (503 Service Unavailable).
                        </p>
                        <p className="font-sans text-[11px] text-amber-200/70 mt-1 pb-1.5 border-b border-amber-500/20">
                          {aiError}
                        </p>
                        <div className="mt-2 text-[10px] text-amber-300/80 leading-relaxed">
                          💡 <strong className="text-white">Active Recovery:</strong> The full-stack Express server automatically attempted 4 backoff-retries. Don't worry! Saturated resources usually clear up in seconds. You can safely try re-running the prompt.
                        </div>
                      </div>
                    </div>
                    
                    <button
                      id="retry-prompt-error-btn"
                      onClick={handleGeneratePrompt}
                      className="bg-amber-600/40 border border-amber-500/50 hover:bg-amber-600/60 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5 animate-pulse" />
                      Retry Prompt Synthesis
                    </button>
                  </div>
                ) : aiOutput ? (
                  <div className="whitespace-pre-wrap text-slate-300 select-all selection:bg-purple-900">
                    {aiOutput}
                  </div>
                ) : (
                  <div className="text-slate-600 flex flex-col items-center justify-center h-full text-center py-6 font-sans select-none">
                    <Sparkles className="h-7 w-7 text-slate-800 mb-2 animate-pulse" />
                    <p className="text-xs">Your generated files or architectural layout will compile here.</p>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-xs">
                      Try clicking one of the templates above or describe your next component.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>

        {/* ================= RIGHT MODULE: CONTAINER & RUNWAY SIMULATOR ================= */}
        <section className="lg:col-span-3 flex flex-col gap-6" id="cloud-run-simulator">
          
          {/* Real-time container diagnostics readout */}
          <div className="bg-slate-900/60 border border-slate-900/80 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 uppercase font-bold tracking-widest">
              <Cpu className="h-4 w-4 text-emerald-400" />
              Runtime Readout
            </div>

            {loadingDiagnostics ? (
              <div className="space-y-2 py-4">
                <div className="h-2 w-full bg-slate-950 rounded animate-pulse" />
                <div className="h-2 w-3/4 bg-slate-950 rounded animate-pulse" />
              </div>
            ) : diagnostics ? (
              <div className="space-y-2.5 text-[11px] font-mono">
                
                {/* Port Allocation */}
                <div className="flex items-center justify-between border-b border-slate-950 pb-1.5">
                  <span className="text-slate-500">Service Port:</span>
                  <span className="text-emerald-400 font-bold">{diagnostics?.containerDetails?.port || 3000}</span>
                </div>

                {/* Engine Wrapper */}
                <div className="flex items-center justify-between border-b border-slate-950 pb-1.5">
                  <span className="text-slate-500">Core Engine:</span>
                  <span className="text-slate-300 font-semibold">{diagnostics?.engine}</span>
                </div>

                {/* Node Version */}
                <div className="flex items-center justify-between border-b border-slate-950 pb-1.5">
                  <span className="text-slate-500">Node Binaries:</span>
                  <span className="text-slate-400">{diagnostics?.nodeVersion}</span>
                </div>

                {/* Uptime metrics */}
                <div className="flex items-center justify-between border-b border-slate-950 pb-1.5">
                  <span className="text-slate-500">Engine Uptime:</span>
                  <span className="text-teal-400 text-right">{diagnostics?.uptime} seconds</span>
                </div>

                {/* Memory Allocation */}
                <div className="flex flex-col gap-1 border-b border-slate-950 pb-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Allocated RAM:</span>
                    <span className="text-slate-300">{diagnostics?.containerDetails?.ramAllocation}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1">
                    <div className="bg-teal-500 h-full w-[24%]" />
                  </div>
                </div>

                {/* Virtual CPUs */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Burst CPUs:</span>
                    <span className="text-slate-300">{diagnostics?.containerDetails?.cpuAllocation}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1">
                    <div className="bg-emerald-500 h-full w-[8%]" />
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-slate-500 text-center py-4 font-mono text-[10px]">
                Diagnostics server offline. Bound to PORT: 3000
              </div>
            )}
          </div>

          {/* Interactive deployment pipeline */}
          <div className="bg-slate-900/60 border border-slate-900/80 rounded-2xl p-5 flex-1 flex flex-col gap-4">
            
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-sm font-bold text-white flex items-center gap-1.5">
                <Globe className="h-4.5 w-4.5 text-teal-400 animate-spin" style={{ animationDuration: '6s' }} />
                Cloud Runway
              </h3>
              <span className="text-[9px] font-mono text-teal-300 bg-teal-950/80 border border-teal-500/20 px-1.5 rounded font-bold uppercase">
                GCP Sandbox
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Test how the complete application bundle gets routed through the runtime container image when deploying.
            </p>

            {/* Initiate Run button */}
            <button
              id="simulate-deploy-btn"
              onClick={handleStartDeploymentSimulation}
              disabled={deploying}
              className={`w-full font-bold text-xs p-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-97 text-center select-none ${
                deploying 
                  ? "bg-teal-905 border border-teal-800 text-teal-400" 
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-teal-950/40"
              }`}
            >
              {deploying ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Building Bundle...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Initiate Cloud Deploy Review
                </>
              )}
            </button>

            {/* Progress Bar */}
            {deploying && (
              <div className="w-full">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono text-slate-500">BUILD COMPILATION PROGRESS:</span>
                  <span className="text-[11px] font-mono text-teal-400 font-bold">{deployProgress}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${deployProgress}%` }}
                    transition={{ duration: 0.4 }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                  />
                </div>
              </div>
            )}

            {/* Active deployment logs Terminal */}
            <div className="flex-1 flex flex-col border border-slate-900 bg-slate-950 rounded-xl overflow-hidden min-h-[160px]">
              
              <div className="bg-slate-950/90 border-b border-slate-900 px-3 py-1.5 flex items-center justify-between text-[9px] font-mono text-slate-500">
                <span>TERMINAL INSTANCE [LOGGER-0]</span>
                <span className={`h-1.5 w-1.5 rounded-full ${deploying ? "bg-red-500 animate-ping" : "bg-teal-500 animate-pulse"}`} />
              </div>

              <div 
                ref={logContainerRef}
                className="p-3.5 flex-1 overflow-y-auto font-mono text-[10px] space-y-2 leading-relaxed"
              >
                {deployLogs.length > 0 ? (
                  deployLogs.map((log) => {
                    let color = "text-slate-400";
                    if (log.type === "success") color = "text-emerald-400 font-semibold";
                    if (log.type === "warning") color = "text-yellow-400";
                    if (log.type === "error") color = "text-red-400 font-semibold";

                    return (
                      <div key={log.id} className="grid grid-cols-12 gap-1.5">
                        <span className="col-span-3 text-slate-600 block shrink-0">{log.timestamp}</span>
                        <div className={`col-span-9 ${color} whitespace-pre-wrap leading-tight`}>
                          {log.message}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-slate-600 select-none text-center py-6 h-full flex flex-col items-center justify-center">
                    <Terminal className="h-6 w-6 text-slate-800 mb-1" />
                    <span>No active pipeline logs. Click Deploy above to execute containerized check.</span>
                  </div>
                )}
              </div>

            </div>

          </div>
        </section>

      </main>

      {/* 3. Footer Environment Indicator info */}
      <footer className="border-t border-slate-900 bg-slate-950/80 p-5 mt-auto text-center">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          
          <div className="flex flex-wrap items-center gap-3 justify-center">
            
            {/* Dev App Link */}
            <a 
              id="dev-app-link"
              href={devUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800"
            >
              <Globe className="h-3.5 w-3.5 text-blue-400" />
              <span>Development Stage</span>
              <ExternalLink className="h-3 w-3 text-slate-500" />
            </a>

            {/* Prod App Link */}
            <a 
              id="shared-app-link"
              href={sharedUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800"
            >
              <Globe className="h-3.5 w-3.5 text-emerald-400" />
              <span>Shared Runway Link</span>
              <ExternalLink className="h-3 w-3 text-slate-500" />
            </a>

          </div>

          <div className="text-slate-500 font-mono text-[10px]">
            Cloud Container Build System • Node.js v22.14.0 • Port: 3000
          </div>

        </div>
      </footer>

    </div>
  );
}
