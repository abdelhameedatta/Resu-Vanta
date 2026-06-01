import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { service, resume, jobDescription } = await req.json();

    if (!resume || !jobDescription) {
      return NextResponse.json({ error: 'Missing resume or job description text' }, { status: 400 });
    }

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) Resume Optimization Specialist.
Your task is to analyze the provided CV (Resume) and the target Job Description (JD), then generate an optimized version of the CV that perfectly matches the job requirements while maintaining strict professional standards.

CRITICAL INSTRUCTIONS FOR SCORING & ADDRESS:
1. EXTRACT ADDRESS: Carefully scan the header, contact info, or top section of the original CV to find the candidate's physical address or location (e.g., "Sharjah, UAE", "Cairo, Egypt"). If absolutely no location is found, output "Not provided". Do not hallucinate or make up an address.
2. DYNAMIC ATS SCORING: Calculate a realistic, dynamic ATS match score between 50 and 99 based strictly on how well the CV content aligns with the Job Description keywords, required skills, and experience level. NEVER return a static or fixed score (like 81) for different CVs. If the match is weak, give a realistic lower score. If it's a perfect match, give a high score.
3. SCORE JUSTIFICATION: Provide a clear, honest 1-2 sentence justification explaining why this specific score was given (e.g., "The score is 84% because the CV strongly matches the required technical skills but lacks measurable metrics in the experience section.").

OPTIMIZATION GUIDELINES:
- Rewrite the SUMMARY to be highly professional, compelling, and incorporate key terms from the JD naturally.
- Rewrite the PROFESSIONAL EXPERIENCE bullet points using strong action verbs, and integrate missing keywords from the JD seamlessly without changing the core truth of the candidate's history.
- Organize skills cleanly into technicalSkills and softSkills.
- Extract and preserve Education, Internship/Courses, Languages, and Licenses if present in the text.

You must output ONLY a valid JSON object. Do not include any conversational filler, introductory text, or concluding notes. The output must strictly follow this JSON schema:

{
  "name": "Candidate Full Name",
  "address": "Extracted Address or 'Not provided'",
  "summary": "Optimized summary text...",
  "experience": "Optimized experience section text with bullet points...",
  "education": "Extracted education text...",
  "technicalSkills": "Comma-separated technical skills...",
  "softSkills": "Comma-separated soft skills...",
  "score": 85,
  "scoreJustification": "Clear explanation of why this score was given...",
  "internshipCourses": "Extracted or optimized courses text...",
  "additionalInfo": "Any other relevant info...",
  "language": "Extracted languages...",
  "license": "Extracted licenses or certifications..."
}`;

    const userPrompt = `Candidate CV:\n${resume}\n\nJob Description:\n${jobDescription}`;

    // Here you integrate with your AI Provider (Anthropic, OpenAI, or Google Gen AI)
    // Example placeholder structure:
    // const response = await yourAiClient.generate({ systemPrompt, userPrompt });
    // const aiGeneratedText = response.text;

    const aiGeneratedText = "{}"; 

    return NextResponse.json({ result: aiGeneratedText });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
