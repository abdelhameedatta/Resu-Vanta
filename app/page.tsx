// @ts-nocheck
'use client';

import React, { useEffect, useState } from 'react';
import UnlockButton from './components/UnlockButton';
import ContactSection from './components/ContactSection';

const PRICES = {
  optimization: '$7.99',
  builder: '$11.99',
  linkedin: '$6.99',
};

// ─── AI Call ─────────────────────────────────────────────────────────────────
async function callAI(payload) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return { result: data.result || '', parsed: data.parsed || null };
}

function parseAICV(rawText) {
  if (typeof rawText === 'object' && rawText !== null) {
    return {
      name: rawText.name || rawText.NAME || '',
      summary: rawText.summary || rawText.SUMMARY || '',
      experience: rawText.experience || rawText['PROFESSIONAL EXPERIENCE'] || '',
      education: rawText.education || rawText.EDUCATION || '',
      technicalSkills: rawText.technicalSkills || rawText['TECHNICAL SKILLS'] || '',
      softSkills: rawText.softSkills || rawText['SOFT SKILLS'] || '',
      internshipCourses: rawText.internshipCourses || rawText['INTERNSHIP AND COURSES'] || '',
      language: rawText.language || rawText.LANGUAGES || '',
      license: rawText.license || rawText.LICENSES || '',
      additionalInfo: rawText.additionalInfo || rawText['ADDITIONAL INFORMATION'] || '',
      suggestedAchievements: rawText.suggestedAchievements || [],
    };
  }
  const text = typeof rawText === 'string' ? rawText : String(rawText || '');
  function extract(label, next) {
    const pattern = new RegExp(label + '[*:#\\s]*([\\s\\S]*?)(?=[*:#\\s]*(?:' + next.join('|') + ')|$)', 'i');
    const match = text.match(pattern);
    return match ? match[1].trim() : '';
  }
  const sections = ['NAME','SUMMARY','PROFESSIONAL EXPERIENCE','EDUCATION','TECHNICAL SKILLS','SOFT SKILLS','INTERNSHIP AND COURSES','LANGUAGES','LICENSES','ADDITIONAL INFORMATION'];
  return {
    name: extract('NAME', sections.slice(1)),
    summary: extract('SUMMARY', sections.slice(2)),
    experience: extract('PROFESSIONAL EXPERIENCE', sections.slice(3)),
    education: extract('EDUCATION', sections.slice(4)),
    technicalSkills: extract('TECHNICAL SKILLS', sections.slice(5)),
    softSkills: extract('SOFT SKILLS', sections.slice(6)),
    internshipCourses: extract('INTERNSHIP AND COURSES', sections.slice(7)),
    language: extract('LANGUAGES', sections.slice(8)),
    license: extract('LICENSES', sections.slice(9)),
    additionalInfo: extract('ADDITIONAL INFORMATION', []),
    suggestedAchievements: [],
  };
}

function parseLinkedInOutput(rawText) {
  if (typeof rawText === 'object' && rawText !== null) {
    return {
      headline: rawText.headline || rawText.HEADLINE || '',
      about: rawText.about || rawText.ABOUT || '',
      skills: rawText.skills || rawText.SKILLS || '',
      recruiterKeywords: rawText.recruiterKeywords || rawText['RECRUITER KEYWORDS'] || '',
    };
  }
  const text = typeof rawText === 'string' ? rawText : String(rawText || '');
  function extract(label, next) {
    const pattern = new RegExp(label + '[*:#\\s]*([\\s\\S]*?)(?=[*:#\\s]*(?:' + next.join('|') + ')|$)', 'i');
    const match = text.match(pattern);
    return match ? match[1].trim() : '';
  }
  return {
    headline: extract('HEADLINE', ['ABOUT','SKILLS','RECRUITER']),
    about: extract('ABOUT', ['SKILLS','RECRUITER']),
    skills: extract('SKILLS', ['RECRUITER']),
    recruiterKeywords: extract('RECRUITER KEYWORDS', []),
  };
}

// ─── Session helpers ──────────────────────────────────────────────────────────
function getUsageCount(service) {
  const value = sessionStorage.getItem(`resuvanta_usage_${service}`);
  return value ? Number(value) : 0;
}
function increaseUsageCount(service) {
  const next = getUsageCount(service) + 1;
  sessionStorage.setItem(`resuvanta_usage_${service}`, String(next));
  return next;
}
function clearServiceSession(service) {
  sessionStorage.removeItem(`resuvanta_pending_${service}`);
  sessionStorage.removeItem(`resuvanta_usage_${service}`);
}

// ─── Stop words & phrases ─────────────────────────────────────────────────────
const stopWords = new Set(
  'the and for with you your our are this that from have has will can all any but not who what when where why how into about over under than then they them their there here been being were was is am to of in on at by as or an a be we it its if must should may more most such using use used work working role job position candidate company team teams responsible required preferred ability requirements responsibilities qualification qualifications'.split(' ')
);
const phrases = [
  'project management','customer service','data analysis','communication skills',
  'sales experience','social media','microsoft excel','problem solving',
  'team leadership','time management','business development','software development',
  'inventory management','digital marketing','account management','leadership skills',
  'analytical skills','reporting','crm','salesforce','operations management',
  'quality assurance','regulatory affairs','patient care','pharmaceutical care',
  'insurance approvals','dispensing','inventory control','patient counseling',
  'medical terminology','clinical pharmacy',
];

// ─── Text helpers ─────────────────────────────────────────────────────────────
function cleanText(text) {
  return (text || '').toLowerCase().replace(/[^a-z0-9+#@./,\s-]/g,' ').replace(/\s+/g,' ').trim();
}
function cleanKeyword(word) {
  return word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,'').trim();
}
function extractKeywords(text, limit = 25) {
  const cleaned = cleanText(text);
  const counts = new Map();
  phrases.forEach(p => { if (cleaned.includes(p)) counts.set(p, 4); });
  cleaned.split(' ').forEach(word => {
    const w = cleanKeyword(word);
    if (!w || w.length < 3 || stopWords.has(w)) return;
    counts.set(w, (counts.get(w) || 0) + 1);
  });
  return [...counts.entries()].sort((a,b) => b[1]-a[1]).slice(0, limit).map(([w]) => w);
}

// ─── Analysis ─────────────────────────────────────────────────────────────────
function analyzeResume(resume, jobDescription) {
  const resumeText = cleanText(resume);
  const jobText = cleanText(jobDescription);
  const keywords = extractKeywords(jobText, 25);
  const found = keywords.filter(k => resumeText.includes(k));
  const missing = keywords.filter(k => !resumeText.includes(k));
  const keywordScoreRaw = keywords.length ? (found.length / keywords.length) * 100 : 0;
  const keywordMatchPct = Math.round(keywordScoreRaw);
  const sentenceCount = (resumeText.match(/[.!?]/g)||[]).length;
  const hasActionVerbs = /(managed|led|developed|achieved|improved|reduced|increased|delivered|designed|coordinated|supervised|trained|implemented)/i.test(resumeText);
  const hasMetrics = /(\d+\s*%|\d+\s*years|\d+\s*team|\d+\s*million|\d+\s*patients|\d+\s*clients)/i.test(resumeText);
  const professionalScore = Math.min(100, Math.round((hasActionVerbs ? 35 : 10) + (hasMetrics ? 35 : 10) + Math.min(sentenceCount * 2, 30)));
  const experienceKeywords = extractKeywords(jobText, 10);
  const expFound = experienceKeywords.filter(k => resumeText.includes(k));
  const experienceScore = experienceKeywords.length ? Math.round((expFound.length / experienceKeywords.length) * 100) : 0;
  const hasSkillsSection = /(skills|technologies|tools|competencies)/.test(resumeText);
  const skillsScore = Math.min(100, Math.round((keywordMatchPct * 0.6) + (hasSkillsSection ? 40 : 10)));
  const score = Math.round((keywordMatchPct + professionalScore + experienceScore + skillsScore) / 4);
  const level = score < 50 ? 'Low Match' : score <= 80 ? 'Good Match' : 'High Match';
  let quickImprovement = 'Add more job-specific keywords naturally into your Summary, Skills, and Experience sections.';
  if (!hasMetrics) quickImprovement = 'Add measurable achievements using numbers, percentages, or clear results.';
  const risks = [];
  if (!risks.length) risks.push('No major knockout risk detected from the visible text.');
  return { score, professionalScore, keywordMatchPct, experienceScore, skillsScore, level, found, missing, previewMissing: missing.slice(0,3), missingCount: missing.length, quickImprovement, risks };
}

// ─── Professional sentences generator ────────────────────────────────────────
function generateProfessionalSentences(jobDescription, foundKeywords) {
  const job = cleanText(jobDescription);
  const sentences = [];
  if (foundKeywords.length > 0)
    sentences.push(`Demonstrated expertise in ${foundKeywords.slice(0,3).join(', ')} with a proven track record of delivering results.`);
  if (/manag|lead|supervis/.test(job))
    sentences.push('Successfully managed cross-functional teams and coordinated multiple projects simultaneously to meet deadlines.');
  if (/patient|clinical|pharmacy|medical/.test(job))
    sentences.push('Provided comprehensive patient care and counseling, ensuring medication safety and regulatory compliance.');
  if (/data|analytic|report/.test(job))
    sentences.push('Leveraged data analysis and reporting tools to drive informed decision-making and improve operational efficiency.');
  if (/customer|client|service/.test(job))
    sentences.push('Built strong client relationships through excellent communication and a commitment to customer satisfaction.');
  if (/develop|software|tech/.test(job))
    sentences.push('Delivered scalable software solutions using industry best practices and agile methodologies.');
  if (sentences.length < 3)
    sentences.push('Consistently exceeded performance targets while maintaining high standards of quality and professionalism.');
  return sentences.slice(0, 4);
}

// ─── CV helpers ───────────────────────────────────────────────────────────────
function guessName(resume) {
  const lines = resume.split('\n').map(l=>l.trim()).filter(Boolean);
  const first = lines[0] || '';
  if (first.length<=45 && !first.includes('@') && !/\d{3,}/.test(first) && !/resume|cv|curriculum/i.test(first)) return first;
  return 'NAME';
}
function guessEducation(resume) {
  return sectionFromResume(resume, ['education','academic','qualifications']) || 'Please add your education details here.';
}
function guessLanguage(resume) {
  return sectionFromResume(resume, ['language','languages']) || 'Not provided';
}
function guessLicense(resume) {
  return sectionFromResume(resume, ['license','licence','licenses']) || 'Not provided';
}
function guessEmail(resume) { const m=resume.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i); return m?m[0]:'Not provided'; }
function guessPhone(resume) { const m=resume.match(/(\+?\d[\d\s().-]{7,}\d)/); return m?m[0]:'Not provided'; }
function guessLinkedIn(resume) { const m=resume.match(/(https?:\/\/)?(www\.)?linkedin\.com\/[^\s]+/i); return m?m[0]:'Not provided'; }
function sectionFromResume(resume, sectionNames) {
  const lines = resume.split('\n');
  const lowerNames = sectionNames.map(s=>s.toLowerCase());
  let start = -1;
  for (let i=0;i<lines.length;i++) {
    const line = lines[i].trim().toLowerCase();
    if (lowerNames.some(n=>line===n||line.includes(n))) { start=i+1; break; }
  }
  if (start===-1) return '';
  const stopSections=['summary','profile','experience','professional experience','employment','education','skills','certification','certifications','courses','training','internship','language','languages','license','licence','additional','projects'];
  const collected=[];
  for (let i=start;i<lines.length;i++) {
    const line=lines[i].trim(); const low=line.toLowerCase();
    if (collected.length>0 && stopSections.some(w=>low===w||low.startsWith(w+' '))) break;
    if (line) collected.push(line);
  }
  return collected.join('\n').trim();
}

// ─── PDF ──────────────────────────────────────────────────────────────────────
async function openPDFWindow(cv: any, title = 'Optimized CV') {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js');
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js');
  const pdfMake = (window as any).pdfMake;

  const clean = (t: any) => !t ? '' : String(t)
    .replace(/^#+\s*/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1');

  const MARGIN = 42;
  const LINE_W = 511;

  const sec = (label: string) => ({
    stack: [
      { text: label, fontSize: 10, bold: true, color: '#111827' },
      { canvas: [{ type: 'line', x1: 0, y1: 2, x2: LINE_W, y2: 2, lineWidth: 1.5, lineColor: '#111827' }] },
    ],
    margin: [0, 12, 0, 6],
  });

  const content: any[] = [];

  content.push({ text: clean(cv.name).toUpperCase(), fontSize: 20, bold: true, alignment: 'center', characterSpacing: 1, margin: [0, 0, 0, 3] });

  const contact = [cv.address && `ADDRESS: ${clean(cv.address)}`, cv.phone && `PHONE: ${clean(cv.phone)}`, cv.email && `E-MAIL: ${clean(cv.email)}`, cv.linkedin && `LinkedIn: ${clean(cv.linkedin)}`].filter(Boolean).join(' | ');
  content.push({ text: contact, fontSize: 9, color: '#374151', alignment: 'center', margin: [0, 0, 0, 14] });

  if (cv.summary) { content.push(sec('SUMMARY')); content.push({ text: clean(cv.summary), fontSize: 10, color: '#111827', alignment: 'justify', margin: [0, 0, 0, 4] }); }

  if (cv.experience) {
    content.push(sec('PROFESSIONAL EXPERIENCE'));
    clean(cv.experience).split(/\n\s*\n/).forEach((block: string) => {
      const lines = block.split('\n').filter((l: string) => l.trim());
      if (!lines.length) return;
      const headers: string[] = [], bullets: string[] = [];
      lines.forEach((line: string) => {
        const t = line.trim();
        if (t.startsWith('•') || t.startsWith('-') || t.startsWith('*')) bullets.push(t.replace(/^[-*•]\s*/, ''));
        else if (!bullets.length) headers.push(t);
        else bullets.push(t);
      });
      if (headers[0]) content.push({ text: headers[0].toUpperCase(), fontSize: 11, bold: true, color: '#000', margin: [0, 4, 0, 1] });
      if (headers[1]) content.push({ columns: [{ text: headers[1], fontSize: 10, bold: true }, { text: headers[2] || '', fontSize: 10, bold: true, alignment: 'right' }], margin: [0, 1, 0, 3] });
      bullets.forEach((b: string) => content.push({ text: `• ${b}`, fontSize: 10, color: '#222', alignment: 'justify', margin: [10, 0, 0, 1] }));
    });
  }

  if (cv.education) { content.push(sec('EDUCATION')); content.push({ text: clean(cv.education), fontSize: 10, color: '#111827', alignment: 'justify', margin: [0, 0, 0, 4] }); }

  if (cv.softSkills || cv.technicalSkills) {
    content.push(sec('SKILLS'));
    if (cv.softSkills) content.push({ text: [{ text: 'Soft Skills: ', bold: true }, clean(cv.softSkills)], fontSize: 10, color: '#111827', margin: [0, 0, 0, 3] });
    if (cv.technicalSkills) content.push({ text: [{ text: 'Technical Skills: ', bold: true }, clean(cv.technicalSkills)], fontSize: 10, color: '#111827', margin: [0, 0, 0, 3] });
  }

  ([['INTERNSHIP AND COURSES', cv.internshipCourses], ['ADDITIONAL INFORMATION', cv.additionalInfo], ['LANGUAGE', cv.language], ['LICENSE', cv.license]] as [string, any][])
    .forEach(([label, val]) => { if (val) { content.push(sec(label)); content.push({ text: clean(val), fontSize: 10, color: '#111827', alignment: 'justify', margin: [0, 0, 0, 4] }); } });

  pdfMake.createPdf({ pageSize: 'A4', pageMargins: [MARGIN, MARGIN, MARGIN, MARGIN], defaultStyle: { font: 'Roboto' }, content }).download(`${title.replace(/\s+/g, '_')}.pdf`);
}

// ─── Animated Bar ─────────────────────────────────────────────────────────────
function AnimatedBar({ label, value, color, delay = 0 }) {
  const [displayed, setDisplayed] = useState(0);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const step = value / 60;
      const interval = setInterval(() => {
        current = Math.min(current + step, value);
        setWidth(Math.round(current));
        setDisplayed(Math.round(current));
        if (current >= value) clearInterval(interval);
      }, 16);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
        <span style={{ fontSize:14, color:'#94a3b8' }}>{label}</span>
        <span style={{ fontSize:15, fontWeight:700, color:'#f1f5f9' }}>{displayed}%</span>
      </div>
      <div style={{ height:12, background:'#1e293b', borderRadius:6, overflow:'hidden' }}>
        <div style={{ height:'100%', borderRadius:6, background:color, width:`${width}%`, transition:'width 0.05s linear' }}/>
      </div>
    </div>
  );
}

// ─── Steps Strip ─────────────────────────────────────────────────────────────
function StepsStrip({ steps }) {
  return (
    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:18 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, background:'#101827', border:'1px solid #24344f', borderRadius:999, padding:'6px 14px', fontSize:13, color:'#94a3b8' }}>
          <span style={{ background:'#2563eb', color:'#dbeafe', borderRadius:'50%', width:20, height:20, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{i+1}</span>
          {s}
        </div>
      ))}
    </div>
  );
}

// ─── CV Template Preview ──────────────────────────────────────────────────────
function CVTemplatePreview({ cv }) {
  return (
    <div className="cv-template-preview">
      <h1>{cv.name}</h1>
      <div className="contact-line">ADDRESS: {cv.address} | PHONE: {cv.phone} | E-MAIL: {cv.email} | LinkedIn: {cv.linkedin}</div>
      <CVSection title="SUMMARY" content={cv.summary} />
      <CVSection title="PROFESSIONAL EXPERIENCE" content={cv.experience} />
      <CVSection title="EDUCATION" content={cv.education} />
      <div className="cv-section">
        <h2>SKILLS</h2>
        <p><b>Soft Skills:</b> {cv.softSkills}</p>
        <p><b>Technical Skills:</b> {cv.technicalSkills}</p>
      </div>
      <CVSection title="INTERNSHIP AND COURSES" content={cv.internshipCourses} />
      <CVSection title="ADDITIONAL INFORMATION" content={cv.additionalInfo} />
      <CVSection title="LANGUAGE:" content={cv.language} />
      <CVSection title="ANY LICENSE" content={cv.license} />
    </div>
  );
}
function CVSection({ title, content }) {
  return (
    <div className="cv-section">
      <h2>{title}</h2>
      {(content||'Not provided').split('\n').map((line,i)=><p key={i}>{line}</p>)}
    </div>
  );
}

// ─── Brand Logo ───────────────────────────────────────────────────────────────
function BrandLogo({ darkMode, footer=false }) {
  const logoSrc = footer ? '/logo-dark.svg' : darkMode ? '/logo-dark.svg' : '/logo-light.svg';
  return (
    <div className={footer ? 'logoBlock footerLogoBlock' : 'logoBlock'}>
      <div className="logoImageFrame">
        <img src={logoSrc} alt="Resuvanta logo" className="logoImage" />
      </div>
      <div className="logoSlogan">Apply with confidence.</div>
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────
function Home({ setPage }) {
  return (
    <>
      <section className="home-hero">
        <div className="home-content">
          <p className="label">ATS-friendly CV tools</p>
          <h1>Build, optimize, and improve your CV for the job you want.</h1>
          <p>Resuvanta helps job seekers check their CV, discover missing keywords, build a professional CV from scratch, and improve their LinkedIn profile for recruiters.</p>
          <div className="hero-actions">
            <button onClick={()=>setPage('optimization')}>Optimize My CV</button>
            <button className="secondary" onClick={()=>setPage('builder')}>Build New CV</button>
          </div>
        </div>
        <div className="home-card">
          <h3>What you can do</h3>
          <ul>
            <li>Check how well your CV matches a job description</li>
            <li>See missing ATS keywords before applying</li>
            <li>Build a professional CV step by step</li>
            <li>Improve your LinkedIn profile for recruiters</li>
            <li>Download your final CV as PDF</li>
          </ul>
        </div>
      </section>
      <section className="home-section">
        <h2>Our Services</h2>
        <div className="service-grid">
          <div className="service-card">
            <h3>CV Optimization</h3><h2>{PRICES.optimization}</h2>
            <p>Upload your current CV and paste the job description. Get a free preview first, then unlock full optimization.</p>
            <button onClick={()=>setPage('optimization')}>Start CV Optimization</button>
          </div>
          <div className="service-card featured">
            <h3>CV Builder + Optimization</h3><h2>{PRICES.builder}</h2>
            <p>No CV yet? Answer guided questions and generate an optimized, ATS-friendly CV for your target job.</p>
            <button onClick={()=>setPage('builder')}>Build & Optimize CV</button>
          </div>
          <div className="service-card">
            <h3>LinkedIn Optimization</h3><h2>{PRICES.linkedin}</h2>
            <p>Improve your LinkedIn headline, About section, skills, and recruiter search keywords.</p>
            <button onClick={()=>setPage('linkedin')}>Optimize LinkedIn</button>
          </div>
        </div>
      </section>
      <section className="home-section how-it-works">
        <h2>How it works</h2>
        <div className="steps-grid">
          <div><span>1</span><h3>Upload or Enter Details</h3><p>Upload your CV or answer simple builder questions.</p></div>
          <div><span>2</span><h3>Get a Free Preview</h3><p>See your match score, missing keyword count, and one improvement tip.</p></div>
          <div><span>3</span><h3>Unlock Full Result</h3><p>Pay only when you want the full optimized CV or builder output.</p></div>
          <div><span>4</span><h3>Download PDF</h3><p>Your final output is delivered as a clean PDF-ready CV.</p></div>
        </div>
      </section>
      <section className="home-section">
        <h2>Why use Resuvanta?</h2>
        <div className="features-grid">
          <div>ATS-friendly structure</div>
          <div>Job description keyword matching</div>
          <div>Step-by-step CV builder</div>
          <div>Professional template output</div>
          <div>Accurate sentences</div>
          <div>LinkedIn optimization</div>
        </div>
      </section>
      <ContactSection />
    </>
  );
}

// ─── Optimization Page ────────────────────────────────────────────────────────
function OptimizationPage() {
  const [resume, setResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState(null);
  const [paidCV, setPaidCV] = useState(null);
  const [profSentences, setProfSentences] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedAchievements, setSuggestedAchievements] = useState([]);
  const [selectedAchievements, setSelectedAchievements] = useState([]);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [remainingOutputs, setRemainingOutputs] = useState(3);
  
  useEffect(() => {
    const paymentService = sessionStorage.getItem('resuvanta_payment_success');
    const saved = sessionStorage.getItem('resuvanta_pending_optimization');
    if (paymentService === 'optimization' && saved) {
      sessionStorage.removeItem('resuvanta_payment_success');
      try {
        const data = JSON.parse(saved);
        const savedResume = data.resume || '';
        const savedJobDescription = data.jobDescription || '';
        const used = getUsageCount('optimization');
        const remaining = Math.max(0, 3 - used);
        setResume(savedResume);
        setJobDescription(savedJobDescription);
        setPaymentConfirmed(true);
        setRemainingOutputs(remaining);
        if (savedResume.trim() && savedJobDescription.trim())
          setResult(analyzeResume(savedResume, savedJobDescription));
        setMessage(`Payment confirmed. You can generate up to ${remaining} optimized CV output(s).`);
      } catch {
        setError('Payment confirmed, but we could not restore your saved CV details.');
      }
    }
  }, []);

  async function readFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const fileName = file.name.toLowerCase();
    setMessage('Reading file...'); setError('');
    try {
      if (fileName.endsWith('.txt')) { setResume(await file.text()); setMessage('TXT file loaded successfully.'); return; }
      if (fileName.endsWith('.pdf')) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
        window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const pdf = await window.pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;
        let fullText='';
        for (let p=1;p<=pdf.numPages;p++) { const page=await pdf.getPage(p); const c=await page.getTextContent(); fullText+=c.items.map(i=>i.str).join(' ')+'\n\n'; }
        if (!fullText.trim()) { setError('Could not extract text from this PDF.'); return; }
        setResume(fullText); setMessage('PDF loaded successfully.'); return;
      }
      if (fileName.endsWith('.docx')) {
        await loadScript('https://unpkg.com/mammoth/mammoth.browser.min.js');
        const output = await window.mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});
        if (!output.value.trim()) { setError('Could not extract text from this DOCX.'); return; }
        setResume(output.value); setMessage('DOCX loaded successfully.'); return;
      }
      setError('Unsupported file type. Upload PDF, DOCX, or TXT.');
    } catch { setError('Could not read this file. Please paste the resume text manually.'); }
  }

  function runFreePreview() {
    if (!resume.trim()) { setError('Please upload or paste a CV first.'); return; }
    if (!jobDescription.trim()) { setError('Please paste the job description first.'); return; }
    if (resume.split(' ').length<30||jobDescription.split(' ').length<30) { setError('Please add more complete CV and job description text.'); return; }
    setPaidCV(null); setError(''); setMessage('');
    setResult(analyzeResume(resume, jobDescription));
  }

  async function generatePaidOptimizationCV() {
    if (!resume.trim()||!jobDescription.trim()) { setError('Please upload CV and paste job description first.'); return; }
    const used = getUsageCount('optimization');
    if (used>=3) { setError('You have used all 3 CV outputs for this payment session.'); return; }
    setLoading(true); setError('');
    try {
      const { result: aiText, parsed: aiParsed } = await callAI({ service:'optimization', resume, jobDescription });
      const parsed = parseAICV(aiParsed || aiText);
      const analysis = analyzeResume(resume, jobDescription);
      if (parsed.suggestedAchievements && parsed.suggestedAchievements.length > 0) {
        setSuggestedAchievements(parsed.suggestedAchievements);
        setSelectedAchievements([]);
      }
      const cv = {
        name: parsed.name || guessName(resume) || 'NAME',
        address: parsed.address || 'Not provided',
        phone: guessPhone(resume),
        email: guessEmail(resume),
        linkedin: guessLinkedIn(resume),
        summary: parsed.summary || 'Please add your summary here.',
        experience: parsed.experience || 'Please add your experience here.',
        education: parsed.education || guessEducation(resume),
        softSkills: parsed.softSkills || 'Communication, teamwork, problem solving, time management',
        technicalSkills: parsed.technicalSkills || analysis.found.join(', '),
        internshipCourses: parsed.internshipCourses || 'Not provided',
        additionalInfo: parsed.additionalInfo || '',
        language: parsed.language || guessLanguage(resume),
        license: parsed.license || guessLicense(resume),
        scoreJustification: parsed.scoreJustification || '',
      };
      const newCount = increaseUsageCount('optimization');
      const remaining = Math.max(0,3-newCount);
      setResult(analysis); setPaidCV(cv); setProfSentences([]); setError('');
      setRemainingOutputs(remaining);
      setMessage(`CV generated successfully. You have ${remaining} CV output(s) remaining.`);
    } catch(e) {
      setError(e.message || 'AI generation failed. Please try again.');
    } finally { setLoading(false); }
  }

  function updatePaidCVField(field, value) { setPaidCV(old=>({...old,[field]:value})); }

  const getScoreColor = (score) => {
    if (score > 80) return '#10b981';
    if (score >= 65) return '#facc15';
    return '#ef4444';
  };

  return (
    <section className="section">
      <h2>CV Optimization — {PRICES.optimization}</h2>
      <p className="muted">Upload your current CV, paste a job description, and get a free preview before unlocking full optimization.</p>
      <StepsStrip steps={['Upload your CV','Paste job description','Get free preview','Pay & get full optimized CV']} />
      <div className="grid">
        <input type="file" accept=".pdf,.docx,.txt" onChange={readFile} />
        <textarea placeholder="Paste your CV here or upload PDF / DOCX / TXT..." value={resume} onChange={e=>setResume(e.target.value)} />
        <textarea placeholder="Paste the job description here..." value={jobDescription} onChange={e=>setJobDescription(e.target.value)} />
      </div>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
      <div className="button-row">
        <button onClick={runFreePreview}>Get Free Preview</button>
      </div>

      {result && (
        <div className="preview-box" style={{display:'block',padding:24}}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '220px' }}>
              <p style={{ fontWeight: 700, marginBottom: '6px', fontSize: '18px', color: '#f8fafc' }}>CV Evaluation Report</p>
              <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.5' }}>
                This is a strict, real-time ATS analysis of your resume. Scores below 65% indicate a weak match that requires significant optimization.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', background: '#0f172a', padding: '28px 24px', borderRadius: '16px', border: '1px solid #1e293b', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ flex: '0 0 140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)', borderRadius: '50%', width: '140px', height: '140px', border: `4px solid ${getScoreColor(result.score)}`, boxShadow: `0 0 20px ${getScoreColor(result.score)}30`, margin: '0 auto' }}>
              <div style={{ fontSize: '42px', fontWeight: '800', color: '#f8fafc', lineHeight: '1' }}>{result.score}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Match Score</div>
            </div>
            <div style={{ flex: '1', minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Keyword Match', score: result.keywordMatchPct },
                { label: 'Professional Sentences', score: result.professionalScore },
                { label: 'Experience Alignment', score: result.experienceScore },
                { label: 'Skills Relevance', score: result.skillsScore }
              ].map((item, idx) => {
                const color = getScoreColor(item.score);
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: '#e2e8f0', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <span>{item.label}</span>
                      <span style={{ color: color }}>{item.score}%</span>
                    </div>
                    <div style={{ height: '6px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${item.score}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{marginBottom:16}}>
            <p style={{fontWeight:700,fontSize:14,marginBottom:6}}>
              Missing Keywords
              <span style={{fontWeight:400,color:'#94a3b8',fontSize:13,marginLeft:8}}>
                We found <b style={{color:'#f1f5f9'}}>{result.missingCount}</b> missing important keywords.
              </span>
            </p>
            {!paymentConfirmed && (
              <div className="tags">
                {result.previewMissing.map(k=>(
                  <span key={k} style={{filter:'blur(5px)',userSelect:'none',pointerEvents:'none'}}>{k}</span>
                ))}
                {result.missingCount > 3 && (
                  <span style={{background:'#1e293b',border:'1px solid #334155',borderRadius:999,padding:'6px 12px',fontSize:13,color:'#94a3b8'}}>
                    +{result.missingCount-3} more (unlocked after payment)
                  </span>
                )}
              </div>
            )}
            {paymentConfirmed && (
              <>
                <div style={{marginBottom:10}}>
                  <p style={{marginBottom:6,fontWeight:700,color:'#15803d'}}>✓ Keywords found in your CV:</p>
                  <div className="tags">
                    {result.found.map(k=>(
                      <span key={k} style={{background:'#dcfce7',color:'#166534',borderRadius:999,padding:'6px 12px',fontWeight:700}}>{k}</span>
                    ))}
                  </div>
                </div>
                <div style={{marginTop:10}}>
                  <p style={{marginBottom:6,fontWeight:700,color:'#dc2626'}}>✗ Missing keywords (added to your CV):</p>
                  <div className="tags">
                    {result.missing.map(k=>(
                      <span key={k} style={{background:'#fee2e2',color:'#991b1b',borderRadius:999,padding:'6px 12px',fontWeight:700}}>{k}</span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <div style={{marginBottom:16}}>
            <p style={{fontWeight:700,fontSize:14,marginBottom:4}}>Quick Improvement</p>
            <p style={{color:'#94a3b8',fontSize:13}}>{result.quickImprovement}</p>
          </div>

          {/* ── LOCKED CARD ── */}
          <div className="locked-card">
            <h3>Unlock Full CV Optimization — {PRICES.optimization}</h3>
            <p>Get the complete ATS keyword report, rewritten summary with professional sentences, improved experience section, skills optimization, and a downloadable PDF CV.</p>
            {paymentConfirmed ? (
              <div>
                <p className="success">Payment confirmed. Remaining outputs: {remainingOutputs}</p>
                <button onClick={generatePaidOptimizationCV} disabled={loading}>
                  {loading ? '⏳ writing your CV...' : 'Generate Full Optimized CV'}
                </button>
              </div>
            ) : (
              <UnlockButton
                service="optimization"
                label={`Optimize My CV — ${PRICES.optimization}`}
                onBeforeRedirect={() => {
                  if (!resume.trim() || !jobDescription.trim()) {
                    throw new Error('Please upload your CV and paste the job description first.');
                  }
                  sessionStorage.setItem(
                    'resuvanta_pending_optimization',
                    JSON.stringify({ resume, jobDescription })
                  );
                }}
              />
            )}
          </div>

        </div>
      )}

      {paidCV && (
        <div className="paid-output">
          <h3>Edit Your Optimized CV Before PDF</h3>
          <p className="muted">Professional sentences have been added automatically. Edit any field, then download your PDF.</p>
          {profSentences.length > 0 && (
            <div style={{background:'rgba(22,163,74,0.1)',border:'1px solid rgba(22,163,74,0.3)',borderRadius:12,padding:14,marginBottom:20}}>
              <p style={{fontWeight:700,color:'#4ade80',marginBottom:8}}>✓ Professional sentences added automatically:</p>
              {profSentences.map((s,i)=><p key={i} style={{color:'#86efac',fontSize:13,marginBottom:4}}>• {s}</p>)}
            </div>
          )}
          <div style={{marginBottom:20}}>
            <p style={{fontWeight:700,fontSize:15,marginBottom:12,color:'#94a3b8',borderBottom:'1px solid #24344f',paddingBottom:8}}>Personal Information</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div><label style={{display:'block',fontSize:12,color:'#64748b',marginBottom:4,fontWeight:700}}>Full Name</label><input value={paidCV.name} onChange={e=>updatePaidCVField('name',e.target.value)} placeholder="e.g. John Smith"/></div>
              <div><label style={{display:'block',fontSize:12,color:'#64748b',marginBottom:4,fontWeight:700}}>Phone Number</label><input value={paidCV.phone} onChange={e=>updatePaidCVField('phone',e.target.value)} placeholder="e.g. +971 50 123 4567"/></div>
              <div><label style={{display:'block',fontSize:12,color:'#64748b',marginBottom:4,fontWeight:700}}>Email Address</label><input value={paidCV.email} onChange={e=>updatePaidCVField('email',e.target.value)} placeholder="e.g. name@email.com"/></div>
              <div><label style={{display:'block',fontSize:12,color:'#64748b',marginBottom:4,fontWeight:700}}>LinkedIn URL</label><input value={paidCV.linkedin} onChange={e=>updatePaidCVField('linkedin',e.target.value)} placeholder="e.g. linkedin.com/in/yourname"/></div>
              <div style={{gridColumn:'span 2'}}><label style={{display:'block',fontSize:12,color:'#64748b',marginBottom:4,fontWeight:700}}>Address</label><input value={paidCV.address||''} onChange={e=>updatePaidCVField('address',e.target.value)} placeholder="e.g. Sharjah, UAE"/></div>
            </div>
          </div>
          <div style={{marginBottom:20}}>
            <p style={{fontWeight:700,fontSize:15,marginBottom:6,color:'#94a3b8',borderBottom:'1px solid #24344f',paddingBottom:8}}>Professional Summary</p>
            <p style={{fontSize:12,color:'#64748b',marginBottom:8}}>Write 3–5 sentences about your background, skills, and career goal.</p>
            <textarea style={{minHeight:120}} value={paidCV.summary} onChange={e=>updatePaidCVField('summary',e.target.value)} placeholder="e.g. Results-focused pharmacist with 5+ years of experience..."/>
          </div>
          <div style={{marginBottom:20}}>
            <p style={{fontWeight:700,fontSize:15,marginBottom:6,color:'#94a3b8',borderBottom:'1px solid #24344f',paddingBottom:8}}>Professional Experience</p>
            <p style={{fontSize:12,color:'#64748b',marginBottom:8}}>List each role with company, dates, and key achievements.</p>
            <textarea style={{minHeight:160}} value={paidCV.experience} onChange={e=>updatePaidCVField('experience',e.target.value)} placeholder={'e.g.\nSenior Pharmacist — MedCare Hospital (2020–present)\n• Managed daily dispensing for 200+ patients'}/>
          </div>
          <div style={{marginBottom:20}}>
            <p style={{fontWeight:700,fontSize:15,marginBottom:6,color:'#94a3b8',borderBottom:'1px solid #24344f',paddingBottom:8}}>Education</p>
            <p style={{fontSize:12,color:'#64748b',marginBottom:8}}>Include your degree, university, graduation year, and country.</p>
            <textarea style={{minHeight:80}} value={paidCV.education} onChange={e=>updatePaidCVField('education',e.target.value)} placeholder={'e.g.\nBachelor of Pharmacy\nCairo University | 2018 | Egypt'}/>
          </div>
          <div style={{marginBottom:20}}>
            <p style={{fontWeight:700,fontSize:15,marginBottom:12,color:'#94a3b8',borderBottom:'1px solid #24344f',paddingBottom:8}}>Skills</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div>
                <label style={{display:'block',fontSize:12,color:'#64748b',marginBottom:4,fontWeight:700}}>Soft Skills</label>
                <textarea style={{minHeight:80}} value={paidCV.softSkills} onChange={e=>updatePaidCVField('softSkills',e.target.value)} placeholder="e.g. Communication, teamwork..."/>
              </div>
              <div>
                <label style={{display:'block',fontSize:12,color:'#64748b',marginBottom:4,fontWeight:700}}>Technical Skills</label>
                <textarea style={{minHeight:80}} value={paidCV.technicalSkills} onChange={e=>updatePaidCVField('technicalSkills',e.target.value)} placeholder="e.g. Clinical pharmacy, dispensing..."/>
              </div>
            </div>
          </div>
          <div style={{marginBottom:20}}>
            <p style={{fontWeight:700,fontSize:15,marginBottom:6,color:'#94a3b8',borderBottom:'1px solid #24344f',paddingBottom:8}}>Internship and Courses</p>
            <textarea style={{minHeight:100}} value={paidCV.internshipCourses} onChange={e=>updatePaidCVField('internshipCourses',e.target.value)} placeholder={'e.g.\nPharmacy Internship — Cairo Hospital (2017)'}/>
          </div>
          <div style={{marginBottom:20}}>
            <p style={{fontWeight:700,fontSize:15,marginBottom:12,color:'#94a3b8',borderBottom:'1px solid #24344f',paddingBottom:8}}>Additional Details</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div><label style={{display:'block',fontSize:12,color:'#64748b',marginBottom:4,fontWeight:700}}>Languages</label><input value={paidCV.language} onChange={e=>updatePaidCVField('language',e.target.value)} placeholder="e.g. Arabic (native), English (fluent)"/></div>
              <div><label style={{display:'block',fontSize:12,color:'#64748b',marginBottom:4,fontWeight:700}}>Licenses & Certifications</label><input value={paidCV.license} onChange={e=>updatePaidCVField('license',e.target.value)} placeholder="e.g. UAE Pharmacist License, DHA"/></div>
            </div>
          </div>
          <div style={{marginBottom:24}}>
            <p style={{fontWeight:700,fontSize:15,marginBottom:6,color:'#94a3b8',borderBottom:'1px solid #24344f',paddingBottom:8}}>Additional Information</p>
            <textarea style={{minHeight:80}} value={paidCV.additionalInfo} onChange={e=>updatePaidCVField('additionalInfo',e.target.value)} placeholder="e.g. UAE driving license holder."/>
          </div>
          {paidCV?.scoreJustification && (
            <div style={{marginBottom:18,padding:14,background:'rgba(217,119,6,0.1)',border:'1px solid rgba(217,119,6,0.2)',borderRadius:12}}>
              <p style={{fontWeight:700,fontSize:14,color:'#f59e0b',marginBottom:4}}>Score Justification</p>
              <p style={{color:'#94a3b8',fontSize:13}}>{paidCV.scoreJustification}</p>
            </div>
          )}

          {suggestedAchievements.length > 0 && (
            <div style={{marginBottom:24,padding:16,background:'rgba(37,99,235,0.08)',border:'1px solid rgba(37,99,235,0.25)',borderRadius:12}}>
              <p style={{fontWeight:700,fontSize:15,color:'#93c5fd',marginBottom:4}}>⭐ Suggested Achievements</p>
              <p style={{fontSize:12,color:'#94a3b8',marginBottom:14}}>
                Select achievements that apply to you, fill in your numbers, then click Add to CV.
              </p>
              {suggestedAchievements.map((achievement, i) => {
                const isSelected = selectedAchievements.some(a => a.index === i);
                const selected = selectedAchievements.find(a => a.index === i);
                return (
                  <div key={i} style={{marginBottom:10,padding:12,background:isSelected?'rgba(37,99,235,0.12)':'rgba(255,255,255,0.02)',border:isSelected?'1px solid rgba(37,99,235,0.4)':'1px solid rgba(255,255,255,0.08)',borderRadius:8}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                      <input type="checkbox" checked={isSelected} style={{marginTop:3,cursor:'pointer',width:16,height:16,flexShrink:0}}
                        onChange={e => {
                          if (e.target.checked) setSelectedAchievements(prev => [...prev, { index: i, text: achievement, customText: achievement }]);
                          else setSelectedAchievements(prev => prev.filter(a => a.index !== i));
                        }}
                      />
                      <div style={{flex:1}}>
                        <p style={{fontSize:13,color:'#e2e8f0',marginBottom:isSelected?6:0}}>{achievement}</p>
                        {isSelected && (
                          <textarea style={{width:'100%',minHeight:60,fontSize:12,marginTop:4}} value={selected?.customText || achievement}
                            placeholder="Edit and fill in your numbers..."
                            onChange={e => setSelectedAchievements(prev => prev.map(a => a.index===i ? {...a, customText:e.target.value} : a))}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {selectedAchievements.length > 0 && (
                <div style={{marginTop:14,padding:14,background:'rgba(15,23,42,0.6)',borderRadius:10,border:'1px solid #1e293b'}}>
                  <label style={{fontSize:13,color:'#94a3b8',display:'block',marginBottom:8,fontWeight:700}}>
                    Add achievements to this job:
                  </label>
                  <select
                    id="jobTargetSelect"
                    style={{width:'100%',padding:'10px',borderRadius:'8px',background:'#0f172a',color:'#f8fafc',border:'1px solid #334155',marginBottom:14,fontSize:13,outline:'none'}}
                  >
                    {(paidCV.experience || '').split(/\n\s*\n/).filter(b => b.trim()).map((block, idx) => {
                      const title = block.split('\n').find(l => l.trim())?.substring(0, 60) || `Job ${idx + 1}`;
                      return <option key={idx} value={idx}>{title} {idx === 0 ? '(Latest)' : ''}</option>;
                    })}
                  </select>
                  <button style={{width:'100%',background:'linear-gradient(135deg,#2563eb,#4f46e5)',color:'#fff',border:'none',borderRadius:8,padding:'12px 20px',fontWeight:700,cursor:'pointer',fontSize:14,transition:'0.2s'}}
                    onClick={() => {
                      const added = selectedAchievements.map(a => '• ' + (a.customText || a.text)).join('\n');
                      const blocks = (paidCV.experience || '').split(/\n\s*\n/).filter(b => b.trim());
                      if (blocks.length === 0) blocks.push('');
                      const selectEl = document.getElementById('jobTargetSelect');
                      const target = selectEl ? Number(selectEl.value) : 0;
                      blocks[target] = blocks[target].trimEnd() + '\n' + added;
                      updatePaidCVField('experience', blocks.join('\n\n'));
                      setSuggestedAchievements([]);
                      setSelectedAchievements([]);
                    }}
                  >
                    Add Selected to CV Experience
                  </button>
                </div>
              )}
            </div>
          )}

          <h3>Live Preview</h3>
          <CVTemplatePreview cv={paidCV} />
          <button onClick={async ()=>{
            await openPDFWindow(paidCV,'Optimized CV');
            clearServiceSession('optimization');
            setPaymentConfirmed(false); setRemainingOutputs(3);
            setResume(''); setJobDescription(''); setResult(null); setPaidCV(null); setProfSentences([]);
            setMessage('PDF downloaded. Temporary session data has been cleared.');
          }}>Download PDF</button>
        </div>
      )}
    </section>
  );
}

// ─── Builder Wizard ───────────────────────────────────────────────────────────
function BuilderWizard() {
  const [step, setStep] = useState(1);
  const [builtCV, setBuiltCV] = useState(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [remainingOutputs, setRemainingOutputs] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [builder, setBuilder] = useState({
    targetJob:'',jobDescription:'',name:'',address:'',phone:'',email:'',linkedin:'',
    degree:'',university:'',graduationYear:'',educationCountry:'',
    experiences:[{jobTitle:'',company:'',location:'',startDate:'',endDate:'',responsibilities:'',achievements:''}],
    softSkills:'',technicalSkills:'',internships:'',courses:'',languages:'',licenses:'',additionalInfo:'',
  });
  const totalSteps = 7;

  const [suggestedSoftSkills, setSuggestedSoftSkills] = useState([]);
  const [selectedSoftSkills, setSelectedSoftSkills] = useState([]);
  const [suggestedTechnicalSkills, setSuggestedTechnicalSkills] = useState([]);
  const [selectedTechnicalSkills, setSelectedTechnicalSkills] = useState([]);

  useEffect(()=>{
    const paymentService = sessionStorage.getItem('resuvanta_payment_success');
    const saved = sessionStorage.getItem('resuvanta_pending_builder');
    if (paymentService==='builder'&&saved) {
      sessionStorage.removeItem('resuvanta_payment_success');
      try {
        const data = JSON.parse(saved);
        if (data.builder) setBuilder(data.builder);
        const used = getUsageCount('builder');
        setPaymentConfirmed(true);
        setRemainingOutputs(Math.max(0,3-used));
      } catch {}
    }
  },[]);

  function updateBuilder(key,value) { setBuilder(old=>({...old,[key]:value})); }
  function updateExperience(index,key,value) {
    const updated=[...builder.experiences]; updated[index][key]=value;
    setBuilder(old=>({...old,experiences:updated}));
  }
  function addExperience() { setBuilder(old=>({...old,experiences:[...old.experiences,{jobTitle:'',company:'',location:'',startDate:'',endDate:'',responsibilities:'',achievements:''}]})); }
  function removeExperience(index) { if (builder.experiences.length===1) return; setBuilder(old=>({...old,experiences:old.experiences.filter((_,i)=>i!==index)})); }
  function formatExperience() {
    const sorted = [...builder.experiences].sort((a, b) => {
      const isCurrentA = !a.endDate || a.endDate.toLowerCase().includes('present') || a.endDate.toLowerCase().includes('current');
      const isCurrentB = !b.endDate || b.endDate.toLowerCase().includes('present') || b.endDate.toLowerCase().includes('current');
      if (isCurrentA && !isCurrentB) return -1;
      if (!isCurrentA && isCurrentB) return 1;
      const dateA = new Date(a.endDate || a.startDate || '');
      const dateB = new Date(b.endDate || b.startDate || '');
      return dateB.getTime() - dateA.getTime();
    });
    return sorted.map(exp => {
      const r = exp.responsibilities.split('\n').map(x => x.trim()).filter(Boolean).map(x => `• ${x}`).join('\n') || '• Add main responsibilities here.';
      const a = exp.achievements.split('\n').map(x => x.trim()).filter(Boolean).map(x => `• ${x}`).join('\n') || '';
      return `${exp.jobTitle || 'Job Title'}\n${exp.company || 'Company Name'} | ${exp.location || 'Location'} | ${exp.startDate || 'Start Date'} - ${exp.endDate || 'End Date'}\n${r}\n${a}`;
    }).join('\n\n');
  }
  
  async function generatePaidBuilderCV() {
    if (getUsageCount('builder') >= 3) { 
      alert('You have used all 3 CV outputs for this payment session.');
      return; 
    }
    if (!builder.targetJob || builder.targetJob.trim() === '') { 
      alert('Please enter a Target Job in Step 1 to generate correct skills.');
      setStep(1);
      return; 
    }
    setIsGenerating(true);
    try {
      const payload = {
        service: 'builder',
        targetJob: builder.targetJob,
        jobDescription: builder.jobDescription,
        builderData: `Name: ${builder.name}\nAddress: ${builder.address}\nDegree: ${builder.degree}\nExperience:\n${formatExperience()}`
      };
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate CV');
      }
      const { parsed: p } = await response.json();
      if (p?.suggestedSoftSkills) setSuggestedSoftSkills(p.suggestedSoftSkills);
      if (p?.suggestedTechnicalSkills) setSuggestedTechnicalSkills(p.suggestedTechnicalSkills);
      const cv = {
        name: p.name || builder.name || 'NAME', 
        address: p.address || builder.address || 'Not provided',
        phone: p.phone || builder.phone || 'Not provided', 
        email: p.email || builder.email || 'Not provided',
        linkedin: p.linkedin || builder.linkedin || 'Not provided',
        summary: p.summary || `Motivated ${builder.targetJob} professional.`,
        experience: p.experience || formatExperience(),
        education: p.education || `${builder.degree} - ${builder.university} (${builder.graduationYear})`,
        softSkills: p.softSkills || builder.softSkills,
        technicalSkills: p.technicalSkills || builder.technicalSkills,
        internshipCourses: p.internshipCourses || `${builder.internships} ${builder.courses}`,
        additionalInfo: p.additionalInfo || builder.additionalInfo || '',
        language: p.language || builder.languages || 'Not provided',
        license: p.license || builder.licenses || 'Not provided',
      };
      setBuiltCV(cv);
      setRemainingOutputs(Math.max(0, 3 - increaseUsageCount('builder')));
    } catch(e) {
      alert(e.message || 'AI generation failed. Please try again.');
    } finally { 
      setIsGenerating(false); 
    }
  }

  return (
    <div className="builder-wizard">
      <div className="progress-box">
        <div className="progress-info">
          <b>Step {step} of {totalSteps}</b>
          <span>{Math.round((step/totalSteps)*100)}% completed</span>
        </div>
        <div className="progress-bar"><div style={{width:`${(step/totalSteps)*100}%`}}></div></div>
      </div>

      {step===1&&<div className="wizard-card"><h3>Target Job</h3>
        <input placeholder="Target Job Title" value={builder.targetJob} onChange={e=>updateBuilder('targetJob',e.target.value)}/>
        <textarea placeholder="Optional: Paste Job Description" value={builder.jobDescription} onChange={e=>updateBuilder('jobDescription',e.target.value)}/>
      </div>}
      {step===2&&<div className="wizard-card"><h3>Personal Information</h3><div className="form">
        <input placeholder="Full Name" value={builder.name} onChange={e=>updateBuilder('name',e.target.value)}/>
        <input placeholder="Address / City" value={builder.address} onChange={e=>updateBuilder('address',e.target.value)}/>
        <input placeholder="Phone" value={builder.phone} onChange={e=>updateBuilder('phone',e.target.value)}/>
        <input placeholder="Email" value={builder.email} onChange={e=>updateBuilder('email',e.target.value)}/>
        <input placeholder="LinkedIn" value={builder.linkedin} onChange={e=>updateBuilder('linkedin',e.target.value)}/>
      </div></div>}
      {step===3&&<div className="wizard-card"><h3>Education</h3><div className="form">
        <input placeholder="Degree" value={builder.degree} onChange={e=>updateBuilder('degree',e.target.value)}/>
        <input placeholder="University" value={builder.university} onChange={e=>updateBuilder('university',e.target.value)}/>
        <input placeholder="Graduation Year" value={builder.graduationYear} onChange={e=>updateBuilder('graduationYear',e.target.value)}/>
        <input placeholder="Country" value={builder.educationCountry} onChange={e=>updateBuilder('educationCountry',e.target.value)}/>
      </div></div>}
      {step===4&&<div className="wizard-card"><h3>Professional Experience</h3>
        {builder.experiences.map((exp,index)=>(
          <div className="experience-card" key={index}>
            <h4>Experience {index+1}</h4>
            <div className="form">
              <input placeholder="Job Title" value={exp.jobTitle} onChange={e=>updateExperience(index,'jobTitle',e.target.value)}/>
              <input placeholder="Company" value={exp.company} onChange={e=>updateExperience(index,'company',e.target.value)}/>
              <input placeholder="Location" value={exp.location} onChange={e=>updateExperience(index,'location',e.target.value)}/>
              <input placeholder="Start Date" value={exp.startDate} onChange={e=>updateExperience(index,'startDate',e.target.value)}/>
              <input placeholder="End Date / Present" value={exp.endDate} onChange={e=>updateExperience(index,'endDate',e.target.value)}/>
              <textarea placeholder="Responsibilities - one per line" value={exp.responsibilities} onChange={e=>updateExperience(index,'responsibilities',e.target.value)}/>
              <textarea placeholder="Achievements - one per line" value={exp.achievements} onChange={e=>updateExperience(index,'achievements',e.target.value)}/>
            </div>
            {builder.experiences.length>1&&<button className="danger-btn" onClick={()=>removeExperience(index)}>Remove Experience</button>}
          </div>
        ))}
        <button className="secondary" onClick={addExperience}>+ Add Another Experience</button>
      </div>}
      {step===5&&<div className="wizard-card"><h3>Skills</h3>
        <textarea placeholder="Soft Skills" value={builder.softSkills} onChange={e=>updateBuilder('softSkills',e.target.value)}/>
        <textarea placeholder="Technical Skills" value={builder.technicalSkills} onChange={e=>updateBuilder('technicalSkills',e.target.value)}/>
      </div>}
      {step===6&&<div className="wizard-card"><h3>Internship and Courses</h3>
        <textarea placeholder="Internships" value={builder.internships} onChange={e=>updateBuilder('internships',e.target.value)}/>
        <textarea placeholder="Courses / Training" value={builder.courses} onChange={e=>updateBuilder('courses',e.target.value)}/>
      </div>}
      {step===7&&<div className="wizard-card"><h3>Languages, Licenses and Additional Info</h3>
        <textarea placeholder="Languages" value={builder.languages} onChange={e=>updateBuilder('languages',e.target.value)}/>
        <textarea placeholder="Licenses" value={builder.licenses} onChange={e=>updateBuilder('licenses',e.target.value)}/>
        <textarea placeholder="Additional Information" value={builder.additionalInfo} onChange={e=>updateBuilder('additionalInfo',e.target.value)}/>
      </div>}

      <div className="wizard-actions">
        {step>1&&<button className="secondary" onClick={()=>setStep(step-1)}>Back</button>}
        {step<totalSteps&&<button onClick={()=>setStep(step+1)}>Next</button>}

        {/* ── BUILDER PAYMENT GATE ── */}
        {step===totalSteps&&<>
          {paymentConfirmed ? (
            <>
              <button onClick={generatePaidBuilderCV} disabled={isGenerating}>
                {isGenerating ? '⏳ building your CV...' : 'Generate Paid CV Output'}
              </button>
              <p className="success">Payment confirmed. Remaining outputs: {remainingOutputs}</p>
            </>
          ) : (
            <UnlockButton
              service="builder"
              label={`Unlock Resume Package — ${PRICES.builder}`}
              onBeforeRedirect={() => {
                sessionStorage.setItem(
                  'resuvanta_pending_builder',
                  JSON.stringify({ builder })
                );
              }}
            />
          )}
        </>}

      </div>

      {builtCV && (
        <div className="built-output" style={{marginTop: 32}}>
          <h3>Review & Customize Your Optimized CV</h3>
          
          {suggestedSoftSkills && suggestedSoftSkills.length > 0 && (
            <div style={{marginBottom: 16, padding: 16, background: '#0f172a', borderRadius: 12, border: '1px solid #1e293b'}}>
              <p style={{fontWeight: 700, color: '#f8fafc', marginBottom: 12}}>⭐ Suggested Soft Skills (Based on Job Description)</p>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
                {suggestedSoftSkills.map((skill, i) => (
                  <label key={i} style={{background: selectedSoftSkills.includes(skill) ? '#2563eb' : '#1e293b', color: '#fff', padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 13, userSelect: 'none', transition: '0.2s'}}>
                    <input type="checkbox" style={{display: 'none'}} checked={selectedSoftSkills.includes(skill)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedSoftSkills([...selectedSoftSkills, skill]);
                        else setSelectedSoftSkills(selectedSoftSkills.filter(s => s !== skill));
                      }}
                    />
                    {skill}
                  </label>
                ))}
              </div>
            </div>
          )}

          {suggestedTechnicalSkills && suggestedTechnicalSkills.length > 0 && (
            <div style={{marginBottom: 16, padding: 16, background: '#0f172a', borderRadius: 12, border: '1px solid #1e293b'}}>
              <p style={{fontWeight: 700, color: '#f8fafc', marginBottom: 12}}>⚙️ Suggested Technical Skills</p>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
                {suggestedTechnicalSkills.map((skill, i) => (
                  <label key={i} style={{background: selectedTechnicalSkills.includes(skill) ? '#10b981' : '#1e293b', color: '#fff', padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 13, userSelect: 'none', transition: '0.2s'}}>
                    <input type="checkbox" style={{display: 'none'}} checked={selectedTechnicalSkills.includes(skill)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedTechnicalSkills([...selectedTechnicalSkills, skill]);
                        else setSelectedTechnicalSkills(selectedTechnicalSkills.filter(s => s !== skill));
                      }}
                    />
                    {skill}
                  </label>
                ))}
              </div>
            </div>
          )}

          {(selectedSoftSkills.length > 0 || selectedTechnicalSkills.length > 0) && (
            <button style={{marginBottom: 24, background:'linear-gradient(135deg,#2563eb,#4f46e5)',color:'#fff',border:'none',borderRadius:8,padding:'10px 20px',fontWeight:700,cursor:'pointer'}} 
              onClick={() => {
                let currentSoft = builtCV.softSkills ? builtCV.softSkills.split(',').map(s=>s.trim()) : [];
                let currentTech = builtCV.technicalSkills ? builtCV.technicalSkills.split(',').map(s=>s.trim()) : [];
                const newSoft = [...new Set([...currentSoft, ...selectedSoftSkills])].filter(Boolean).join(' | ');
                const newTech = [...new Set([...currentTech, ...selectedTechnicalSkills])].filter(Boolean).join(' | ');
                setBuiltCV({...builtCV, softSkills: newSoft, technicalSkills: newTech});
                setSuggestedSoftSkills([]);
                setSuggestedTechnicalSkills([]);
                setSelectedSoftSkills([]);
                setSelectedTechnicalSkills([]);
              }}>
              ✓ Add Selected Skills to CV
            </button>
          )}

          <CVTemplatePreview cv={builtCV}/>
          <button onClick={async ()=>{
            await openPDFWindow(builtCV,'Built CV');
            clearServiceSession('builder');
            setPaymentConfirmed(false); setRemainingOutputs(3); setBuiltCV(null);
          }}>Download PDF</button>
        </div>
      )}
    </div>
  );
}

function BuilderPage() {
  return (
    <section className="section">
      <h2>CV Builder + Optimization — {PRICES.builder}</h2>
      <p className="muted">No CV yet? Answer simple questions, add your target job, and generate an optimized ATS-friendly CV.</p>
      <StepsStrip steps={['Enter target job','Fill personal info','Add education & experience','Pay & generate CV']}/>
      <div className="builder-price-box">
        <h3>CV Builder + Optimization — {PRICES.builder}</h3>
        <p>Build a complete CV from scratch and optimize it for your target job in one package. Final output: PDF only.</p>
      </div>
      <BuilderWizard/>
    </section>
  );
}

// ─── LinkedIn Page ────────────────────────────────────────────────────────────
function LinkedInPage() {
  const [targetRole, setTargetRole] = useState('');
  const [cvFile, setCvFile] = useState(null);
  const [cvText, setCvText] = useState('');
  const [headline, setHeadline] = useState('');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [fullLinkedInOutput, setFullLinkedInOutput] = useState(null);
  const [isGeneratingLinkedIn, setIsGeneratingLinkedIn] = useState(false);
  const [fileError, setFileError] = useState('');
  const [fileLoading, setFileLoading] = useState(false);

  useEffect(() => {
    const paymentService = sessionStorage.getItem('resuvanta_payment_success');
    const saved = sessionStorage.getItem('resuvanta_pending_linkedin');
    if (paymentService === 'linkedin' && saved) {
      sessionStorage.removeItem('resuvanta_payment_success');
      try {
        const data = JSON.parse(saved);
        if (data.targetRole) setTargetRole(data.targetRole);
        if (data.cvText) setCvText(data.cvText);
        setPaymentConfirmed(true);
      } catch {}
    }
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileError('');
    setFileLoading(true);
    setCvFile(file);
    const fileName = file.name.toLowerCase();
    try {
      let extractedText = '';
      if (fileName.endsWith('.txt')) {
        extractedText = await file.text();
      } else if (fileName.endsWith('.pdf')) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
        let fullText = '';
        for (let p = 1; p <= pdf.numPages; p++) {
          const page = await pdf.getPage(p);
          const c = await page.getTextContent();
          fullText += c.items.map(i => i.str).join(' ') + '\n\n';
        }
        if (!fullText.trim()) {
          setFileError('Could not extract text from this PDF. It may be scanned as an image.');
          setFileLoading(false);
          return;
        }
        extractedText = fullText;
      } else if (fileName.endsWith('.docx')) {
        await loadScript('https://unpkg.com/mammoth/mammoth.browser.min.js');
        const output = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        if (!output.value.trim()) {
          setFileError('Could not extract text from this DOCX.');
          setFileLoading(false);
          return;
        }
        extractedText = output.value;
      } else {
        setFileError('Unsupported file type. Upload PDF, DOCX, or TXT.');
        setFileLoading(false);
        return;
      }
      setCvText(extractedText);
      sessionStorage.setItem('resuvanta_pending_linkedin', JSON.stringify({
        targetRole,
        cvText: extractedText,
      }));
    } catch {
      setFileError('Could not read this file. Please try again.');
    } finally {
      setFileLoading(false);
    }
  };

  function generateHeadlinePreview() {
    if (!targetRole.trim()) {
      alert('Please enter your Target Role first.');
      return;
    }
    setHeadline(`${targetRole} | Specialized Professional | Open to New Opportunities`);
  }

  async function generateFullLinkedInOptimization() {
    setIsGeneratingLinkedIn(true);
    try {
      const { parsed: aiParsed } = await callAI({
        service: 'linkedin',
        targetRole,
        resume: cvText || `Target Role: ${targetRole}`,
      });
      const p = aiParsed || {};
      setFullLinkedInOutput({
        headline: p.headline || `${targetRole} | Professional Profile`,
        about: p.about || `Results-focused professional specializing as ${targetRole}.`,
        skills: p.skills || `${targetRole}, Leadership, Strategic Planning, Technical Skills`,
        recruiterKeywords: p.recruiterKeywords || `${targetRole}, Optimization, Industry Expert`,
      });
    } catch(e) {
      alert(e.message || 'AI generation failed. Please try again.');
    } finally {
      setIsGeneratingLinkedIn(false);
    }
  }

  return (
    <section className="section">
      <h2>LinkedIn Optimization — {PRICES.linkedin}</h2>
      <p className="muted">Free preview gives one headline only. Full LinkedIn optimization unlocks About section, experience rewrite, skills, and recruiter keywords based on your uploaded CV.</p>

      <StepsStrip steps={['Enter target role', 'Upload Your CV', 'Get free headline', 'Pay & unlock full profile']}/>

      <div className="form" style={{display:'flex', flexDirection:'column', gap:'16px', maxWidth:'600px', margin:'0 auto'}}>
        <input
          placeholder="Target Role, e.g. Community Pharmacist"
          value={targetRole}
          onChange={e => setTargetRole(e.target.value)}
        />

        <div style={{
          border: `2px dashed ${cvText ? '#10b981' : '#1e293b'}`,
          borderRadius: '8px',
          padding: '24px',
          textAlign: 'center',
          background: '#0f172a',
          cursor: 'pointer',
          position: 'relative',
          transition: 'border-color 0.2s',
        }}>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
            style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', opacity:0, cursor:'pointer'}}
          />
          <span style={{fontSize:'24px', display:'block', marginBottom:'8px'}}>
            {fileLoading ? '⏳' : cvText ? '✅' : '📁'}
          </span>
          <p style={{color:'#f8fafc', margin:'0 0 4px 0', fontSize:'14px', fontWeight:'bold'}}>
            {fileLoading ? 'Reading file...' : cvText ? 'CV Uploaded Successfully!' : 'Click or Drag to Upload Your CV'}
          </p>
          <p style={{color:'#94a3b8', margin:0, fontSize:'12px'}}>
            {cvFile ? `Selected: ${cvFile.name}` : 'Supports PDF, DOCX, TXT (Max 5MB)'}
          </p>
        </div>

        {fileError && <p className="error">{fileError}</p>}
      </div>

      <div className="button-row" style={{marginTop:'20px'}}>
        <button onClick={generateHeadlinePreview}>Generate Free Headline Preview</button>
      </div>

      {headline && <div className="preview-box single">
        <h3>Free Headline Preview</h3>
        <p>{headline}</p>

        {/* ── LINKEDIN LOCKED CARD ── */}
        <div className="locked-card">
          <h3>Unlock LinkedIn Optimization — {PRICES.linkedin}</h3>
          <p>Get your professional headline, About section, experience wording, skills list, and recruiter search keywords.</p>
          {paymentConfirmed ? (
            <button onClick={generateFullLinkedInOptimization} disabled={isGeneratingLinkedIn}>
              {isGeneratingLinkedIn ? '⏳ optimizing your profile...' : 'Generate Full LinkedIn Optimization'}
            </button>
          ) : (
            <UnlockButton
              service="linkedin"
              label={`Optimize My LinkedIn — ${PRICES.linkedin}`}
              onBeforeRedirect={() => {
                if (!targetRole.trim() || !cvText) {
                  throw new Error('Please enter your target role and upload your CV first.');
                }
                sessionStorage.setItem(
                  'resuvanta_pending_linkedin',
                  JSON.stringify({ targetRole, cvText })
                );
              }}
            />
          )}
        </div>

      </div>}

      {fullLinkedInOutput && <div className="paid-output">
        <h3>Full LinkedIn Optimization</h3>

        <div style={{marginBottom:'20px'}}>
          <h4 style={{color:'#94a3b8', borderBottom:'1px solid #24344f', paddingBottom:'8px', marginBottom:'12px'}}>Professional Headline</h4>
          <p style={{fontSize:'15px', color:'#f8fafc', background:'#0f172a', padding:'12px', borderRadius:'8px', border:'1px solid #1e293b'}}>{fullLinkedInOutput.headline}</p>
        </div>

        <div style={{marginBottom:'20px'}}>
          <h4 style={{color:'#94a3b8', borderBottom:'1px solid #24344f', paddingBottom:'8px', marginBottom:'12px'}}>About Section</h4>
          <p style={{fontSize:'14px', color:'#f8fafc', background:'#0f172a', padding:'16px', borderRadius:'8px', border:'1px solid #1e293b', whiteSpace:'pre-wrap', lineHeight:'1.6'}}>{fullLinkedInOutput.about}</p>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'24px'}}>
          <div>
            <h4 style={{color:'#94a3b8', borderBottom:'1px solid #24344f', paddingBottom:'8px', marginBottom:'12px'}}>Skills Keywords</h4>
            <p style={{fontSize:'13px', color:'#cbd5e1', background:'#0f172a', padding:'12px', borderRadius:'8px', border:'1px solid #1e293b'}}>{fullLinkedInOutput.skills}</p>
          </div>
          <div>
            <h4 style={{color:'#94a3b8', borderBottom:'1px solid #24344f', paddingBottom:'8px', marginBottom:'12px'}}>Recruiter Search Keywords</h4>
            <p style={{fontSize:'13px', color:'#cbd5e1', background:'#0f172a', padding:'12px', borderRadius:'8px', border:'1px solid #1e293b'}}>{fullLinkedInOutput.recruiterKeywords}</p>
          </div>
        </div>

        <div style={{marginTop:'32px', background:'linear-gradient(145deg, #101827 0%, #0f172a 100%)', padding:'24px', borderRadius:'16px', border:'1px solid #1e293b', textAlign:'left'}}>
          <h3 style={{color:'#f8fafc', marginBottom:'20px', fontSize:'18px', display:'flex', alignItems:'center', gap:'8px'}}>🚀 Bonus: Expert LinkedIn Tips & AI Tools</h3>

          <div style={{marginBottom:'20px'}}>
            <h4 style={{color:'#3b82f6', marginBottom:'8px', fontSize:'15px'}}>1. How to Verify Your Account (Get the Badge)</h4>
            <ul style={{fontSize:'13px', color:'#cbd5e1', paddingLeft:'20px', lineHeight:'1.6', margin:0}}>
              <li>Go to <b>Settings & Privacy</b> &gt; <b>Account Preferences</b> &gt; <b>Verifications</b>.</li>
              <li>Depending on your country, choose your verification method (Clear, Persona with Passport/NFC, or Work Email).</li>
              <li>Follow the prompts to get the trusted verification checkmark next to your name.</li>
            </ul>
          </div>

          <div style={{marginBottom:'20px'}}>
            <h4 style={{color:'#10b981', marginBottom:'8px', fontSize:'15px'}}>2. Profile Visibility & Formatting Tricks</h4>
            <ul style={{fontSize:'13px', color:'#cbd5e1', paddingLeft:'20px', lineHeight:'1.6', margin:0}}>
              <li><b>Custom URL:</b> Edit your public profile URL to be just your name (e.g., <i>linkedin.com/in/yourname</i>) without random numbers.</li>
              <li><b>Featured Section:</b> Pin your optimized CV, portfolio, or top posts directly below your About section.</li>
              <li><b>Open to Work:</b> Turn this on for "Recruiters Only" so you appear in more searches without showing the green badge publicly on your picture.</li>
            </ul>
          </div>

          <div style={{marginBottom:'10px'}}>
            <h4 style={{color:'#8b5cf6', marginBottom:'8px', fontSize:'15px'}}>3. AI Tools for a Professional Profile Picture & Cover</h4>
            <ul style={{fontSize:'13px', color:'#cbd5e1', paddingLeft:'20px', lineHeight:'1.6', margin:0}}>
              <li><b>Profile Picture (Free):</b> Use <a href="https://pfpmaker.com/" target="_blank" rel="noreferrer" style={{color:'#60a5fa', textDecoration:'none'}}>PFPMaker.com</a> to instantly remove your background and add a clean, studio-like color.</li>
              <li><b>Profile Picture (Premium):</b> Tools like <a href="https://www.aragon.ai/" target="_blank" rel="noreferrer" style={{color:'#60a5fa', textDecoration:'none'}}>Aragon AI</a> turn normal selfies into high-quality corporate headshots.</li>
              <li><b>Unique Cover Photo:</b> Go to <a href="https://www.canva.com/" target="_blank" rel="noreferrer" style={{color:'#60a5fa', textDecoration:'none'}}>Canva.com</a> and search for "LinkedIn Banner". Pick a template that matches your industry and target role.</li>
            </ul>
          </div>
        </div>

        <button style={{marginTop:'24px'}} onClick={() => {
          clearServiceSession('linkedin');
          setPaymentConfirmed(false);
          setFullLinkedInOutput(null);
          setCvFile(null);
          setCvText('');
        }}>
          Finish and Clear Temporary Data
        </button>
      </div>}
    </section>
  );
}

// ─── Pricing Page ─────────────────────────────────────────────────────────────
function PricingPage() {
  return (
    <section className="section">
      <h2>Our Services</h2>
      <div className="pricing-grid">
        <div className="price-card">
          <h3>CV Optimization</h3><h2>{PRICES.optimization}</h2>
          <p>Improve your existing CV with job-focused recommendations, stronger wording, better structure, and ATS-friendly keyword guidance.</p>
          <ul><li>Free resume preview</li><li>ATS keyword analysis</li><li>Content and wording improvements</li><li>Role-focused optimization tips</li><li>Clear strengths and weaknesses report</li></ul>
        </div>
        <div className="price-card featured">
          <h3>CV Builder + Optimization</h3><h2>{PRICES.builder}</h2>
          <p>Create a professional CV from scratch with guided sections, optimized wording, and a structure designed for job applications.</p>
          <ul><li>Step-by-step CV builder</li><li>Professional CV structure</li><li>ATS-friendly wording</li><li>Skills and experience improvement</li><li>Complete resume package guidance</li></ul>
        </div>
        <div className="price-card">
          <h3>LinkedIn Optimization</h3><h2>{PRICES.linkedin}</h2>
          <p>Improve your LinkedIn profile so recruiters can understand your value faster and find you through better keywords.</p>
          <ul><li>Professional headline improvement</li><li>About section rewrite guidance</li><li>Skills keyword suggestions</li><li>Recruiter search optimization</li><li>Profile visibility improvement tips</li></ul>
        </div>
      </div>
    </section>
  );
}

// ─── FAQ Page ─────────────────────────────────────────────────────────────────
function FAQPage() {
  return (
    <section className="section">
      <h2>FAQ</h2>
      <details><summary>Does the free preview generate the full CV?</summary><p>No. The free preview shows match score bars, missing keyword count, and one improvement suggestion. Full keywords and professional sentences are revealed after payment.</p></details>
      <details><summary>What files can users upload?</summary><p>PDF, DOCX, and TXT are supported.</p></details>
      <details><summary>What file does the user download?</summary><p>The final output is PDF only.</p></details>
      <details><summary>Does this guarantee a job?</summary><p>No. The tool helps improve CV quality and job matching, but it does not guarantee interviews or job offers.</p></details>
    </section>
  );
}

// ─── Script loader ────────────────────────────────────────────────────────────
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) { resolve(); return; }
    const script = document.createElement('script');
    script.src = src; script.onload = resolve; script.onerror = reject;
    document.body.appendChild(script);
  });
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('home');
  const [darkMode, setDarkMode] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    const selectedPage = params.get('page');
    const service = params.get('service');
    const payment = params.get('payment');
    if (['optimization','builder','linkedin','pricing','faq'].includes(selectedPage)) {
      setPage(selectedPage);
    } else if (service && ['optimization','builder','linkedin'].includes(service)) {
      setPage(service);
    }
    if (payment || service || selectedPage) {
      window.history.replaceState({}, '', '/');
    }
  },[]);;

  function renderPage() {
    if (page==='home') return <Home setPage={setPage}/>;
    if (page==='optimization') return <OptimizationPage/>;
    if (page==='builder') return <BuilderPage/>;
    if (page==='linkedin') return <LinkedInPage/>;
    if (page==='pricing') return <PricingPage/>;
    if (page==='faq') return <FAQPage/>;
    return <Home setPage={setPage}/>;
  }

  return (
    <div className={darkMode?'site dark':'site'}>
      <header>
        <button className="brandButton" onClick={()=>setPage('home')}>
          <BrandLogo darkMode={darkMode}/>
        </button>
        <nav className={menuOpen ? 'navOpen' : ''}>
          <button onClick={()=>{setPage('home');setMenuOpen(false);}}>Home</button>
          <button onClick={()=>{setPage('optimization');setMenuOpen(false);}}>CV Optimization</button>
          <button onClick={()=>{setPage('builder');setMenuOpen(false);}}>CV Builder</button>
          <button onClick={()=>{setPage('linkedin');setMenuOpen(false);}}>LinkedIn</button>
          <button onClick={()=>{setPage('pricing');setMenuOpen(false);}}>Our Services</button>
          <button onClick={()=>{setPage('faq');setMenuOpen(false);}}>FAQ</button>
        </nav>
        <div className="headerActions">
          <button className="hamburgerBtn" onClick={()=>setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? '✕' : '☰'}
          </button>
          <button className="modeBtn iconModeBtn" onClick={()=>setDarkMode(!darkMode)} title={darkMode?'Switch to light mode':'Switch to dark mode'}>
            {darkMode?'☀️':'🌙'}
          </button>
        </div>
      </header>
      {renderPage()}
      <footer>
        <p>ResuVanta provides automated CV optimization support only. It does not guarantee interviews, job offers, or hiring decisions.</p>
      </footer>
    </div>
  );
}
