import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  let keyword: string;
  try {
    const body = await req.json();
    keyword = body.keyword;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!keyword || typeof keyword !== "string" || keyword.trim().length === 0) {
    return NextResponse.json({ error: "keyword is required" }, { status: 400 });
  }

  const sanitized = keyword.trim().slice(0, 100);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Generate exactly 250 single words related to "${sanitized}". Include nouns, verbs, adjectives, moods, textures, associations. Return ONLY words separated by single spaces. No punctuation, numbering, quotes, or explanation.`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    return NextResponse.json(
      { error: "Anthropic API error", detail: err },
      { status: res.status }
    );
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "";
  const words = text
    .replace(/[^a-zA-Z\s]/g, "")
    .split(/\s+/)
    .filter((w: string) => w.length > 0);

  return NextResponse.json({ words });
}
