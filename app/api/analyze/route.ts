import { GoogleGenAI, Type } from '@google/genai';
import { NextResponse } from 'next/server';
import { levelPoints, likert, type Likert } from '../../../lib/ratings';

type AnalyzePayload = {
  prompt: string;
  notes: string;
  ratings: Record<string, Likert>;
  durationSeconds: number;
  video?: File;
  referenceVideo?: File;
  referenceMetadata?: string;
};

function isLikert(value: string): value is Likert {
  return (likert as readonly string[]).includes(value);
}

function fallbackGrade(ratings: Record<string, Likert>) {
  const selected = Object.values(ratings).filter(isLikert);
  if (!selected.length) return 60;
  return Math.round(selected.reduce((sum, value) => sum + levelPoints[value], 0) / selected.length);
}

function localFallback(payload: AnalyzePayload) {
  const grade = fallbackGrade(payload.ratings);
  return {
    overall_rating: 'Solid' satisfies Likert,
    summary: `Local coaching fallback: self-rated grade is ${grade}/100. For “${payload.prompt}”, focus on a crisp opening claim, two concrete examples, one non-obvious insight, and a final takeaway. Notes captured: ${payload.notes || 'none yet'}`,
    depth_rating: payload.ratings['Depth and substance'] ?? ('Solid' satisfies Likert),
    depth_feedback: 'Depth analysis is limited in fallback mode. When Gemini is configured, it will judge whether the answer used specific evidence, tradeoffs, causal reasoning, and non-obvious insight instead of surface-level claims.',
    surface_level_flags: ['Fallback mode cannot inspect the full recording for shallow reasoning.'],
    comparison_summary: payload.referenceMetadata ? 'Reference context received. Gemini will compare this rep against the selected old recording when configured.' : 'No reference recording selected for comparison.',
    strengths: ['You completed a recorded rep and captured self-reflection notes.'],
    improvements: ['Add one clear signpost near the beginning, then include a concrete example, a tradeoff, and a non-obvious implication so the answer is not surface level.'],
    next_drill: 'Redo the same prompt with a 3-part structure: claim, evidence, tradeoff, takeaway.',
    grade,
  };
}

async function requestToPayload(request: Request): Promise<AnalyzePayload> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    return {
      prompt: String(form.get('prompt') ?? ''),
      notes: String(form.get('notes') ?? ''),
      ratings: JSON.parse(String(form.get('ratings') ?? '{}')) as Record<string, Likert>,
      durationSeconds: Number(form.get('durationSeconds') ?? 0),
      video: form.get('video') instanceof File ? form.get('video') as File : undefined,
      referenceVideo: form.get('referenceVideo') instanceof File ? form.get('referenceVideo') as File : undefined,
      referenceMetadata: String(form.get('referenceMetadata') ?? ''),
    };
  }

  const body = await request.json() as Partial<AnalyzePayload>;
  return {
    prompt: body.prompt ?? '',
    notes: body.notes ?? '',
    ratings: body.ratings ?? {},
    durationSeconds: body.durationSeconds ?? 0,
    referenceMetadata: body.referenceMetadata ?? '',
  };
}

async function fileToInlinePart(video: File) {
  const bytes = Buffer.from(await video.arrayBuffer()).toString('base64');
  return { inlineData: { data: bytes, mimeType: video.type || 'video/webm' } };
}

export async function POST(request: Request) {
  const payload = await requestToPayload(request);
  if (!process.env.GEMINI_API_KEY) return NextResponse.json(localFallback(payload));

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const currentMediaPart = payload.video ? [await fileToInlinePart(payload.video)] : [];
    const referenceMediaPart = payload.referenceVideo ? [await fileToInlinePart(payload.referenceVideo)] : [];
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-pro',
      contents: [{
        role: 'user',
        parts: [
          ...referenceMediaPart,
          ...currentMediaPart,
          {
            text: `You are a direct but constructive speaking coach. Analyze the user's recorded speaking practice when media is provided, plus their prompt, notes, and self-ratings. Judge both delivery and the depth/quality of what was said: specificity, evidence, causal reasoning, tradeoffs, originality, and whether the answer stays surface level. If reference media or metadata is provided, compare the current attempt against the reference attempt and identify concrete progress/regressions. Choose only Likert labels from this list: ${likert.join(', ')}. Do not output numeric scores; the app derives numbers separately. Use MM:SS timestamps in evidence when the recording supports it. Be direct if the answer sounds generic, vague, unsupported, or shallow.\n\nPrompt: ${payload.prompt}\nDuration: ${payload.durationSeconds}s\nSelf notes: ${payload.notes || 'None'}\nSelf ratings: ${JSON.stringify(payload.ratings)}
Reference attempt metadata, if any: ${payload.referenceMetadata || 'None'}`,
          },
        ],
      }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overall_rating: { type: Type.STRING, enum: [...likert] },
            depth_rating: { type: Type.STRING, enum: [...likert] },
            summary: { type: Type.STRING },
            depth_feedback: { type: Type.STRING },
            surface_level_flags: { type: Type.ARRAY, items: { type: Type.STRING } },
            comparison_summary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            next_drill: { type: Type.STRING },
          },
          required: ['overall_rating', 'depth_rating', 'summary', 'depth_feedback', 'surface_level_flags', 'comparison_summary', 'strengths', 'improvements', 'next_drill'],
        },
      },
    });

    const parsed = JSON.parse(response.text ?? '{}') as {
      overall_rating?: Likert;
      depth_rating?: Likert;
      summary?: string;
      depth_feedback?: string;
      surface_level_flags?: string[];
      comparison_summary?: string;
      strengths?: string[];
      improvements?: string[];
      next_drill?: string;
    };
    const grade = parsed.overall_rating && isLikert(parsed.overall_rating) ? levelPoints[parsed.overall_rating] : fallbackGrade(payload.ratings);
    return NextResponse.json({ ...parsed, grade });
  } catch (error) {
    return NextResponse.json({ ...localFallback(payload), error: error instanceof Error ? error.message : 'Gemini analysis failed' }, { status: 200 });
  }
}
