import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { service, resume, jobDescription, targetJob, builderData, targetRole } = body;

    let systemPrompt = '';
    let userPrompt = '';

    if (service === 'builder') {
      if (!targetJob || !builderData) {
        return NextResponse.json({ error: 'Missing target job or builder data' }, { status: 400 });
      }

      systemPrompt = `You are an Expert ATS Resume Writer & Optimizer.
I will provide you with user data, their 'Target Job', and a 'Job Description'.

INSTRUCTIONS:
1. REWRITE and OPTIMIZE the user's experience and summary to strongly align with the Target Job and heavily integrate keywords from the Job Description. Use professional action verbs.
2. Generate an array of 5-8 highly relevant "suggestedSoftSkills" based on the Job Description.
3. Generate an array of 5-8 highly relevant "suggestedTechnicalSkills" based on the Job Description.
4. LICENSE: Extract ONLY from the provided user data. Do NOT invent or add any license not explicitly mentioned in the input.
5. INTERNSHIPS: Format each internship/training as: TITLE | COMPANY | LOCATION | DATE (on one line), then bullet points for details below it. Separate entries with a blank line.
6. COURSES: Format each course as: COURSE NAME | DATE (on one line), then bullet points for details below it. Separate entries with a blank line.
7. ADDITIONAL INFORMATION: Write a concise 2-3 sentence paragraph based ONLY on the candidate's summary, experience, and education. Do not copy from the license or language fields.

Return strictly this JSON format:
{
  "name": "string",
  "summary": "string",
  "experience": "string",
  "education": "string",
  "softSkills": "string",
  "technicalSkills": "string",
  "internships": "string",
  "courses": "string",
  "additionalInfo": "string",
  "language": "string",
  "license": "string",
  "suggestedSoftSkills": ["skill1", "skill2", "skill3"],
  "suggestedTechnicalSkills": ["skill1", "skill2", "skill3"]
}`;

      userPrompt = `Target Job: ${targetJob}\nJob Description:\n${jobDescription || ''}\n\nUser Data:\n${builderData}`;

    } else if (service === 'linkedin') {
      if (!targetRole) {
        return NextResponse.json({ error: 'Missing target role' }, { status: 400 });
      }

      systemPrompt = `You are an expert LinkedIn Profile Optimization Specialist.

YOUR MISSION: Create a compelling, keyword-rich LinkedIn profile that attracts recruiters and hiring managers.

INSTRUCTIONS:
1. Write a professional HEADLINE (max 220 characters) that includes the target role and key skills.
2. Write an engaging ABOUT section (max 2000 characters) in first person, highlighting achievements and value proposition.
3. List the top 10 most relevant SKILLS keywords for this role.
4. Provide 15-20 RECRUITER KEYWORDS that recruiters use to search for this type of professional.

You must output ONLY a valid JSON object. No text before or after:

{
  "headline": "Professional headline here",
  "about": "Full about section here in first person",
  "skills": "Skill1, Skill2, Skill3, Skill4, Skill5, Skill6, Skill7, Skill8, Skill9, Skill10",
  "recruiterKeywords": "keyword1, keyword2, keyword3, keyword4, keyword5"
}`;

      userPrompt = `Target Role: ${targetRole}\n\nCandidate CV/Resume:\n${resume || 'No CV provided. Generate based on target role only.'}`;

    } else {
      if (!resume || !jobDescription) {
        return NextResponse.json({ error: 'Missing resume or job description text' }, { status: 400 });
      }

      systemPrompt = `You are an expert ATS Resume Optimization Specialist and Professional CV Writer.

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

      userPrompt = `Candidate CV:\n${resume}\n\nJob Description:\n${jobDescription}`;
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
      const clean = aiGeneratedText.replace(new RegExp('```json|```', 'g'), '').trim();
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
