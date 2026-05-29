// app/api/ai/route.ts
import { NextRequest, NextResponse } from 'next/server';

const PROMPTS = {
  optimization: (resume: string, jobDescription: string) => `
You are a professional CV writer. The CV text below may have spacing issues because it was extracted from a PDF. Please read it carefully and rewrite it as a professional optimized CV.

IMPORTANT RULES:
- Read the CV carefully even if letters are spaced out like "A B D E L H A M E E D"
- Extract the real name, contact details, experience, education from the text
- Only use information from the CV, do not invent anything
- Make it ATS-friendly with keywords from the job description
- Use professional language and strong action verbs

JOB DESCRIPTION:
${jobDescription}

ORIGINAL CV TEXT:
${resume}

Return the optimized CV with these EXACT section labels on their own line:
SUMMARY:
PROFESSIONAL EXPERIENCE:
EDUCATION:
TECHNICAL SKILLS:
SOFT SKILLS:
INTERNSHIP AND COURSES:
LANGUAGES:
LICENSES:
ADDITIONAL INFORMATION:
`,

  builder: (data: string) => `
You are a professional CV writer. Create a complete ATS-optimized CV based on the following information.

IMPORTANT RULES:
- Write in a professional tone with strong action verbs
- Make it ATS-friendly
- Return ONLY the CV content

CANDIDATE INFORMATION:
${data}

Return the CV with these EXACT section labels on their own line:
SUMMARY:
PROFESSIONAL EXPERIENCE:
EDUCATION:
TECHNICAL SKILLS:
SOFT SKILLS:
INTERNSHIP AND COURSES:
LANGUAGES:
LICENSES:
ADDITIONAL INFORMATION:
`,

  linkedin: (targetRole: string, experience: string) => `
You are a LinkedIn profile optimization expert. Create optimized LinkedIn profile content.

TARGET ROLE: ${targetRole}
EXPERIENCE: ${experience}

Return exactly these 4 sections:

HEADLINE:
(Optimized LinkedIn headline, max 220 characters)

ABOUT:
(Optimized About section, max 2000 characters, first person)

SKILLS:
(10 key skills, comma separated)

RECRUITER KEYWORDS:
(10 keywords, comma separated)
`,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { service, resume, jobDescription, builderData, targetRole, experience } = body;

    if (!service) {
      return NextResponse.json({ error: 'Service is required' }, { status: 400 });
    }

    let prompt = '';

    if (service === 'optimization') {
      if (!resume || !jobDescription) {
        return NextResponse.json({ error: 'Resume and job description are required' }, { status: 400 });
      }
      prompt = PROMPTS.optimization(resume, jobDescription);
    } else if (service === 'builder') {
      if (!builderData) {
        return NextResponse.json({ error: 'Builder data is required' }, { status: 400 });
      }
      prompt = PROMPTS.builder(builderData);
    } else if (service === 'linkedin') {
      if (!targetRole || !experience) {
        return NextResponse.json({ error: 'Target role and experience are required' }, { status: 400 });
      }
      prompt = PROMPTS.linkedin(targetRole, experience);
    } else {
      return NextResponse.json({ error: 'Invalid service' }, { status: 400 });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json(
        { error: err.error?.message || 'Claude request failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const result = data.content?.[0]?.text || '';

    return NextResponse.json({ result });

  } catch (error: any) {
    console.error('AI route error:', error);
    return NextResponse.json(
      { error: error.message || 'AI request failed' },
      { status: 500 }
    );
  }
}
