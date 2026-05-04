import { NextRequest, NextResponse } from "next/server";

import { requireCanRead } from "@/lib/auth";
import { getPromptConfig, renderPromptTemplate } from "@/lib/prompt-config";

export const runtime = "nodejs";

type Mood = "good" | "neutral" | "bad";
type Risk = "low" | "medium" | "high";

type SignalDirection = "positive" | "negative" | "neutral";
type SignalSeverity = "info" | "low" | "medium" | "high" | "critical";

type AnalysisSignal = {
  type: string;
  title: string;
  text: string;
  direction: SignalDirection;
  severity: SignalSeverity;
};

type AnalysisResult = {
  summary: string;
  clientMood: Mood;
  teamMood: Mood;
  risk: Risk;
  highlights: string[];
  signals: AnalysisSignal[];
};

type AiProxyJsonResponse = {
  content?: string;
  modelName?: string;
};
const allowedSignalTypes = [
  "client_satisfaction",
  "client_dissatisfaction",
  "client_trust",
  "team_confidence",
  "team_demotivation",
  "deadline_risk",
  "scope_change",
  "quality_issue",
  "blocker",
  "budget_risk",
  "communication_gap",
  "decision_made",
  "escalation",
  "positive_feedback",
  "upsell_opportunity",
] as const;

function normalizeMood(value: unknown): Mood {
  if (value === "good" || value === "neutral" || value === "bad") {
    return value;
  }
  return "neutral";
}

function normalizeRisk(value: unknown): Risk {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }
  return "low";
}

function normalizeDirection(value: unknown): SignalDirection {
  if (value === "positive" || value === "negative" || value === "neutral") {
    return value;
  }
  return "neutral";
}

function normalizeSeverity(value: unknown): SignalSeverity {
  if (
    value === "info" ||
    value === "low" ||
    value === "medium" ||
    value === "high" ||
    value === "critical"
  ) {
    return value;
  }
  return "low";
}

function isAllowedSignalType(value: unknown) {
  return (
    typeof value === "string" &&
    allowedSignalTypes.includes(value as (typeof allowedSignalTypes)[number])
  );
}
function normalizeSignals(value: unknown): AnalysisSignal[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const raw = item as Record<string, unknown>;

      if (!isAllowedSignalType(raw.type)) {
        return null;
      }

      const text =
        typeof raw.text === "string" && raw.text.trim()
          ? raw.text.trim()
          : "";

      if (!text) return null;

      const title =
        typeof raw.title === "string" && raw.title.trim()
          ? raw.title.trim()
          : text.slice(0, 80);

      return {
        type: raw.type,
        title,
        text,
        direction: normalizeDirection(raw.direction),
        severity: normalizeSeverity(raw.severity),
      };
    })
    .filter((item): item is AnalysisSignal => Boolean(item))
    .slice(0, 3);
}
export async function POST(req: NextRequest) {
  try {
    const user = await requireCanRead();
    const body = await req.json();

    const text = body?.text;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const promptConfig = await getPromptConfig(
      "meeting_analysis",
      user.workspaceId ?? null,
    );

    if (!promptConfig) {
      return NextResponse.json(
        { error: "Prompt config not found" },
        { status: 500 },
      );
    }

    const aiProxyUrl = process.env.AI_PROXY_URL;
    const aiProxyKey = process.env.AI_PROXY_KEY;

    if (!aiProxyUrl || !aiProxyKey) {
      return NextResponse.json(
        {
          error: "AI proxy is not configured",
          details: "Add AI_PROXY_URL and AI_PROXY_KEY",
        },
        { status: 500 },
      );
    }

    const response = await fetch(`${aiProxyUrl}/chat-json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiProxyKey}`,
      },
      body: JSON.stringify({
        model: promptConfig.modelName || "gpt-4o-mini",
        temperature: 0.1,
        system: promptConfig.systemPrompt,
        user: renderPromptTemplate(promptConfig.userPrompt, {
          text: text.slice(0, 20000),
        }),
      }),
    });

    const proxyData = (await response.json()) as AiProxyJsonResponse;

    if (!response.ok) {
      console.error("AI PROXY ERROR:", proxyData);

      return NextResponse.json(
        { error: "AI proxy error", details: proxyData },
        { status: 500 },
      );
    }

    let parsed: Partial<AnalysisResult> = {};

    try {
      parsed = JSON.parse(proxyData.content || "{}");
    } catch {
      parsed = {};
    }

    return NextResponse.json({
      summary: parsed.summary || "Саммари не получено.",
      clientMood: normalizeMood(parsed.clientMood),
      teamMood: normalizeMood(parsed.teamMood),
      risk: normalizeRisk(parsed.risk),
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      signals: normalizeSignals(parsed.signals),
      modelName: proxyData.modelName || promptConfig.modelName,
    });
  } catch (error) {
    console.error("ANALYZE ERROR:", error);

    return NextResponse.json(
      {
        error: "Server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}