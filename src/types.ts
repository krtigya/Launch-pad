export interface GuideStep {
  id: string;
  title: string;
  description: string;
  commandSuggestion?: string;
  badge?: string;
  instructions: string[];
}

export interface DeploymentLog {
  id: string;
  timestamp: string;
  stream: "stdout" | "stderr" | "system";
  message: string;
  type: "info" | "success" | "warning" | "error";
}

export interface DiagnosticsState {
  status: string;
  engine: string;
  nodeVersion: string;
  platform: string;
  uptime: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  appUrl: string;
  geminiStatus: string;
  containerDetails: {
    location: string;
    cpuAllocation: string;
    ramAllocation: string;
    port: number;
  };
}
