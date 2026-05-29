// app/api/ai/route.ts
import { NextRequest, NextResponse } from 'next/server';

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
      prompt = `You are a professional CV writer. The CV text below may have spacing issues because it was extracted from a PDF (letters may appear spaced out like "A B D E L H A M E E D" - read them as normal words).

Read the CV carefully, extract all information, and create an optimized version tailored to the job description.

JOB DESCRIPTION:
${jobDescription}

ORIGINAL CV TEXT:
${resume}

IMPORTANT: You MUST respond with ONLY a valid JSON object, no other text, no markdown, no explanation. The JSON must have exactly these keys:
{
  "name": "full name extracted from CV",
  "phone": "phone number",
  "email": "email address",
  "linkedin": "linkedin url or Not provided",
  "summary": "optimized professional summary 3-5 sentences tailored to the job",
  "experience": "all work experience with job titles, companies, dates, and bullet points",
  "education": "all education details with degrees, universities, years",
  "softSkills": "relevant soft skills comma separated",
  "technicalSkills": "technical skills and keywords from CV and job description comma separated",
  "internshipCourses": "internships and courses with dates",
  "language": "languages spoken",
  "license": "licenses and certifications",
  "additionalInfo": "any other relevant information"
}`;

    } else if (service === 'builder') {
      if (!builderData) {
        return NextResponse.json({ error: 'Builder data is required' }, { status: 400 });
      }
      prompt = `You are a professional CV writer. Create a complete ATS-optimized CV based on this information:

${builderData}

IMPORTANT: You MUST respond with ONLY a valid JSON object, no other text, no markdown, no explanation. The JSON must have exactly these keys:
{
  "name": "candidate name",
  "phone": "phone",
  "email": "email",
  "linkedin": "linkedin or Not provided",
  "summary": "professional summary 3-5 sentences",
  "experience": "work experience with titles, companies, dates, bullet points",
  "education": "education details",
  "softSkills": "soft skills comma separated",
  "technicalSkills": "technical skills comma separated",
  "internshipCourses": "internships and courses",
  "language": "languages",
  "license": "licenses and certifications",
  "additionalInfo": "additional information"
}`;

    } else if (service === 'linkedin') {
      if (!targetRole || !experience) {
        return NextResponse.json({ error: 'Target role and experience are required' }, { status: 400 });
      }
      prompt = `You are a LinkedIn profile optimization expert.

TARGET ROLE: ${targetRole}
EXPERIENCE: ${experience}

IMPORTANT: You MUST respond with ONLY a valid JSON object, no other text, no markdown, no explanation:
{
  "headline": "optimized LinkedIn headline max 220 characters",
  "about": "optimized About section max 2000 characters first person compelling",
  "skills": "10 key skills comma separated",
  "recruiterKeywords": "10 recruiter search keywords comma separated"
}`;

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

    // Try to parse as JSON
    try {
      const clean = result.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      return NextResponse.json({ result, parsed });
    } catch {
      return NextResponse.json({ result, parsed: null });
    }

  } catch (error: any) {
    console.error('AI route error:', error);
    return NextResponse.json(
      { error: error.message || 'AI request failed' },
      { status: 500 }
    );
  }
}
