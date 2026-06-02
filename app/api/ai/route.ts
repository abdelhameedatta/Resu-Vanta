import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { service, resume, jobDescription } = await req.json();

    if (!resume || !jobDescription) {
      return NextResponse.json({ error: 'Missing resume or job description text' }, { status: 400 });
    }

    const systemPrompt = `You are an expert ATS Resume Optimization Specialist and Professional CV Writer.

YOUR MISSION: Transform the candidate's CV into a polished, professional document that reads naturally and compellingly — NOT a keyword-stuffed list.

STRICT WRITING RULES:
1. IMPROVE SENTENCES: Rewrite every bullet point to sound more professional, confident, and impactful. Use strong action verbs (Spearheaded, Orchestrated, Delivered, Achieved, Streamlined, etc.).
2. DO NOT STUFF KEYWORDS: Never add a list of keywords at the end of any section. Keywords must be woven naturally into professional sentences only.
3. KEEP THE TRUTH: Only use information that exists in the original CV. Do not invent jobs, degrees, or skills.
4. BULLET POINTS: Format the experience section with clear bullet points (•) and line breaks between each point.
5. PROFESSIONAL TONE: Every sentence must sound like it was written by a senior HR professional.

SCORING RULES:
1. EXTRACT ADDRESS: Find the candidate's location from the CV header or contact section. If not found, output "Not provided".
2. DYNAMIC SCORE: Give a realistic ATS score (50-99) based on how well the CV matches the Job Description. Different CVs must get different scores. A weak match gets a low score. A strong match gets a high score.
3. SCORE JUSTIFICATION: Write 1-2 honest sentences explaining exactly why this score was given.

SUGGESTED ACHIEVEMENTS RULES:
Generate exactly 3 quantifiable achievement suggestions that are:
- NOT already in the CV
- Highly relevant to the target job role from the Job Description
- Based on real metrics professionals in this role typically achieve
- Written as templates with [XX] or [Number] placeholders for the candidate to fill in
- Designed to significantly boost the ATS score if added

You must output ONLY a valid JSON object. No text before or after. Follow this exact schema:

{
  "name": "Full name from CV",
  "address": "Location from CV or Not provided",
  "summary": "Highly professional rewritten summary with natural JD keywords",
  "experience": "Professionally rewritten experience with strong action verbs and bullet points",
  "education": "Education details from CV",
  "technicalSkills": "Technical skills organized cleanly",
  "softSkills": "Soft skills organized cleanly",
  "score": 75,
  "scoreJustification": "Honest explanation of why this score was given",
  "internshipCourses": "Courses and internships from CV",
  "additionalInfo": "Any other relevant info from CV",
  "language": "Languages from CV",
  "license": "Licenses and certifications from CV",
  "suggestedAchievements": [
    "Achievement template 1 with [XX]% or [Number] placeholder relevant to the job",
    "Achievement template 2 with [XX]% or [Number] placeholder relevant to the job",
    "Achievement template 3 with [XX]% or [Number] placeholder relevant to the job"
  ]
}`;

    const userPrompt = `Candidate CV:\n${resume}\n\nJob Description:\n${jobDescription}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 2500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json({ error: err.error?.message || 'AI request failed' }, { status: response.status });
    }

    const data = await response.json();
    const aiGeneratedText = data.content?.[0]?.text || '{}';

    let parsed = null;
    try {
      const clean = aiGeneratedText.replace(/```json|```/g, '').trim();
      const start = clean.indexOf('{');
      const end = clean.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        parsed = JSON.parse(clean.substring(start, end + 1));
      }
    } catch {
      parsed = null;
    }

    return NextResponse.json({ result: aiGeneratedText, parsed });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
