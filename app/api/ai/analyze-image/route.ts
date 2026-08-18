import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export interface VisionAnalysisResult {
  isCivicIssue: boolean;
  category: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  title: string;
  description: string;
  department: string;
  confidence: number;
  evidence: string[];
}

const DEPT_MAP: Record<string, string> = {
  'Road/Pothole': 'Road Maintenance Department',
  'Garbage': 'NMC Solid Waste Management',
  'Drainage': 'Drainage Department',
  'Water Supply': 'NMC Water Works',
  'Waterlogging': 'Drainage Department',
  'Streetlight': 'Electrical Department',
  'Traffic Signal': 'Traffic Department',
  'Tree/Green': 'Garden Department',
  'Public Toilet': 'NMC Sanitation',
  'Other': 'General Administration',
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType = 'image/jpeg', userNotes } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image is required for analysis' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        available: false,
        error: 'Gemini API key is not configured on server.',
      }, { status: 503 });
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    const google = createGoogleGenerativeAI({ apiKey });

    const systemPrompt = `You are the NagariX Civic Vision AI for Nagpur Municipal Corporation (NMC).
Your job is to accurately inspect citizen photos and detect municipal/civic issues.

Valid Categories:
- "Road/Pothole" (potholes, cracked asphalt, damaged pavements, road construction debris)
- "Garbage" (garbage heaps, overflowing dustbins, uncollected waste, illegal dumping)
- "Drainage" (blocked drains, broken sewer lines, open manholes, wastewater overflow)
- "Water Supply" (leaking pipelines, burst mains, water contamination)
- "Waterlogging" (flooded streets, submerged roads, stagnant rainwater pools)
- "Streetlight" (broken poles, non-functional lights, dangling electrical wires)
- "Traffic Signal" (broken signals, obscured signage)
- "Tree/Green" (fallen branches, uprooted trees blocking roads)
- "Public Toilet" (unhygienic/broken public sanitation facilities)
- "Other" (encroachment, footpath obstruction, stray animal hazards)

Valid Severities:
- "Critical": Poses immediate physical danger to life/traffic (e.g., deep submerged pothole on main road, live hanging wire, open manhole).
- "High": Major disruption to traffic or public health (e.g., large garbage dump near homes, flooded street).
- "Medium": Noticeable civic inconvenience (e.g., standard pothole, uncollected bin).
- "Low": Minor cosmetic or non-urgent repair.

Language Rule:
If user notes are provided in Hindi, Marathi, or Hinglish, adapt the title and description naturally in that language/style while keeping the category and severity in standard English values.

Output Format:
You MUST output ONLY a valid, parseable JSON object with NO markdown formatting, NO backticks, and NO conversational preamble.
{
  "isCivicIssue": boolean,
  "category": "Road/Pothole" | "Garbage" | "Drainage" | "Water Supply" | "Waterlogging" | "Streetlight" | "Traffic Signal" | "Tree/Green" | "Public Toilet" | "Other",
  "severity": "Low" | "Medium" | "High" | "Critical",
  "title": "Short descriptive title (max 80 chars)",
  "description": "Detailed explanation of visible damage and situation (2-3 sentences)",
  "department": "NMC Department Name",
  "confidence": 0.85,
  "evidence": ["Point 1", "Point 2"]
}`;

    const promptText = userNotes
      ? `Citizen added context: "${userNotes}". Analyze the photo and combine with citizen notes:`
      : 'Analyze this photo for municipal civic issues:';

    const result = await generateText({
      model: google(modelName),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `${systemPrompt}\n\n${promptText}` },
            { type: 'file', data: cleanBase64, mediaType: mimeType },
          ],
        },
      ],
    });

    let jsonStr = result.text.trim();
    // Strip markdown code fences if present
    jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();

    try {
      const parsed: VisionAnalysisResult = JSON.parse(jsonStr);

      // Ensure valid category and department mapping
      if (!parsed.department || parsed.department === 'N/A') {
        parsed.department = DEPT_MAP[parsed.category] || 'General Administration';
      }

      return NextResponse.json({
        available: true,
        analysis: parsed,
      });
    } catch (parseError) {
      console.error('[Vision Parse Error]', parseError, 'Raw output:', result.text);
      return NextResponse.json({
        available: true,
        analysis: {
          isCivicIssue: true,
          category: 'Other',
          severity: 'Medium',
          title: 'Civic Issue Detected',
          description: result.text.substring(0, 200),
          department: 'General Administration',
          confidence: 0.7,
          evidence: ['Visual anomaly detected in image'],
        },
      });
    }
  } catch (error: any) {
    console.error('[Vision API Error]', error);
    return NextResponse.json({
      available: false,
      error: error.message || 'Failed to analyze image with Gemini Vision.',
    }, { status: 500 });
  }
}
