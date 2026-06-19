// @ts-nocheck
'use client';

import React, { useEffect, useState } from 'react';
import PayPalWrapper from './components/PayPalWrapper';
import ContactSection from './components/ContactSection';

const PRICES = {
  optimization: '$7.99',
  builder: '$11.99',
  linkedin: '$6.99',
};

const FULL_PRICES = { optimization: 7.99, builder: 11.99, linkedin: 6.99 };
const DISCOUNT_EXPIRY = new Date('2026-07-19T23:59:59Z');

function DiscountPrice({ service }: { service: 'optimization' | 'builder' | 'linkedin' }) {
  const [offerActive, setOfferActive] = useState(false);
  useEffect(() => { setOfferActive(new Date() < DISCOUNT_EXPIRY); }, []);
  const full = FULL_PRICES[service];
  const discounted = Math.round(full * 0.7 * 100) / 100;
  if (!offerActive) return <span>${full.toFixed(2)}</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span style={{ textDecoration: 'line-through', color: '#aaa', fontSize: '0.85em' }}>${full.toFixed(2)}</span>
      <span style={{ color: '#2DB34A', fontWeight: 700 }}>${discounted.toFixed(2)}</span>
      <span style={{ background: '#e53e3e', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>30% OFF</span>
    </span>
  );
}

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
      internships: rawText.internships || rawText.INTERNSHIPS || '',
      courses: rawText.courses || rawText.COURSES || '',
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
async function openPDFWindow(cv: any, title = 'Optimized CV', builderExps?: any[], builderEdu?: any[]) {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js');
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js');
  const pdfMake = (window as any).pdfMake;

  const clean = (t: any) => !t ? '' : String(t)
    .replace(/^#+\s*/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{2BFF}]/gu, '')
    .replace(/\s{2,}/g, ' ');

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

  if (cv.experience || (builderExps && builderExps.length > 0)) {
    content.push(sec('PROFESSIONAL EXPERIENCE'));
    const normalizeExp = (text: string): string => {
      let t = text.replace(/([^\n])\s*•\s*/g, '$1\n• ');
      const lines = t.split('\n');
      const out: string[] = [];
      let prevWasBullet = false;
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) { out.push(''); prevWasBullet = false; continue; }
        const isBullet = /^[•\-*]/.test(trimmed);
        if (!isBullet && prevWasBullet && out.length > 0 && out[out.length-1] !== '') out.push('');
        out.push(line);
        prevWasBullet = isBullet;
      }
      return out.join('\n');
    };
    if (builderExps && builderExps.length > 0) {
      const parseD = (str: string) => {
        if (!str) return new Date(0);
        const s = str.toLowerCase().trim();
        if (s.includes('present') || s.includes('current')) return new Date();
        const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
        for (let i = 0; i < months.length; i++) {
          if (s.includes(months[i])) { const y = s.match(/\d{4}/); if (y) return new Date(+y[0], i, 1); }
        }
        const d = new Date(str); if (!isNaN(d.getTime())) return d;
        const y = str.match(/\d{4}/); return y ? new Date(+y[0], 0, 1) : new Date(0);
      };
      const sorted = [...builderExps].sort((a: any, b: any) => {
        const curA = !a.endDate || a.endDate.toLowerCase().includes('present') || a.endDate.toLowerCase().includes('current');
        const curB = !b.endDate || b.endDate.toLowerCase().includes('present') || b.endDate.toLowerCase().includes('current');
        if (curA && !curB) return -1;
        if (!curA && curB) return 1;
        return parseD(b.endDate || b.startDate).getTime() - parseD(a.endDate || a.startDate).getTime();
      });
      const aiBlocks = cv.experience ? normalizeExp(clean(cv.experience)).split(/\n\s*\n/) : [];
      sorted.forEach((exp: any, i: number) => {
        const jobTitle = (exp.jobTitle || '').trim();
        const company = [exp.company, exp.location].filter(Boolean).join(' | ');
        const date = [exp.startDate, exp.endDate || 'Present'].filter(Boolean).join(' – ');
        if (jobTitle) content.push({ text: jobTitle.toUpperCase(), fontSize: 11, bold: true, color: '#000', margin: [0, 4, 0, 1] });
        if (company || date) content.push({ columns: [{ text: company.toUpperCase(), fontSize: 10, bold: true }, { text: date.toUpperCase(), fontSize: 10, bold: true, alignment: 'right' }], margin: [0, 1, 0, 3] });
        const block = aiBlocks[i] || '';
        const bulletLines = block.split('\n').filter((l: string) => /^[•\-*]/.test(l.trim()));
        if (bulletLines.length > 0) {
          bulletLines.forEach((line: string) => {
            const t = line.trim().replace(/^[-*•]\s*/, '');
            if (t) content.push({ text: `• ${t}`, fontSize: 10, color: '#222', alignment: 'justify', margin: [10, 0, 0, 1] });
          });
        } else {
          const r = (exp.responsibilities || '').split('\n').map((x: string) => x.replace(/^\d+[-.)]\s*/, '').trim()).filter(Boolean);
          const a = (exp.achievements || '').split('\n').map((x: string) => x.replace(/^\d+[-.)]\s*/, '').trim()).filter(Boolean);
          [...r, ...a].forEach((t: string) => {
            if (t) content.push({ text: `• ${t}`, fontSize: 10, color: '#222', alignment: 'justify', margin: [10, 0, 0, 1] });
          });
        }
      });
    } else {
      normalizeExp(clean(cv.experience)).split(/\n\s*\n/).forEach((block: string) => {
        const lines = block.split('\n').filter((l: string) => l.trim());
        if (!lines.length) return;
        const firstClean = lines[0].trim().replace(/^[-*•]\s*/, '');
        let jobTitle = '', company = '', date = '', bulletStart = 1;
        if (firstClean.includes('|')) {
          const parts = firstClean.split('|').map((s: string) => s.trim());
          jobTitle = parts[0];
          company = parts.length >= 3 ? parts.slice(1, -1).join(' | ') : (parts[1] || '');
          date = parts.length >= 2 ? parts[parts.length - 1] : '';
          bulletStart = 1;
        } else {
          jobTitle = firstClean;
          if (lines.length > 1) {
            const secondClean = lines[1].trim().replace(/^[-*•]\s*/, '');
            if (secondClean.includes('|')) {
              const parts = secondClean.split('|').map((s: string) => s.trim());
              company = parts.slice(0, -1).join(' | ');
              date = parts[parts.length - 1] || '';
              bulletStart = 2;
            }
          }
        }
        if (jobTitle) content.push({ text: jobTitle.toUpperCase(), fontSize: 11, bold: true, color: '#000', margin: [0, 4, 0, 1] });
        if (company || date) content.push({ columns: [{ text: company.toUpperCase(), fontSize: 10, bold: true }, { text: date ? date.toUpperCase() : '', fontSize: 10, bold: true, alignment: 'right' }], margin: [0, 1, 0, 3] });
        lines.slice(bulletStart).forEach((line: string) => {
          const t = line.trim().replace(/^[-*•]\s*/, '');
          if (t) content.push({ text: `• ${t}`, fontSize: 10, color: '#222', alignment: 'justify', margin: [10, 0, 0, 1] });
        });
      });
    }
  }

  if (builderEdu && builderEdu.length > 0) {
    content.push(sec('EDUCATION'));
    builderEdu.forEach((edu: any) => {
      const degree = (edu.degree || '').trim();
      const uniLoc = [edu.university, edu.educationCountry].filter(Boolean).join(' | ');
      const year = (edu.graduationYear || '').trim();
      if (degree) content.push({ text: degree, fontSize: 11, bold: true, color: '#000', margin: [0, 4, 0, 1] });
      if (uniLoc || year) content.push({ columns: [{ text: uniLoc.toUpperCase(), fontSize: 10, bold: true }, { text: year.toUpperCase(), fontSize: 10, bold: true, alignment: 'right' }], margin: [0, 1, 0, 3] });
    });
  } else if (cv.education) {
    content.push(sec('EDUCATION'));
    const rawEdu = String(cv.education).replace(/^#+\s*/gm,'').replace(/\*\*(.*?)\*\*/g,'$1').replace(/\*(.*?)\*/g,'$1');
    const eduBlocks = rawEdu.split(/\n\s*\n/).filter((b: string) => b.trim());
    const eduEntries = eduBlocks.length > 1 ? eduBlocks : rawEdu.split('\n').filter((l: string) => l.trim());
    eduEntries.forEach((entry: string) => {
      const lines = entry.split('\n').filter((l: string) => l.trim());
      const firstLine = (lines[0] || '').trim();
      let degree = '', uniLoc = '', year = '';
      if (lines.length === 1) {
        if (firstLine.includes(' - ')) {
          const dashIdx = firstLine.indexOf(' - ');
          degree = firstLine.slice(0, dashIdx).trim();
          const rest = firstLine.slice(dashIdx + 3);
          const parts = rest.split('|').map((s: string) => s.trim());
          uniLoc = parts.slice(0, -1).join(' | ') || parts[0] || '';
          year = parts[parts.length - 1] || '';
        } else if (firstLine.includes('|')) {
          const parts = firstLine.split('|').map((s: string) => s.trim());
          degree = parts[0];
          year = parts[parts.length - 1];
          uniLoc = parts.length >= 3 ? parts.slice(1, -1).join(' | ') : (parts[1] || '');
        } else { degree = firstLine; }
      } else {
        degree = firstLine;
        const secondLine = (lines[1] || '').trim();
        if (secondLine.includes('|')) {
          const parts = secondLine.split('|').map((s: string) => s.trim());
          year = parts[parts.length - 1];
          uniLoc = parts.slice(0, -1).join(' | ');
        } else { uniLoc = secondLine; }
      }
      if (degree) content.push({ text: degree, fontSize: 11, bold: true, color: '#000', margin: [0, 4, 0, 1] });
      if (uniLoc || year) content.push({ columns: [{ text: uniLoc.toUpperCase(), fontSize: 10, bold: true }, { text: year.toUpperCase(), fontSize: 10, bold: true, alignment: 'right' }], margin: [0, 1, 0, 3] });
    });
  }

  const fmtSkillsB = (text: any) => { const lines = clean(text).split(/\n/).map((s:string)=>s.replace(/^\d+[-.)]\s*/,'').trim()).filter(Boolean); if (lines.length>1) return lines.join(' | '); return clean(text).split(/[,،•]/).map((s:string)=>s.trim()).filter(Boolean).join(' | '); };
  if (cv.softSkills || cv.technicalSkills) {
    content.push(sec('SKILLS'));
    if (cv.softSkills) content.push({ text: [{ text: 'Soft Skills: ', bold: true }, fmtSkillsB(cv.softSkills)], fontSize: 10, color: '#111827', margin: [0, 0, 0, 3] });
    if (cv.technicalSkills) content.push({ text: [{ text: 'Technical Skills: ', bold: true }, fmtSkillsB(cv.technicalSkills)], fontSize: 10, color: '#111827', margin: [0, 0, 0, 3] });
  }

  const renderTrainingBlocks = (text: string) => {
    const rawText = String(text || '').replace(/^#+\s*/gm,'').replace(/\*\*(.*?)\*\*/g,'$1').replace(/\*(.*?)\*/g,'$1');
    rawText.split(/\n\s*\n/).filter((b: string) => b.trim()).forEach((block: string) => {
      const lines = block.split('\n').filter((l: string) => l.trim());
      if (!lines.length) return;
      const titleLine = lines[0].trim().replace(/^[-*•]\s*/, '');
      if (titleLine.includes('|')) {
        const parts = titleLine.split('|').map((s: string) => s.trim());
        const name = parts.slice(0, -1).join(' | ');
        const date = parts[parts.length - 1];
        content.push({ columns: [{ text: name, fontSize: 10, bold: true, color: '#000' }, { text: date, fontSize: 10, bold: true, color: '#000', alignment: 'right' }], margin: [0, 4, 0, 1] });
      } else {
        if (titleLine) content.push({ text: titleLine, fontSize: 10, bold: true, color: '#000', margin: [0, 4, 0, 1] });
      }
      lines.slice(1).forEach((d: string) => {
        const dt = d.trim().replace(/^[-*•\-]\s*/, '');
        if (dt) content.push({ text: `• ${dt}`, fontSize: 10, color: '#222', margin: [10, 0, 0, 1] });
      });
    });
  };

  if (cv.internships) { content.push(sec('INTERNSHIPS')); renderTrainingBlocks(cv.internships); }
  if (cv.courses) { content.push(sec('COURSES')); renderTrainingBlocks(cv.courses); }
  if (!cv.internships && !cv.courses && cv.internshipCourses) {
    content.push(sec('INTERNSHIP AND COURSES'));
    content.push({ text: clean(cv.internshipCourses), fontSize: 10, color: '#111827', alignment: 'justify', margin: [0, 0, 0, 4] });
  }

  ([['ADDITIONAL INFORMATION', cv.additionalInfo], ['LANGUAGE', cv.language], ['LICENSE', cv.license]] as [string, any][])
    .forEach(([label, val]) => { if (val) { content.push(sec(label)); content.push({ text: clean(val), fontSize: 10, color: '#111827', alignment: 'justify', margin: [0, 0, 0, 4] }); } });

  pdfMake.createPdf({ pageSize: 'A4', pageMargins: [MARGIN, MARGIN, MARGIN, MARGIN], defaultStyle: { font: 'Roboto' }, content }).download(`${title.replace(/\s+/g, '_')}.pdf`);
}

// ─── Experience helpers ───────────────────────────────────────────────────────
function parseExperienceToJobs(text) {
  if (!text) return [];
  return text.split(/\n\s*\n/).map(block => {
    const lines = block.split('\n').filter(l => l.trim());
    if (!lines.length) return null;
    const title = lines[0].trim().replace(/^[-*•]\s*/, '');
    let company = '', location = '', dates = '', bulletStart = 1;
    if (lines.length > 1) {
      const second = lines[1].trim().replace(/^[-*•]\s*/, '');
      if (second.includes('|')) {
        const parts = second.split('|').map(s => s.trim());
        company = parts[0] || '';
        if (parts.length >= 3) { location = parts.slice(1, -1).join(', '); dates = parts[parts.length - 1]; }
        else { dates = parts[1] || ''; }
        bulletStart = 2;
      }
    }
    const bullets = lines.slice(bulletStart).map(l => l.trim().replace(/^[-*•]\s*/, '')).filter(Boolean).join('\n');
    return { title, company, location, dates, bullets };
  }).filter(Boolean);
}

function jobsToExperienceText(jobs) {
  return jobs.map(job => {
    const meta = [job.company, job.location, job.dates].filter(Boolean).join(' | ');
    const bullets = job.bullets.split('\n').filter(l => l.trim()).map(l => `• ${l.replace(/^[-*•]\s*/, '')}`).join('\n');
    return [job.title, meta, bullets].filter(Boolean).join('\n');
  }).join('\n\n');
}

function parseEducationToCards(text) {
  if (!text) return [];
  return text.split(/\n\s*\n/).map(block => {
    const lines = block.split('\n').filter(l => l.trim());
    if (!lines.length) return null;
    const degree = lines[0].trim().replace(/^[-*•]\s*/, '');
    let university = '', location = '', year = '';
    if (lines.length > 1) {
      const second = lines[1].trim().replace(/^[-*•]\s*/, '');
      if (second.includes('|')) {
        const parts = second.split('|').map(s => s.trim());
        university = parts[0] || '';
        if (parts.length >= 3) { location = parts.slice(1, -1).join(', '); year = parts[parts.length - 1]; }
        else { year = parts[1] || ''; }
      } else {
        university = second;
      }
    }
    return { degree, university, location, year };
  }).filter(Boolean);
}

function educationCardsToText(cards) {
  return cards.map(card => {
    const meta = [card.university, card.location, card.year].filter(Boolean).join(' | ');
    return [card.degree, meta].filter(Boolean).join('\n');
  }).join('\n\n');
}

// ─── PDF (CV Optimization only) ───────────────────────────────────────────────
async function openOptimizationPDFWindow(cv: any, jobs: any[], hidden: Record<string,boolean>, eduCards: any[], title = 'Optimized CV'): Promise<string> {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js');
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js');
  const pdfMake = (window as any).pdfMake;

  const clean = (t: any) => !t ? '' : String(t)
    .replace(/^#+\s*/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{2BFF}]/gu, '')
    .replace(/\s{2,}/g, ' ');

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

  content.push({ text: clean(cv.name).toUpperCase(), fontSize: 20, bold: true, alignment: 'center', margin: [0, 0, 0, 3] });

  const contact = [cv.address && `ADDRESS: ${clean(cv.address)}`, cv.phone && `PHONE: ${clean(cv.phone)}`, cv.email && `E-MAIL: ${clean(cv.email)}`, cv.linkedin && `LinkedIn: ${clean(cv.linkedin)}`].filter(Boolean).join(' | ');
  content.push({ text: contact, fontSize: 9, color: '#374151', alignment: 'center', margin: [0, 0, 0, 14] });

  if (!hidden.summary && cv.summary) { content.push(sec('SUMMARY')); content.push({ text: clean(cv.summary), fontSize: 10, color: '#111827', alignment: 'justify', margin: [0, 0, 0, 4] }); }

  if (jobs && jobs.length > 0) {
    content.push(sec('PROFESSIONAL EXPERIENCE'));
    jobs.forEach((job: any) => {
      const jobTitle = (job.title || '').trim();
      const companyText = [job.company, job.location].filter(Boolean).join(' | ');
      const date = (job.dates || '').trim();
      if (jobTitle) content.push({ text: jobTitle.toUpperCase(), fontSize: 11, bold: true, color: '#000', margin: [0, 4, 0, 1] });
      if (companyText || date) content.push({ columns: [{ text: companyText.toUpperCase(), fontSize: 10, bold: true }, { text: date ? date.toUpperCase() : '', fontSize: 10, bold: true, alignment: 'right' }], margin: [0, 1, 0, 3] });
      (job.bullets || '').split('\n').filter((l: string) => l.trim()).forEach((line: string) => {
        const t = line.trim().replace(/^[-*•]\s*/, '');
        if (t) content.push({ text: `• ${t}`, fontSize: 10, color: '#222', alignment: 'justify', margin: [10, 0, 0, 1] });
      });
    });
  }

  if (!hidden.education && eduCards && eduCards.length > 0) {
    content.push(sec('EDUCATION'));
    eduCards.forEach((edu: any) => {
      if (edu.degree) content.push({ text: edu.degree, fontSize: 11, bold: true, color: '#000', margin: [0, 4, 0, 1] });
      const uniLocation = [edu.university, edu.location].filter(Boolean).join(' | ');
      if (uniLocation || edu.year) {
        content.push({ columns: [{ text: uniLocation, fontSize: 10 }, { text: edu.year || '', fontSize: 10, alignment: 'right' }], margin: [0, 1, 0, 3] });
      }
    });
  }

  const fmtSkills = (text: string) => clean(text).split(/[,،•]/).map((s:string) => s.trim()).filter(Boolean).join(' | ');

  const showSoft = !hidden.softSkills && cv.softSkills;
  const showTech = !hidden.technicalSkills && cv.technicalSkills;
  if (showSoft || showTech) {
    content.push(sec('SKILLS'));
    if (showSoft) content.push({ text: [{ text: 'Soft Skills: ', bold: true }, fmtSkills(cv.softSkills)], fontSize: 10, color: '#111827', alignment: 'justify', margin: [0, 0, 0, 3] });
    if (showTech) content.push({ text: [{ text: 'Technical Skills: ', bold: true }, fmtSkills(cv.technicalSkills)], fontSize: 10, color: '#111827', alignment: 'justify', margin: [0, 0, 0, 3] });
  }

  const renderTrainingBlocks = (text: string) => {
    const isDateOnly = (s: string) => /^(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\.?$/.test(s.trim());
    let entries: string[];
    if (/\n\s*\n/.test(text)) {
      entries = text.split(/\n\s*\n/).filter((b: string) => b.trim());
    } else if (/\n/.test(text)) {
      const allLines = text.split('\n').filter((l: string) => l.trim());
      entries = [];
      let cur: string[] = [];
      allLines.forEach((line: string) => {
        const isBullet = /^[-*•]/.test(line.trim());
        if (!isBullet && line.includes('|') && cur.length > 0) {
          entries.push(cur.join('\n'));
          cur = [line.trim()];
        } else { cur.push(line.trim()); }
      });
      if (cur.length) entries.push(cur.join('\n'));
    } else {
      const rawEntries: string[] = [];
      let cur = '';
      text.split(', ').forEach((piece: string) => {
        if (cur && piece.includes(' | ')) {
          const afterBar = (piece.split(' | ').pop() || '').split(',')[0].trim();
          if (isDateOnly(afterBar)) { rawEntries.push(cur); cur = piece; return; }
        }
        cur = cur ? cur + ', ' + piece : piece;
      });
      if (cur) rawEntries.push(cur);
      entries = rawEntries.length > 0 ? rawEntries : [text];
    }
    entries.forEach((entry: string) => {
      const lines = entry.split('\n').filter((l: string) => l.trim());
      if (!lines.length) return;
      const titleParts = lines[0].trim().replace(/^[-*•]\s*/, '').split('|').map((s: string) => s.trim());
      const blockTitle = titleParts[0];
      let rawDate = titleParts.length > 1 ? titleParts[titleParts.length - 1] : '';
      let inlineDesc = '';
      const dashIdx = rawDate.indexOf(' - ');
      if (dashIdx !== -1 && rawDate.slice(dashIdx + 3).trim().length > 10) {
        inlineDesc = rawDate.slice(dashIdx + 3).trim();
        rawDate = rawDate.slice(0, dashIdx).trim();
      }
      if (blockTitle) {
        if (rawDate) {
          content.push({ columns: [{ text: blockTitle, fontSize: 10, bold: true }, { text: rawDate, fontSize: 10, alignment: 'right' }], margin: [0, 3, 0, 1] });
        } else {
          content.push({ text: blockTitle, fontSize: 10, bold: true, color: '#000', margin: [0, 3, 0, 1] });
        }
      }
      if (inlineDesc) {
        inlineDesc.split(/,\s+/).forEach((item: string) => {
          const t = item.trim();
          if (t) content.push({ text: `• ${t}`, fontSize: 10, color: '#222', alignment: 'justify', margin: [10, 0, 0, 1] });
        });
      }
      lines.slice(1).forEach((d: string) => {
        const dt = d.trim().replace(/^[-*•\-]\s*/, '');
        if (dt) content.push({ text: `• ${dt}`, fontSize: 10, color: '#222', alignment: 'justify', margin: [10, 0, 0, 1] });
      });
    });
  };

  if (!hidden.internshipCourses) {
    if (cv.internships) { content.push(sec('INTERNSHIPS')); renderTrainingBlocks(cv.internships); }
    if (cv.courses) { content.push(sec('COURSES')); renderTrainingBlocks(cv.courses); }
    if (!cv.internships && !cv.courses && cv.internshipCourses) {
      content.push(sec('INTERNSHIP AND COURSES'));
      renderTrainingBlocks(cv.internshipCourses);
    }
  }

  if (!hidden.additionalInfo && cv.additionalInfo) { content.push(sec('ADDITIONAL INFORMATION')); content.push({ text: clean(cv.additionalInfo), fontSize: 10, color: '#111827', alignment: 'justify', margin: [0, 0, 0, 4] }); }
  if (!hidden.language && cv.language) { content.push(sec('LANGUAGE')); content.push({ text: clean(cv.language), fontSize: 10, color: '#111827', alignment: 'justify', margin: [0, 0, 0, 4] }); }
  if (!hidden.license && cv.license) { content.push(sec('LICENSE')); content.push({ text: clean(cv.license), fontSize: 10, color: '#111827', alignment: 'justify', margin: [0, 0, 0, 4] }); }

  const docDef = { pageSize: 'A4', pageMargins: [MARGIN, MARGIN, MARGIN, MARGIN], defaultStyle: { font: 'Roboto' }, content };
  const pdfDoc = pdfMake.createPdf(docDef);
  pdfDoc.download(`${title.replace(/\s+/g, '_')}.pdf`);
  return new Promise<string>((resolve) => {
    pdfDoc.getBase64((data: string) => resolve(data));
  });
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
        <span style={{ fontSize:14, color:'#666666' }}>{label}</span>
        <span style={{ fontSize:15, fontWeight:700, color:'#1C1A16' }}>{displayed}%</span>
      </div>
      <div style={{ height:12, background:'#E5E0D6', borderRadius:6, overflow:'hidden' }}>
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
        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, background:'#F0EDE6', border:'1px solid #E5E0D6', borderRadius:999, padding:'6px 14px', fontSize:13, color:'#666666' }}>
          <span style={{ background:'#1C1A16', color:'#F8F6F1', borderRadius:'50%', width:20, height:20, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{i+1}</span>
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
      <CVSection title="INTERNSHIP AND COURSES" content={(cv.internships || cv.courses) ? [cv.internships, cv.courses].filter(Boolean).join('\n\n') : cv.internshipCourses} />
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
function BrandLogo({ darkMode, footer = false }) {
  return (
    <div className={footer ? 'logoBlock footerLogoBlock' : 'logoBlock'}>
      <svg width="200" height="52" viewBox="0 0 200 52" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="3" width="30" height="38" rx="5" fill="#2DB34A" opacity="0.12"/>
        <rect x="2" y="3" width="30" height="38" rx="5" fill="none" stroke="#2DB34A" strokeWidth="1.5"/>
        <line x1="9" y1="15" x2="25" y2="15" stroke="#2DB34A" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="9" y1="21" x2="25" y2="21" stroke="#2DB34A" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="9" y1="27" x2="18" y2="27" stroke="#2DB34A" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="28" cy="36" r="8" fill="#2DB34A"/>
        <polyline points="23.5,36 27,39.5 33,31" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <text x="44" y="24" fontFamily="-apple-system,sans-serif" fontSize="19" fontWeight="700" letterSpacing="-0.04em" fill="#1C1A16">Resu</text>
        <text x="85" y="24" fontFamily="-apple-system,sans-serif" fontSize="19" fontWeight="700" letterSpacing="-0.04em" fill="#2DB34A">Vanta</text>
        <text x="44" y="40" fontFamily="-apple-system,sans-serif" fontSize="10" fontWeight="400" fill="#bbb" letterSpacing="0.03em">Apply with confidence.</text>
      </svg>
    </div>
  );
}

// ─── Home Animated Headline ───────────────────────────────────────────────────
function AnimatedHeadline() {
  const words = ['A', 'stronger', 'CV.', 'A', 'faster', 'job', 'search.'];
  const greenIndex = 4;
  const breakAfter = [2, 4];
  const [visible, setVisible] = useState([]);
  useEffect(() => {
    words.forEach((_, i) => {
      setTimeout(() => setVisible(v => [...v, i]), 300 + i * 110);
    });
  }, []);
  let wordIdx = 0;
  const lines = [[0,1,2],[3,4],[5,6]];
  return (
    <h1 className="rv-headline">
      {lines.map((line, li) => (
        <span key={li} className="rv-headline-line">
          {line.map((wi) => (
            <span
              key={wi}
              className={`rv-word${wi === greenIndex ? ' rv-word-green' : ''}${visible.includes(wi) ? ' rv-word-visible' : ''}`}
            >
              {words[wi]}
            </span>
          ))}
          {li < lines.length - 1 && <br/>}
        </span>
      ))}
    </h1>
  );
}

// ─── Home Bar Chart ───────────────────────────────────────────────────────────
function HomeBarChart() {
  const bars = [
    { label: 'Keywords',       target: 78, color: '#2DB34A' },
    { label: 'Formatting',     target: 65, color: '#5BC97A' },
    { label: 'Impact language',target: 71, color: '#2DB34A' },
    { label: 'ATS compatibility',target:84, color: '#5BC97A' },
    { label: 'Overall score',  target: 76, color: '#1a8c35' },
  ];
  const [vals, setVals] = useState(bars.map(() => 0));
  useEffect(() => {
    let start = null;
    const dur = 1800;
    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
    function frame(ts) {
      if (!start) start = ts;
      const prog = Math.min((ts - start) / dur, 1);
      setVals(bars.map((b, i) => {
        const delay = i * 0.1;
        const lp = Math.max(0, Math.min(1, (prog - delay) / (1 - delay)));
        return Math.round(b.target * easeOut(lp));
      }));
      if (prog < 1) requestAnimationFrame(frame);
    }
    const t = setTimeout(() => requestAnimationFrame(frame), 600);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="rv-chart-box">
      <div className="rv-chart-header">
        <div>
          <div className="rv-chart-title">CV improvement breakdown</div>
          <div className="rv-chart-sub">Average results after optimization</div>
        </div>
        <div className="rv-chart-badge">After ResuVanta</div>
      </div>
      <div className="rv-before-after">
        <span className="rv-ba rv-ba-before">Before</span>
        <span className="rv-ba rv-ba-after">After</span>
      </div>
      {bars.map((b, i) => (
        <div key={i} className="rv-bar-row">
          <div className="rv-bar-label">{b.label}</div>
          <div className="rv-bar-track">
            <div className="rv-bar-fill" style={{ width: `${vals[i]}%`, background: b.color }} />
          </div>
          <div className="rv-bar-val">{vals[i]}%</div>
        </div>
      ))}
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────
function Home({ setPage }) {
  return (
    <>
      {/* ── Hero ── */}
      <section className="rv-hero">
        <div className="rv-hero-left">
          <div className="rv-eyebrow">
            <span className="rv-eyebrow-dot" />
            <span className="rv-eyebrow-text">Career development platform</span>
          </div>
          <AnimatedHeadline />
          <p className="rv-subline">
            ResuVanta reviews every section of your CV and shows you exactly where you stand — and how far you can go.
          </p>
          <div className="rv-cta-row">
            <button className="rv-btn-primary" onClick={() => setPage('optimization')}>Analyze my CV — free</button>
            <button className="rv-btn-secondary" onClick={() => setPage('pricing')}>See our services</button>
          </div>
          <div className="rv-trust-row">
            <div className="rv-trust-item"><span className="rv-trust-dot" />No sign-up to start</div>
            <div className="rv-trust-item"><span className="rv-trust-dot" />Results in under 60 seconds</div>
          </div>
        </div>
        <div className="rv-hero-right">
          <HomeBarChart />
        </div>
      </section>

      {/* ── Service Cards ── */}
      <section className="rv-cards-section">
        <div className="rv-cards-label">What we offer</div>
        <div className="rv-cards-grid">
          <div className="rv-card rv-card-featured">
            <div className="rv-card-top rv-card-top-green" />
            <div className="rv-card-num">01</div>
            <div className="rv-card-title">CV Optimization</div>
            <div className="rv-card-price"><DiscountPrice service="optimization"/></div>
            <div className="rv-card-desc">Upload your CV and get a full breakdown — what works, what's missing, and exactly how to fix it.</div>
            <button className="rv-card-btn" onClick={() => setPage('optimization')}>Unlock access →</button>
          </div>
          <div className="rv-card">
            <div className="rv-card-top" />
            <div className="rv-card-num">02</div>
            <div className="rv-card-title">CV Builder</div>
            <div className="rv-card-price"><DiscountPrice service="builder"/></div>
            <div className="rv-card-desc">Start from zero and finish with a clean, recruiter-ready document in minutes.</div>
            <button className="rv-card-btn" onClick={() => setPage('builder')}>Unlock access →</button>
          </div>
          <div className="rv-card">
            <div className="rv-card-top" />
            <div className="rv-card-num">03</div>
            <div className="rv-card-title">LinkedIn</div>
            <div className="rv-card-price"><DiscountPrice service="linkedin"/></div>
            <div className="rv-card-desc">Fine-tune your headline, summary, and keywords so the right people find you first.</div>
            <button className="rv-card-btn" onClick={() => setPage('linkedin')}>Unlock access →</button>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="home-section how-it-works">
        <h2>How it works</h2>
        <div className="steps-grid">
          <div><span>1</span><h3>Upload or Enter Details</h3><p>Upload your CV or answer simple builder questions.</p></div>
          <div><span>2</span><h3>Get a Free Preview</h3><p>See your match score, missing keyword count, and one improvement tip.</p></div>
          <div><span>3</span><h3>Unlock Full Result</h3><p>Pay only when you want the full optimized CV or builder output.</p></div>
          <div><span>4</span><h3>Download PDF</h3><p>Your final output is delivered as a clean PDF-ready CV.</p></div>
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
  const [paidCVJobs, setPaidCVJobs] = useState([]);
  const [paidCVEducation, setPaidCVEducation] = useState([]);
  const [profSentences, setProfSentences] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedAchievements, setSuggestedAchievements] = useState([]);
  const [selectedAchievements, setSelectedAchievements] = useState([]);
  const [hiddenFields, setHiddenFields] = useState<Record<string,boolean>>({});
  const toggleHide = (field: string) => setHiddenFields(prev => ({...prev, [field]: !prev[field]}));
  const hBtn = (field: string): React.CSSProperties => ({ fontSize:10, padding:'2px 9px', borderRadius:4, border:`1px solid ${hiddenFields[field]?'#cbd5e1':'#94a3b8'}`, background:hiddenFields[field]?'#f1f5f9':'transparent', color:hiddenFields[field]?'#94a3b8':'#64748b', cursor:'pointer' });
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [remainingOutputs, setRemainingOutputs] = useState(3);
  const [showPdfWarning, setShowPdfWarning] = useState(false);
  const [pdfWarningAcknowledged, setPdfWarningAcknowledged] = useState(false);
  const [pendingPdfDownload, setPendingPdfDownload] = useState<(() => Promise<void>) | null>(null);

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
      setResult(analysis); setPaidCV(cv); setPaidCVJobs(parseExperienceToJobs(cv.experience || '')); setPaidCVEducation(parseEducationToCards(cv.education || '')); setProfSentences([]); setError('');
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
      <h2>CV Optimization — <DiscountPrice service="optimization"/></h2>
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
              <p style={{ fontWeight: 700, marginBottom: '6px', fontSize: '18px', color: '#1C1A16' }}>CV Evaluation Report</p>
              <p style={{ color: '#666666', fontSize: '13px', lineHeight: '1.5' }}>
                This is a strict, real-time ATS analysis of your resume. Scores below 65% indicate a weak match that requires significant optimization.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', background: '#F8F6F1', padding: '28px 24px', borderRadius: '16px', border: '1px solid #E5E0D6', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ flex: '0 0 140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF', borderRadius: '50%', width: '140px', height: '140px', border: `4px solid ${getScoreColor(result.score)}`, boxShadow: `0 0 20px ${getScoreColor(result.score)}30`, margin: '0 auto' }}>
              <div style={{ fontSize: '42px', fontWeight: '800', color: '#1C1A16', lineHeight: '1' }}>{result.score}</div>
              <div style={{ fontSize: '12px', color: '#666666', marginTop: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Match Score</div>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: '#1C1A16', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <span>{item.label}</span>
                      <span style={{ color: color }}>{item.score}%</span>
                    </div>
                    <div style={{ height: '6px', background: '#E5E0D6', borderRadius: '4px', overflow: 'hidden' }}>
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
                We found <b style={{color:'#1C1A16'}}>{result.missingCount}</b> missing important keywords.
              </span>
            </p>
            {!paymentConfirmed && (
              <div className="tags">
                {result.previewMissing.map(k=>(
                  <span key={k} style={{filter:'blur(5px)',userSelect:'none',pointerEvents:'none'}}>{k}</span>
                ))}
                {result.missingCount > 3 && (
                  <span style={{background:'#F0EDE6',border:'1px solid #E5E0D6',borderRadius:999,padding:'6px 12px',fontSize:13,color:'#666666'}}>
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
            <p style={{color:'#666666',fontSize:13}}>{result.quickImprovement}</p>
          </div>

          {/* ── LOCKED CARD ── */}
          <div className="locked-card">
            <h3>Unlock Full CV Optimization — <DiscountPrice service="optimization"/></h3>
            <p>Get the complete ATS keyword report, rewritten summary with professional sentences, improved experience section, skills optimization, and a downloadable PDF CV.</p>
            {paymentConfirmed ? (
              <div>
                <p className="success">Payment confirmed. Remaining outputs: {remainingOutputs}</p>
                <button onClick={generatePaidOptimizationCV} disabled={loading}>
                  {loading ? '⏳ writing your CV...' : 'Generate Full Optimized CV'}
                </button>
              </div>
            ) : (
              <PayPalWrapper
                service="optimization"
                label={`Optimize My CV — ${PRICES.optimization}`}
                onBeforePayment={() => {
                  if (!resume.trim() || !jobDescription.trim()) {
                    throw new Error('Please upload your CV and paste the job description first.');
                  }
                  sessionStorage.setItem('resuvanta_pending_optimization', JSON.stringify({ resume, jobDescription }));
                }}
                onSuccess={() => {
                  const saved = sessionStorage.getItem('resuvanta_pending_optimization');
                  if (saved) {
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
                    } catch { setError('Payment confirmed, but we could not restore your saved data.'); }
                  } else { setPaymentConfirmed(true); setMessage('Payment confirmed!'); }
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
            <div style={{background:'#EBF5EE',border:'1px solid #c3e6cb',borderRadius:12,padding:14,marginBottom:20}}>
              <p style={{fontWeight:700,color:'#166534',marginBottom:8}}>✓ Professional sentences added automatically:</p>
              {profSentences.map((s,i)=><p key={i} style={{color:'#166534',fontSize:13,marginBottom:4}}>• {s}</p>)}
            </div>
          )}
          <div style={{marginBottom:20}}>
            <p style={{fontWeight:700,fontSize:15,marginBottom:12,color:'#1C1A16',borderBottom:'1px solid #E5E0D6',paddingBottom:8}}>Personal Information</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div><label style={{display:'block',fontSize:12,color:'#64748b',marginBottom:4,fontWeight:700}}>Full Name</label><input value={paidCV.name} onChange={e=>updatePaidCVField('name',e.target.value)} placeholder="e.g. John Smith"/></div>
              <div><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><label style={{fontSize:12,color:'#64748b',fontWeight:700}}>Phone Number</label><button onClick={()=>toggleHide('phone')} style={hBtn('phone')}>{hiddenFields.phone?'Show':'Hide'}</button></div><input value={paidCV.phone} onChange={e=>updatePaidCVField('phone',e.target.value)} placeholder="e.g. +971 50 123 4567" style={{opacity:hiddenFields.phone?0.4:1}}/></div>
              <div><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><label style={{fontSize:12,color:'#64748b',fontWeight:700}}>Email Address</label><button onClick={()=>toggleHide('email')} style={hBtn('email')}>{hiddenFields.email?'Show':'Hide'}</button></div><input value={paidCV.email} onChange={e=>updatePaidCVField('email',e.target.value)} placeholder="e.g. name@email.com" style={{opacity:hiddenFields.email?0.4:1}}/></div>
              <div><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><label style={{fontSize:12,color:'#64748b',fontWeight:700}}>LinkedIn URL</label><button onClick={()=>toggleHide('linkedin')} style={hBtn('linkedin')}>{hiddenFields.linkedin?'Show':'Hide'}</button></div><input value={paidCV.linkedin} onChange={e=>updatePaidCVField('linkedin',e.target.value)} placeholder="e.g. linkedin.com/in/yourname" style={{opacity:hiddenFields.linkedin?0.4:1}}/></div>
              <div style={{gridColumn:'span 2'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><label style={{fontSize:12,color:'#64748b',fontWeight:700}}>Address</label><button onClick={()=>toggleHide('address')} style={hBtn('address')}>{hiddenFields.address?'Show':'Hide'}</button></div><input value={paidCV.address||''} onChange={e=>updatePaidCVField('address',e.target.value)} placeholder="e.g. Sharjah, UAE" style={{opacity:hiddenFields.address?0.4:1}}/></div>
            </div>
          </div>
          <div style={{marginBottom:20}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid #E5E0D6',paddingBottom:8,marginBottom:6}}><p style={{fontWeight:700,fontSize:15,color:'#1C1A16',margin:0}}>Professional Summary</p><button onClick={()=>toggleHide('summary')} style={hBtn('summary')}>{hiddenFields.summary?'Show':'Hide'}</button></div>
            <p style={{fontSize:12,color:'#64748b',marginBottom:8}}>Write 3–5 sentences about your background, skills, and career goal.</p>
            <textarea style={{minHeight:120,opacity:hiddenFields.summary?0.4:1}} value={paidCV.summary} onChange={e=>updatePaidCVField('summary',e.target.value)} placeholder="e.g. Results-focused pharmacist with 5+ years of experience..."/>
          </div>
          <div style={{marginBottom:20}}>
            <p style={{fontWeight:700,fontSize:15,marginBottom:6,color:'#1C1A16',borderBottom:'1px solid #E5E0D6',paddingBottom:8}}>Professional Experience</p>
            <p style={{fontSize:12,color:'#64748b',marginBottom:12}}>Each job is a separate card — edit any field and the PDF will update automatically.</p>
            {paidCVJobs.map((job, idx) => (
              <div key={idx} style={{border:'1px solid #E5E0D6',borderRadius:12,padding:16,marginBottom:12,background:'#FAFAF8'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <span style={{fontWeight:700,fontSize:13,color:'#1C1A16'}}>Job {idx+1}</span>
                  <button className="secondary" style={{fontSize:12,padding:'3px 10px',color:'#dc2626',border:'1px solid #dc2626'}} onClick={()=>{
                    const updated=paidCVJobs.filter((_,i)=>i!==idx);
                    setPaidCVJobs(updated);
                    updatePaidCVField('experience',jobsToExperienceText(updated));
                  }}>Remove</button>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                  <div>
                    <label style={{display:'block',fontSize:11,color:'#64748b',marginBottom:3,fontWeight:700}}>Job Title</label>
                    <input value={job.title} onChange={e=>{const u=[...paidCVJobs];u[idx]={...u[idx],title:e.target.value};setPaidCVJobs(u);updatePaidCVField('experience',jobsToExperienceText(u));}} placeholder="e.g. Senior Pharmacist"/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:11,color:'#64748b',marginBottom:3,fontWeight:700}}>Company</label>
                    <input value={job.company} onChange={e=>{const u=[...paidCVJobs];u[idx]={...u[idx],company:e.target.value};setPaidCVJobs(u);updatePaidCVField('experience',jobsToExperienceText(u));}} placeholder="e.g. MedCare Hospital"/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:11,color:'#64748b',marginBottom:3,fontWeight:700}}>Location</label>
                    <input value={job.location} onChange={e=>{const u=[...paidCVJobs];u[idx]={...u[idx],location:e.target.value};setPaidCVJobs(u);updatePaidCVField('experience',jobsToExperienceText(u));}} placeholder="e.g. Dubai, UAE"/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:11,color:'#64748b',marginBottom:3,fontWeight:700}}>Dates</label>
                    <input value={job.dates} onChange={e=>{const u=[...paidCVJobs];u[idx]={...u[idx],dates:e.target.value};setPaidCVJobs(u);updatePaidCVField('experience',jobsToExperienceText(u));}} placeholder="e.g. Jan 2021 – Present"/>
                  </div>
                </div>
                <div>
                  <label style={{display:'block',fontSize:11,color:'#64748b',marginBottom:3,fontWeight:700}}>Responsibilities (one line per point)</label>
                  <textarea style={{minHeight:100}} value={job.bullets} onChange={e=>{const u=[...paidCVJobs];u[idx]={...u[idx],bullets:e.target.value};setPaidCVJobs(u);updatePaidCVField('experience',jobsToExperienceText(u));}} placeholder={'Managed daily dispensing for 200+ patients\nStreamlined insurance approvals...'}/>
                </div>
              </div>
            ))}
            <button className="secondary" style={{fontSize:13,marginTop:4}} onClick={()=>{
              const u=[...paidCVJobs,{title:'',company:'',location:'',dates:'',bullets:''}];
              setPaidCVJobs(u);
              updatePaidCVField('experience',jobsToExperienceText(u));
            }}>+ Add Job</button>
          </div>
          <div style={{marginBottom:20}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid #E5E0D6',paddingBottom:8,marginBottom:6}}><p style={{fontWeight:700,fontSize:15,color:'#1C1A16',margin:0}}>Education</p><button onClick={()=>toggleHide('education')} style={hBtn('education')}>{hiddenFields.education?'Show':'Hide'}</button></div>
            <p style={{fontSize:12,color:'#64748b',marginBottom:12}}>Each degree is a separate card.</p>
            <div style={{opacity:hiddenFields.education?0.4:1}}>
              {paidCVEducation.map((edu, idx) => (
                <div key={idx} style={{border:'1px solid #E5E0D6',borderRadius:12,padding:16,marginBottom:12,background:'#FAFAF8'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                    <span style={{fontWeight:700,fontSize:13,color:'#1C1A16'}}>Degree {idx+1}</span>
                    {paidCVEducation.length > 1 && <button className="secondary" style={{fontSize:12,padding:'3px 10px',color:'#dc2626',border:'1px solid #dc2626'}} onClick={()=>{const u=paidCVEducation.filter((_,i)=>i!==idx);setPaidCVEducation(u);updatePaidCVField('education',educationCardsToText(u));}}>Remove</button>}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                    <div>
                      <label style={{display:'block',fontSize:11,color:'#64748b',marginBottom:3,fontWeight:700}}>Degree Name</label>
                      <input value={edu.degree} onChange={e=>{const u=[...paidCVEducation];u[idx]={...u[idx],degree:e.target.value};setPaidCVEducation(u);updatePaidCVField('education',educationCardsToText(u));}} placeholder="e.g. Bachelor of Pharmacy"/>
                    </div>
                    <div>
                      <label style={{display:'block',fontSize:11,color:'#64748b',marginBottom:3,fontWeight:700}}>University</label>
                      <input value={edu.university} onChange={e=>{const u=[...paidCVEducation];u[idx]={...u[idx],university:e.target.value};setPaidCVEducation(u);updatePaidCVField('education',educationCardsToText(u));}} placeholder="e.g. Cairo University"/>
                    </div>
                    <div>
                      <label style={{display:'block',fontSize:11,color:'#64748b',marginBottom:3,fontWeight:700}}>Location</label>
                      <input value={edu.location} onChange={e=>{const u=[...paidCVEducation];u[idx]={...u[idx],location:e.target.value};setPaidCVEducation(u);updatePaidCVField('education',educationCardsToText(u));}} placeholder="e.g. Cairo, Egypt"/>
                    </div>
                    <div>
                      <label style={{display:'block',fontSize:11,color:'#64748b',marginBottom:3,fontWeight:700}}>Year</label>
                      <input value={edu.year} onChange={e=>{const u=[...paidCVEducation];u[idx]={...u[idx],year:e.target.value};setPaidCVEducation(u);updatePaidCVField('education',educationCardsToText(u));}} placeholder="e.g. July 2020"/>
                    </div>
                  </div>
                </div>
              ))}
              <button className="secondary" style={{fontSize:13,marginTop:4}} onClick={()=>{const u=[...paidCVEducation,{degree:'',university:'',location:'',year:''}];setPaidCVEducation(u);updatePaidCVField('education',educationCardsToText(u));}}>+ Add Degree</button>
            </div>
          </div>
          <div style={{marginBottom:20}}>
            <p style={{fontWeight:700,fontSize:15,marginBottom:12,color:'#1C1A16',borderBottom:'1px solid #E5E0D6',paddingBottom:8}}>Skills</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><label style={{fontSize:12,color:'#64748b',fontWeight:700}}>Soft Skills</label><button onClick={()=>toggleHide('softSkills')} style={hBtn('softSkills')}>{hiddenFields.softSkills?'Show':'Hide'}</button></div>
                <textarea style={{minHeight:80,opacity:hiddenFields.softSkills?0.4:1}} value={paidCV.softSkills} onChange={e=>updatePaidCVField('softSkills',e.target.value)} placeholder="e.g. Communication, teamwork..."/>
              </div>
              <div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><label style={{fontSize:12,color:'#64748b',fontWeight:700}}>Technical Skills</label><button onClick={()=>toggleHide('technicalSkills')} style={hBtn('technicalSkills')}>{hiddenFields.technicalSkills?'Show':'Hide'}</button></div>
                <textarea style={{minHeight:80,opacity:hiddenFields.technicalSkills?0.4:1}} value={paidCV.technicalSkills} onChange={e=>updatePaidCVField('technicalSkills',e.target.value)} placeholder="e.g. Clinical pharmacy, dispensing..."/>
              </div>
            </div>
          </div>
          <div style={{marginBottom:20}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid #E5E0D6',paddingBottom:8,marginBottom:6}}><p style={{fontWeight:700,fontSize:15,color:'#1C1A16',margin:0}}>Internship and Courses</p><button onClick={()=>toggleHide('internshipCourses')} style={hBtn('internshipCourses')}>{hiddenFields.internshipCourses?'Show':'Hide'}</button></div>
            <textarea style={{minHeight:100,opacity:hiddenFields.internshipCourses?0.4:1}} value={paidCV.internshipCourses} onChange={e=>updatePaidCVField('internshipCourses',e.target.value)} placeholder={'e.g.\nPharmacy Internship — Cairo Hospital (2017)'}/>
          </div>
          <div style={{marginBottom:20}}>
            <p style={{fontWeight:700,fontSize:15,marginBottom:12,color:'#1C1A16',borderBottom:'1px solid #E5E0D6',paddingBottom:8}}>Additional Details</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><label style={{fontSize:12,color:'#64748b',fontWeight:700}}>Languages</label><button onClick={()=>toggleHide('language')} style={hBtn('language')}>{hiddenFields.language?'Show':'Hide'}</button></div><input value={paidCV.language} onChange={e=>updatePaidCVField('language',e.target.value)} placeholder="e.g. Arabic (native), English (fluent)" style={{opacity:hiddenFields.language?0.4:1}}/></div>
              <div><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><label style={{fontSize:12,color:'#64748b',fontWeight:700}}>Licenses & Certifications</label><button onClick={()=>toggleHide('license')} style={hBtn('license')}>{hiddenFields.license?'Show':'Hide'}</button></div><input value={paidCV.license} onChange={e=>updatePaidCVField('license',e.target.value)} placeholder="e.g. UAE Pharmacist License, DHA" style={{opacity:hiddenFields.license?0.4:1}}/></div>
            </div>
          </div>
          <div style={{marginBottom:24}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid #E5E0D6',paddingBottom:8,marginBottom:6}}><p style={{fontWeight:700,fontSize:15,color:'#1C1A16',margin:0}}>Additional Information</p><button onClick={()=>toggleHide('additionalInfo')} style={hBtn('additionalInfo')}>{hiddenFields.additionalInfo?'Show':'Hide'}</button></div>
            <textarea style={{minHeight:80,opacity:hiddenFields.additionalInfo?0.4:1}} value={paidCV.additionalInfo} onChange={e=>updatePaidCVField('additionalInfo',e.target.value)} placeholder="e.g. UAE driving license holder."/>
          </div>
          {paidCV?.scoreJustification && (
            <div style={{marginBottom:18,padding:14,background:'#FEF9EC',border:'1px solid #FDE68A',borderRadius:12}}>
              <p style={{fontWeight:700,fontSize:14,color:'#92400E',marginBottom:4}}>Score Justification</p>
              <p style={{color:'#666666',fontSize:13}}>{paidCV.scoreJustification}</p>
            </div>
          )}

          {suggestedAchievements.length > 0 && (
            <div style={{marginBottom:24,padding:16,background:'#F0EDE6',border:'1px solid #E5E0D6',borderRadius:12}}>
              <p style={{fontWeight:700,fontSize:15,color:'#1C1A16',marginBottom:4}}>⭐ Suggested Achievements</p>
              <p style={{fontSize:12,color:'#666666',marginBottom:14}}>
                Select achievements that apply to you, fill in your numbers, then click Add to CV.
              </p>
              {suggestedAchievements.map((achievement, i) => {
                const isSelected = selectedAchievements.some(a => a.index === i);
                const selected = selectedAchievements.find(a => a.index === i);
                return (
                  <div key={i} style={{marginBottom:10,padding:12,background:isSelected?'#EBF5EE':'#FFFFFF',border:isSelected?'1px solid #2DB34A':'1px solid #E5E0D6',borderRadius:8}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                      <input type="checkbox" checked={isSelected} style={{marginTop:3,cursor:'pointer',width:16,height:16,flexShrink:0}}
                        onChange={e => {
                          if (e.target.checked) setSelectedAchievements(prev => [...prev, { index: i, text: achievement, customText: achievement }]);
                          else setSelectedAchievements(prev => prev.filter(a => a.index !== i));
                        }}
                      />
                      <div style={{flex:1}}>
                        <p style={{fontSize:13,color:'#1C1A16',marginBottom:isSelected?6:0}}>{achievement}</p>
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
                <div style={{marginTop:14,padding:14,background:'#F0EDE6',borderRadius:10,border:'1px solid #E5E0D6'}}>
                  <label style={{fontSize:13,color:'#666666',display:'block',marginBottom:8,fontWeight:700}}>
                    Add achievements to this job:
                  </label>
                  <select
                    id="jobTargetSelect"
                    style={{width:'100%',padding:'10px',borderRadius:'8px',background:'#FFFFFF',color:'#1C1A16',border:'1px solid #E5E0D6',marginBottom:14,fontSize:13,outline:'none'}}
                  >
                    {(paidCV.experience || '').split(/\n\s*\n/).filter(b => b.trim()).map((block, idx) => {
                      const title = block.split('\n').find(l => l.trim())?.substring(0, 60) || `Job ${idx + 1}`;
                      return <option key={idx} value={idx}>{title} {idx === 0 ? '(Latest)' : ''}</option>;
                    })}
                  </select>
                  <button style={{width:'100%',background:'#1C1A16',color:'#F8F6F1',border:'none',borderRadius:8,padding:'12px 20px',fontWeight:700,cursor:'pointer',fontSize:14,transition:'0.2s'}}
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

          {showPdfWarning && (
            <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div style={{background:'#fff',borderRadius:12,padding:'28px 32px',maxWidth:420,width:'90%',border:'1px solid #E5E0D6',boxShadow:'0 8px 32px rgba(0,0,0,0.12)'}}>
                <h3 style={{margin:'0 0 12px',color:'#1C1A16',fontSize:16,fontWeight:700}}>Before downloading your CV</h3>
                <p style={{color:'#666',fontSize:13,lineHeight:1.6,margin:'0 0 20px'}}>We recommend reviewing all sections carefully before downloading. Errors in personal details, dates, or content are your responsibility to correct.</p>
                <div style={{display:'flex',gap:10}}>
                  <button style={{flex:1}} onClick={()=>{setShowPdfWarning(false);setPdfWarningAcknowledged(true);}}>OK</button>
                  <button onClick={async()=>{
                    setShowPdfWarning(false); setPdfWarningAcknowledged(true);
                    if (pendingPdfDownload) await pendingPdfDownload();
                  }}>Download Anyway</button>
                </div>
              </div>
            </div>
          )}

          <button onClick={async ()=>{
            const doDownload = async () => {
              const base64 = await openOptimizationPDFWindow(paidCV, paidCVJobs, hiddenFields, paidCVEducation, 'Optimized CV');
              const customerEmail = (paidCV as any)?.email;
              if (customerEmail && base64) {
                try {
                  await fetch('/api/send-cv', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: customerEmail, base64, filename: 'Optimized_CV' }),
                  });
                } catch (_) {}
              }
              clearServiceSession('optimization');
              setPaymentConfirmed(false); setRemainingOutputs(3);
              setResume(''); setJobDescription(''); setResult(null); setPaidCV(null); setProfSentences([]);
              setMessage('PDF downloaded. A copy has been sent to your email.');
            };
            if (!pdfWarningAcknowledged) { setPendingPdfDownload(()=>doDownload); setShowPdfWarning(true); return; }
            await doDownload();
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
  const [showPdfWarning, setShowPdfWarning] = useState(false);
  const [pdfWarningAcknowledged, setPdfWarningAcknowledged] = useState(false);
  const [pendingPdfDownload, setPendingPdfDownload] = useState<(() => Promise<void>) | null>(null);
  const [builder, setBuilder] = useState({
    targetJob:'',jobDescription:'',name:'',address:'',phone:'',email:'',linkedin:'',
    educations:[{degree:'',university:'',graduationYear:'',educationCountry:''}],
    experiences:[{jobTitle:'',company:'',location:'',startDate:'',endDate:'',responsibilities:'1-\n2-\n3-\n4-\n5-',achievements:'1-\n2-\n3-'}],
    softSkills:'1-\n2-\n3-\n4-\n5-',
    technicalSkills:'1-\n2-\n3-\n4-\n5-',
    internships:[{name:'',company:'',date:'',learned:'1-\n2-\n3-'}],
    courses:[{name:'',company:'',date:'',learned:'1-\n2-\n3-'}],
    languages:[{name:'',level:''}],licenses:'',additionalInfo:'',
  });
  const totalSteps = 7;

  const [suggestedSoftSkills, setSuggestedSoftSkills] = useState([]);
  const [selectedSoftSkills, setSelectedSoftSkills] = useState([]);
  const [suggestedTechnicalSkills, setSuggestedTechnicalSkills] = useState([]);
  const [selectedTechnicalSkills, setSelectedTechnicalSkills] = useState([]);
  const [additionalInfoMode, setAdditionalInfoMode] = useState<'edit'|'view'>('edit');
  const [additionalInfoAiCount, setAdditionalInfoAiCount] = useState(0);
  const [isGeneratingAdditionalInfo, setIsGeneratingAdditionalInfo] = useState(false);

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
        setStep(totalSteps);
      } catch {}
    }
  },[]);

  function updateBuilder(key,value) { setBuilder(old=>({...old,[key]:value})); }
  function updateEducation(index,key,value) {
    const updated=[...builder.educations]; updated[index]={...updated[index],[key]:value};
    setBuilder(old=>({...old,educations:updated}));
  }
  function addEducation() { setBuilder(old=>({...old,educations:[...old.educations,{degree:'',university:'',graduationYear:'',educationCountry:''}]})); }
  function removeEducation(index) { if (builder.educations.length===1) return; setBuilder(old=>({...old,educations:old.educations.filter((_,i)=>i!==index)})); }
  function formatEducation() {
    return builder.educations.map(e=>`${e.degree||'Degree'} - ${e.university||'University'} | ${e.graduationYear||'Year'} | ${e.educationCountry||'Country'}`).join('\n');
  }
  function updateExperience(index,key,value) {
    const updated=[...builder.experiences]; updated[index][key]=value;
    setBuilder(old=>({...old,experiences:updated}));
  }
  function addExperience() { setBuilder(old=>({...old,experiences:[...old.experiences,{jobTitle:'',company:'',location:'',startDate:'',endDate:'',responsibilities:'1-\n2-\n3-\n4-\n5-',achievements:'1-\n2-\n3-'}]})); }
  function removeExperience(index) { if (builder.experiences.length===1) return; setBuilder(old=>({...old,experiences:old.experiences.filter((_,i)=>i!==index)})); }
  function updateInternship(index,key,value) { const u=[...builder.internships]; u[index]={...u[index],[key]:value}; setBuilder(old=>({...old,internships:u})); }
  function addInternship() { setBuilder(old=>({...old,internships:[...old.internships,{name:'',company:'',date:'',learned:'1-\n2-\n3-'}]})); }
  function removeInternship(index) { if (builder.internships.length===1) return; setBuilder(old=>({...old,internships:old.internships.filter((_,i)=>i!==index)})); }
  function formatInternships() { return builder.internships.filter(i=>i.name||i.company||i.date).map(i=>{ const h=[i.name,i.company,i.date].filter(Boolean).join(' | '); const b=(i.learned||'').split('\n').map(l=>l.replace(/^\d+[-.)]\s*/,'').trim()).filter(Boolean).map(l=>`• ${l}`).join('\n'); return [h,b].filter(Boolean).join('\n'); }).join('\n\n'); }
  function updateCourse(index,key,value) { const u=[...builder.courses]; u[index]={...u[index],[key]:value}; setBuilder(old=>({...old,courses:u})); }
  function addCourse() { setBuilder(old=>({...old,courses:[...old.courses,{name:'',company:'',date:'',learned:'1-\n2-\n3-'}]})); }
  function removeCourse(index) { if (builder.courses.length===1) return; setBuilder(old=>({...old,courses:old.courses.filter((_,i)=>i!==index)})); }
  function formatCourses() { return builder.courses.filter(c=>c.name||c.company||c.date).map(c=>{ const h=[c.name,c.company,c.date].filter(Boolean).join(' | '); const b=(c.learned||'').split('\n').map(l=>l.replace(/^\d+[-.)]\s*/,'').trim()).filter(Boolean).map(l=>`• ${l}`).join('\n'); return [h,b].filter(Boolean).join('\n'); }).join('\n\n'); }
  function updateLanguage(index,key,value) { const u=[...builder.languages]; u[index]={...u[index],[key]:value}; setBuilder(old=>({...old,languages:u})); }
  function addLanguage() { setBuilder(old=>({...old,languages:[...old.languages,{name:'',level:''}]})); }
  function removeLanguage(index) { if (builder.languages.length===1) return; setBuilder(old=>({...old,languages:old.languages.filter((_,i)=>i!==index)})); }
  function formatLanguages() { return builder.languages.filter(l=>l.name).map(l=>l.level?`${l.name} (${l.level})`:l.name).join(' | '); }
  function parseExpDate(str) {
    if (!str) return new Date(0);
    const s = str.toLowerCase().trim();
    if (s.includes('present') || s.includes('current')) return new Date();
    const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
    for (let i = 0; i < months.length; i++) {
      if (s.includes(months[i])) { const y = s.match(/\d{4}/); if (y) return new Date(+y[0], i, 1); }
    }
    const d = new Date(str); if (!isNaN(d.getTime())) return d;
    const y = str.match(/\d{4}/); return y ? new Date(+y[0], 0, 1) : new Date(0);
  }
  function formatExperience() {
    const sorted = [...builder.experiences].sort((a, b) => {
      const isCurrentA = !a.endDate || a.endDate.toLowerCase().includes('present') || a.endDate.toLowerCase().includes('current');
      const isCurrentB = !b.endDate || b.endDate.toLowerCase().includes('present') || b.endDate.toLowerCase().includes('current');
      if (isCurrentA && !isCurrentB) return -1;
      if (!isCurrentA && isCurrentB) return 1;
      return parseExpDate(b.endDate || b.startDate).getTime() - parseExpDate(a.endDate || a.startDate).getTime();
    });
    return sorted.map(exp => {
      const r = exp.responsibilities.split('\n').map(x => x.replace(/^\d+[-.)]\s*/, '').trim()).filter(Boolean).map(x => `• ${x}`).join('\n') || '• Add main responsibilities here.';
      const a = exp.achievements.split('\n').map(x => x.replace(/^\d+[-.)]\s*/, '').trim()).filter(Boolean).map(x => `• ${x}`).join('\n') || '';
      return `${exp.jobTitle || 'Job Title'}\n${exp.company || 'Company Name'} | ${exp.location || 'Location'} | ${exp.startDate || 'Start Date'} - ${exp.endDate || 'End Date'}\n${r}\n${a}`;
    }).join('\n\n');
  }
  
  async function generateAdditionalInfoOnly() {
    if (additionalInfoAiCount >= 3 || isGeneratingAdditionalInfo) return;
    setIsGeneratingAdditionalInfo(true);
    try {
      const data = [
        `Name: ${builder.name}`, `Target Job: ${builder.targetJob}`,
        `Education:\n${formatEducation()}`, `Experience:\n${formatExperience()}`,
        `Soft Skills: ${builder.softSkills}`, `Technical Skills: ${builder.technicalSkills}`,
        `Languages: ${formatLanguages()}`, `Licenses: ${builder.licenses}`,
      ].join('\n');
      const res = await fetch('/api/ai', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({service:'additionalInfoOnly', builderData:data}) });
      const { parsed: p } = await res.json();
      if (p?.additionalInfo) {
        updateBuilder('additionalInfo', p.additionalInfo);
        setAdditionalInfoAiCount(c => c + 1);
        setAdditionalInfoMode('view');
      }
    } catch { alert('Failed to generate. Please try again.'); }
    finally { setIsGeneratingAdditionalInfo(false); }
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
        builderData: [
          `Name: ${builder.name}`,
          `Address: ${builder.address}`,
          `Phone: ${builder.phone}`,
          `Email: ${builder.email}`,
          `LinkedIn: ${builder.linkedin}`,
          `Education:\n${formatEducation()}`,
          `Soft Skills: ${builder.softSkills}`,
          `Technical Skills: ${builder.technicalSkills}`,
          `Internships: ${formatInternships()}`,
          `Courses / Training: ${formatCourses()}`,
          `Languages: ${formatLanguages()}`,
          `Licenses: ${builder.licenses}`,
          `Additional Information: ${builder.additionalInfo}`,
          `Experience:\n${formatExperience()}`,
        ].join('\n')
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
        education: p.education || formatEducation(),
        softSkills: p.softSkills || builder.softSkills,
        technicalSkills: p.technicalSkills || builder.technicalSkills,
        internships: p.internships || formatInternships() || '',
        courses: p.courses || formatCourses() || '',
        additionalInfo: p.additionalInfo || '',
        language: p.language || formatLanguages() || 'Not provided',
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
      {step===3&&<div className="wizard-card"><h3>Education</h3>
        {builder.educations.map((edu,index)=>(
          <div className="experience-card" key={index}>
            <h4>Education {index+1}</h4>
            <div className="form">
              <input placeholder="Degree" value={edu.degree} onChange={e=>updateEducation(index,'degree',e.target.value)}/>
              <input placeholder="University" value={edu.university} onChange={e=>updateEducation(index,'university',e.target.value)}/>
              <input placeholder="Graduation Year" value={edu.graduationYear} onChange={e=>updateEducation(index,'graduationYear',e.target.value)}/>
              <input placeholder="Country" value={edu.educationCountry} onChange={e=>updateEducation(index,'educationCountry',e.target.value)}/>
            </div>
            {builder.educations.length>1&&<button className="danger-btn" onClick={()=>removeEducation(index)}>Remove Education</button>}
          </div>
        ))}
        <button className="secondary" onClick={addEducation}>+ Add Another Education</button>
      </div>}
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
              <label style={{display:'block',fontSize:12,fontWeight:700,color:'#64748b',marginTop:6,marginBottom:4}}>Responsibilities (write each next to its number)</label>
              <textarea style={{minHeight:110}} value={exp.responsibilities} onChange={e=>updateExperience(index,'responsibilities',e.target.value)}/>
              <label style={{display:'block',fontSize:12,fontWeight:700,color:'#64748b',marginTop:6,marginBottom:4}}>Achievements (optional)</label>
              <textarea style={{minHeight:80}} value={exp.achievements} onChange={e=>updateExperience(index,'achievements',e.target.value)}/>
            </div>
            {builder.experiences.length>1&&<button className="danger-btn" onClick={()=>removeExperience(index)}>Remove Experience</button>}
          </div>
        ))}
        <button className="secondary" onClick={addExperience}>+ Add Another Experience</button>
      </div>}
      {step===5&&<div className="wizard-card"><h3>Skills</h3>
        <p style={{fontSize:12,color:'#64748b',marginBottom:12}}>Write each skill next to its number. They will appear separated by | in your CV.</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:700,color:'#64748b',marginBottom:4}}>Soft Skills</label>
            <textarea style={{minHeight:130}} value={builder.softSkills} onChange={e=>updateBuilder('softSkills',e.target.value)}/>
          </div>
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:700,color:'#64748b',marginBottom:4}}>Technical Skills</label>
            <textarea style={{minHeight:130}} value={builder.technicalSkills} onChange={e=>updateBuilder('technicalSkills',e.target.value)}/>
          </div>
        </div>
      </div>}
      {step===6&&<div className="wizard-card">
        <h3>Internships & Training</h3>
        {builder.internships.map((item,index)=>(
          <div className="experience-card" key={index}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <h4 style={{margin:0}}>Training {index+1}</h4>
              {builder.internships.length>1&&<button className="danger-btn" onClick={()=>removeInternship(index)}>Remove</button>}
            </div>
            <div className="form">
              <input placeholder="Training / Internship Name" value={item.name} onChange={e=>updateInternship(index,'name',e.target.value)}/>
              <input placeholder="Company / Organization" value={item.company} onChange={e=>updateInternship(index,'company',e.target.value)}/>
              <input placeholder="Date (e.g. June 2023)" value={item.date} onChange={e=>updateInternship(index,'date',e.target.value)}/>
            </div>
            <label style={{display:'block',fontSize:12,color:'#64748b',fontWeight:700,margin:'8px 0 4px'}}>What did you learn? (write each item next to its number)</label>
            <textarea style={{minHeight:90}} value={item.learned} onChange={e=>updateInternship(index,'learned',e.target.value)}/>
          </div>
        ))}
        <button className="secondary" onClick={addInternship}>+ Add Another Training</button>
        <h3 style={{marginTop:24}}>Courses</h3>
        {builder.courses.map((item,index)=>(
          <div className="experience-card" key={index}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <h4 style={{margin:0}}>Course {index+1}</h4>
              {builder.courses.length>1&&<button className="danger-btn" onClick={()=>removeCourse(index)}>Remove</button>}
            </div>
            <div className="form">
              <input placeholder="Course Name" value={item.name} onChange={e=>updateCourse(index,'name',e.target.value)}/>
              <input placeholder="Provider / Institution" value={item.company} onChange={e=>updateCourse(index,'company',e.target.value)}/>
              <input placeholder="Date (e.g. March 2022)" value={item.date} onChange={e=>updateCourse(index,'date',e.target.value)}/>
            </div>
            <label style={{display:'block',fontSize:12,color:'#64748b',fontWeight:700,margin:'8px 0 4px'}}>What did you learn? (write each item next to its number)</label>
            <textarea style={{minHeight:90}} value={item.learned} onChange={e=>updateCourse(index,'learned',e.target.value)}/>
          </div>
        ))}
        <button className="secondary" onClick={addCourse}>+ Add Another Course</button>
      </div>}
      {step===7&&<div className="wizard-card"><h3>Languages, Licenses and Additional Info</h3>
        <p style={{fontSize:12,color:'#64748b',marginBottom:12}}>Languages will appear as: Arabic (Native) | English (Excellent)</p>
        {builder.languages.map((lang,index)=>(
          <div key={index} style={{border:'1px solid #E5E0D6',borderRadius:10,padding:12,marginBottom:10,background:'#FAFAF8'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <span style={{fontWeight:700,fontSize:13,color:'#1C1A16'}}>Language {index+1}</span>
              {builder.languages.length>1&&<button className="danger-btn" style={{padding:'2px 10px',fontSize:12}} onClick={()=>removeLanguage(index)}>Remove</button>}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <input placeholder="Language (e.g. Arabic)" value={lang.name} onChange={e=>updateLanguage(index,'name',e.target.value)}/>
              <select value={lang.level} onChange={e=>updateLanguage(index,'level',e.target.value)} style={{padding:'8px 10px',border:'1px solid #E5E0D6',borderRadius:8,fontSize:13,background:'#fff',color:'#1C1A16'}}>
                <option value="">Select level...</option>
                <option value="Native">Native</option>
                <option value="Excellent">Excellent</option>
                <option value="Very Good">Very Good</option>
                <option value="Good">Good</option>
                <option value="Intermediate">Intermediate</option>
              </select>
            </div>
          </div>
        ))}
        <button className="secondary" style={{marginBottom:16}} onClick={addLanguage}>+ Add Language</button>
        <textarea placeholder="Licenses & Certifications" value={builder.licenses} onChange={e=>updateBuilder('licenses',e.target.value)}/>
        <div style={{marginTop:8}}>
          <p style={{fontWeight:600,fontSize:13,marginBottom:6,color:'#1C1A16'}}>Additional Information</p>
          <textarea placeholder="e.g. UAE driving license, volunteer work, publications, hobbies..." value={builder.additionalInfo} onChange={e=>updateBuilder('additionalInfo',e.target.value)} style={{marginBottom:4}}/>
          <p style={{fontSize:11,color:'#94a3b8',margin:0}}>After generating your CV, you can use AI to polish this text.</p>
        </div>
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
            <PayPalWrapper
              service="builder"
              label={`Unlock Resume Package — ${PRICES.builder}`}
              onBeforePayment={() => {
                sessionStorage.setItem('resuvanta_pending_builder', JSON.stringify({ builder }));
              }}
              onSuccess={() => {
                const saved = sessionStorage.getItem('resuvanta_pending_builder');
                if (saved) {
                  try {
                    const data = JSON.parse(saved);
                    if (data.builder) setBuilder(data.builder);
                    const used = getUsageCount('builder');
                    setPaymentConfirmed(true);
                    setRemainingOutputs(Math.max(0, 3 - used));
                    setStep(totalSteps);
                  } catch {}
                } else { setPaymentConfirmed(true); }
              }}
            />
          )}
        </>}

      </div>

      {builtCV && (
        <div className="built-output" style={{marginTop: 32}}>
          <h3>Review & Customize Your Optimized CV</h3>
          
          {suggestedSoftSkills && suggestedSoftSkills.length > 0 && (
            <div style={{marginBottom: 16, padding: 16, background: '#F8F6F1', borderRadius: 12, border: '1px solid #E5E0D6'}}>
              <p style={{fontWeight: 700, color: '#1C1A16', marginBottom: 12}}>⭐ Suggested Soft Skills (Based on Job Description)</p>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
                {suggestedSoftSkills.map((skill, i) => (
                  <label key={i} style={{background: selectedSoftSkills.includes(skill) ? '#1C1A16' : '#F0EDE6', color: selectedSoftSkills.includes(skill) ? '#F8F6F1' : '#1C1A16', padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 13, userSelect: 'none', transition: '0.2s'}}>
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
            <div style={{marginBottom: 16, padding: 16, background: '#F8F6F1', borderRadius: 12, border: '1px solid #E5E0D6'}}>
              <p style={{fontWeight: 700, color: '#1C1A16', marginBottom: 12}}>⚙️ Suggested Technical Skills</p>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
                {suggestedTechnicalSkills.map((skill, i) => (
                  <label key={i} style={{background: selectedTechnicalSkills.includes(skill) ? '#2DB34A' : '#F0EDE6', color: selectedTechnicalSkills.includes(skill) ? '#fff' : '#1C1A16', padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 13, userSelect: 'none', transition: '0.2s'}}>
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
            <button style={{marginBottom: 24, background:'#1C1A16',color:'#F8F6F1',border:'none',borderRadius:8,padding:'10px 20px',fontWeight:700,cursor:'pointer'}}
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
          <div style={{marginTop:16,padding:16,background:'#F8F6F1',borderRadius:12,border:'1px solid #E5E0D6',marginBottom:8}}>
            <p style={{fontWeight:700,fontSize:13,marginBottom:6,color:'#1C1A16'}}>Additional Information</p>
            <textarea value={builtCV.additionalInfo||''} onChange={e=>setBuiltCV({...builtCV,additionalInfo:e.target.value})} style={{minHeight:80,marginBottom:8}}/>
            <button className="secondary" style={{fontSize:13,padding:'6px 14px'}} disabled={isGeneratingAdditionalInfo} onClick={async()=>{
              if (!builtCV.additionalInfo?.trim()) return;
              setIsGeneratingAdditionalInfo(true);
              try {
                const res = await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({service:'additionalInfoOnly',builderData:`Improve the following text to sound more professional. Keep all facts exactly the same, only improve the language and tone:\n\n${builtCV.additionalInfo}`})});
                const d = await res.json();
                if (d.parsed?.additionalInfo) setBuiltCV(old=>({...old,additionalInfo:d.parsed.additionalInfo}));
              } catch{} finally{setIsGeneratingAdditionalInfo(false);}
            }}>{isGeneratingAdditionalInfo?'Polishing...':'Polish with AI'}</button>
          </div>

          {showPdfWarning && (
            <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div style={{background:'#fff',borderRadius:12,padding:'28px 32px',maxWidth:420,width:'90%',border:'1px solid #E5E0D6',boxShadow:'0 8px 32px rgba(0,0,0,0.12)'}}>
                <h3 style={{margin:'0 0 12px',color:'#1C1A16',fontSize:16,fontWeight:700}}>Before downloading your CV</h3>
                <p style={{color:'#666',fontSize:13,lineHeight:1.6,margin:'0 0 20px'}}>We recommend reviewing all sections carefully before downloading. Errors in personal details, dates, or content are your responsibility to correct.</p>
                <div style={{display:'flex',gap:10}}>
                  <button style={{flex:1}} onClick={()=>{setShowPdfWarning(false);setPdfWarningAcknowledged(true);}}>OK</button>
                  <button onClick={async()=>{
                    setShowPdfWarning(false); setPdfWarningAcknowledged(true);
                    if (pendingPdfDownload) await pendingPdfDownload();
                  }}>Download Anyway</button>
                </div>
              </div>
            </div>
          )}

          <button onClick={async ()=>{
            const doDownload = async () => {
              await openPDFWindow(builtCV, 'Built CV', builder.experiences, builder.educations);
              clearServiceSession('builder');
              setPaymentConfirmed(false); setRemainingOutputs(3); setBuiltCV(null);
            };
            if (!pdfWarningAcknowledged) { setPendingPdfDownload(()=>doDownload); setShowPdfWarning(true); return; }
            await doDownload();
          }}>Download PDF</button>
        </div>
      )}
    </div>
  );
}

function BuilderPage() {
  return (
    <section className="section">
      <h2>CV Builder + Optimization — <DiscountPrice service="builder"/></h2>
      <p className="muted">No CV yet? Answer simple questions, add your target job, and generate an optimized ATS-friendly CV.</p>
      <StepsStrip steps={['Enter target job','Fill personal info','Add education & experience','Pay & generate CV']}/>
      <div className="builder-price-box">
        <h3>CV Builder + Optimization — <DiscountPrice service="builder"/></h3>
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
      <h2>LinkedIn Optimization — <DiscountPrice service="linkedin"/></h2>
      <p className="muted">Free preview gives one headline only. Full LinkedIn optimization unlocks About section, experience rewrite, skills, and recruiter keywords based on your uploaded CV.</p>

      <StepsStrip steps={['Enter target role', 'Upload Your CV', 'Get free headline', 'Pay & unlock full profile']}/>

      <div className="form" style={{display:'flex', flexDirection:'column', gap:'16px', maxWidth:'600px', margin:'0 auto'}}>
        <input
          placeholder="Target Role, e.g. Community Pharmacist"
          value={targetRole}
          onChange={e => setTargetRole(e.target.value)}
        />

        <div style={{
          border: `2px dashed ${cvText ? '#2DB34A' : '#E5E0D6'}`,
          borderRadius: '8px',
          padding: '24px',
          textAlign: 'center',
          background: '#F8F6F1',
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
          <p style={{color:'#1C1A16', margin:'0 0 4px 0', fontSize:'14px', fontWeight:'bold'}}>
            {fileLoading ? 'Reading file...' : cvText ? 'CV Uploaded Successfully!' : 'Click or Drag to Upload Your CV'}
          </p>
          <p style={{color:'#666666', margin:0, fontSize:'12px'}}>
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
          <h3>Unlock LinkedIn Optimization — <DiscountPrice service="linkedin"/></h3>
          <p>Get your professional headline, About section, experience wording, skills list, and recruiter search keywords.</p>
          {paymentConfirmed ? (
            <button onClick={generateFullLinkedInOptimization} disabled={isGeneratingLinkedIn}>
              {isGeneratingLinkedIn ? '⏳ optimizing your profile...' : 'Generate Full LinkedIn Optimization'}
            </button>
          ) : (
            <PayPalWrapper
              service="linkedin"
              label={`Optimize My LinkedIn — ${PRICES.linkedin}`}
              onBeforePayment={() => {
                if (!targetRole.trim() || !cvText) {
                  throw new Error('Please enter your target role and upload your CV first.');
                }
                sessionStorage.setItem('resuvanta_pending_linkedin', JSON.stringify({ targetRole, cvText }));
              }}
              onSuccess={() => {
                const saved = sessionStorage.getItem('resuvanta_pending_linkedin');
                if (saved) {
                  try {
                    const data = JSON.parse(saved);
                    if (data.targetRole) setTargetRole(data.targetRole);
                    if (data.cvText) setCvText(data.cvText);
                    setPaymentConfirmed(true);
                  } catch {}
                } else { setPaymentConfirmed(true); }
              }}
            />
          )}
        </div>

      </div>}

      {fullLinkedInOutput && <div className="paid-output">
        <h3>Full LinkedIn Optimization</h3>

        <div style={{marginBottom:'20px'}}>
          <h4 style={{color:'#1C1A16', borderBottom:'1px solid #E5E0D6', paddingBottom:'8px', marginBottom:'12px'}}>Professional Headline</h4>
          <p style={{fontSize:'15px', color:'#1C1A16', background:'#F8F6F1', padding:'12px', borderRadius:'8px', border:'1px solid #E5E0D6'}}>{fullLinkedInOutput.headline}</p>
        </div>

        <div style={{marginBottom:'20px'}}>
          <h4 style={{color:'#1C1A16', borderBottom:'1px solid #E5E0D6', paddingBottom:'8px', marginBottom:'12px'}}>About Section</h4>
          <p style={{fontSize:'14px', color:'#1C1A16', background:'#F8F6F1', padding:'16px', borderRadius:'8px', border:'1px solid #E5E0D6', whiteSpace:'pre-wrap', lineHeight:'1.6'}}>{fullLinkedInOutput.about}</p>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'24px'}}>
          <div>
            <h4 style={{color:'#1C1A16', borderBottom:'1px solid #E5E0D6', paddingBottom:'8px', marginBottom:'12px'}}>Skills Keywords</h4>
            <p style={{fontSize:'13px', color:'#555555', background:'#F8F6F1', padding:'12px', borderRadius:'8px', border:'1px solid #E5E0D6'}}>{fullLinkedInOutput.skills}</p>
          </div>
          <div>
            <h4 style={{color:'#1C1A16', borderBottom:'1px solid #E5E0D6', paddingBottom:'8px', marginBottom:'12px'}}>Recruiter Search Keywords</h4>
            <p style={{fontSize:'13px', color:'#555555', background:'#F8F6F1', padding:'12px', borderRadius:'8px', border:'1px solid #E5E0D6'}}>{fullLinkedInOutput.recruiterKeywords}</p>
          </div>
        </div>

        <div style={{marginTop:'32px', background:'#F0EDE6', padding:'24px', borderRadius:'16px', border:'1px solid #E5E0D6', textAlign:'left'}}>
          <h3 style={{color:'#1C1A16', marginBottom:'20px', fontSize:'18px', display:'flex', alignItems:'center', gap:'8px'}}>🚀 Bonus: Expert LinkedIn Tips & AI Tools</h3>

          <div style={{marginBottom:'20px'}}>
            <h4 style={{color:'#1C1A16', marginBottom:'8px', fontSize:'15px'}}>1. How to Verify Your Account (Get the Badge)</h4>
            <ul style={{fontSize:'13px', color:'#555555', paddingLeft:'20px', lineHeight:'1.6', margin:0}}>
              <li>Go to <b>Settings & Privacy</b> &gt; <b>Account Preferences</b> &gt; <b>Verifications</b>.</li>
              <li>Depending on your country, choose your verification method (Clear, Persona with Passport/NFC, or Work Email).</li>
              <li>Follow the prompts to get the trusted verification checkmark next to your name.</li>
            </ul>
          </div>

          <div style={{marginBottom:'20px'}}>
            <h4 style={{color:'#1C1A16', marginBottom:'8px', fontSize:'15px'}}>2. Profile Visibility & Formatting Tricks</h4>
            <ul style={{fontSize:'13px', color:'#555555', paddingLeft:'20px', lineHeight:'1.6', margin:0}}>
              <li><b>Custom URL:</b> Edit your public profile URL to be just your name (e.g., <i>linkedin.com/in/yourname</i>) without random numbers.</li>
              <li><b>Featured Section:</b> Pin your optimized CV, portfolio, or top posts directly below your About section.</li>
              <li><b>Open to Work:</b> Turn this on for "Recruiters Only" so you appear in more searches without showing the green badge publicly on your picture.</li>
            </ul>
          </div>

          <div style={{marginBottom:'10px'}}>
            <h4 style={{color:'#1C1A16', marginBottom:'8px', fontSize:'15px'}}>3. AI Tools for a Professional Profile Picture & Cover</h4>
            <ul style={{fontSize:'13px', color:'#555555', paddingLeft:'20px', lineHeight:'1.6', margin:0}}>
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
          <h3>CV Optimization</h3><h2><DiscountPrice service="optimization"/></h2>
          <p>Improve your existing CV with job-focused recommendations, stronger wording, better structure, and ATS-friendly keyword guidance.</p>
          <ul><li>Free resume preview</li><li>ATS keyword analysis</li><li>Content and wording improvements</li><li>Role-focused optimization tips</li><li>Clear strengths and weaknesses report</li></ul>
        </div>
        <div className="price-card featured">
          <h3>CV Builder + Optimization</h3><h2><DiscountPrice service="builder"/></h2>
          <p>Create a professional CV from scratch with guided sections, optimized wording, and a structure designed for job applications.</p>
          <ul><li>Step-by-step CV builder</li><li>Professional CV structure</li><li>ATS-friendly wording</li><li>Skills and experience improvement</li><li>Complete resume package guidance</li></ul>
        </div>
        <div className="price-card">
          <h3>LinkedIn Optimization</h3><h2><DiscountPrice service="linkedin"/></h2>
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
  const [darkMode, setDarkMode] = useState(false);
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
      const pathMap: Record<string, string> = { optimization: '/cv-optimization', builder: '/resume-builder', linkedin: '/linkedin' };
      const newPath = pathMap[selectedPage] || pathMap[service] || '/';
      window.history.replaceState({}, '', newPath);
    }
  },[]);

  useEffect(() => {
    const pathMap: Record<string, string> = { optimization: '/cv-optimization', builder: '/resume-builder', linkedin: '/linkedin', pricing: '/pricing', faq: '/faq', home: '/' };
    window.history.replaceState({}, '', pathMap[page] || '/');
  }, [page]);

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
          <a href="/pricing" style={{color:'inherit',textDecoration:'none'}} onClick={()=>setMenuOpen(false)}>Pricing</a>
          <button onClick={()=>{setPage('faq');setMenuOpen(false);}}>FAQ</button>
        </nav>
        <div className="headerActions">
          <button className="hamburgerBtn" onClick={()=>setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? '✕' : '☰'}
          </button>
          <button className="modeBtn iconModeBtn" style={{display:'none'}} onClick={()=>setDarkMode(!darkMode)}>
            {darkMode?'☀️':'🌙'}
          </button>
        </div>
      </header>
      {renderPage()}
      <footer>
        <p>ResuVanta provides automated CV optimization support only. It does not guarantee interviews, job offers, or hiring decisions.</p>
        <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
          <a href="/terms" style={{color:'#aaa',fontSize:13,textDecoration:'none'}}>Terms of Service</a>
          <a href="/privacy" style={{color:'#aaa',fontSize:13,textDecoration:'none'}}>Privacy Policy</a>
          <a href="/refund" style={{color:'#aaa',fontSize:13,textDecoration:'none'}}>Refund Policy</a>
        </div>
      </footer>
    </div>
  );
}
