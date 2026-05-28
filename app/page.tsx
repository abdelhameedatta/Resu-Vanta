'use client';

import React, { useState, useEffect } from 'react';
import StripeWrapper from './components/StripeWrapper';
import PaymentForm from './components/PaymentForm';

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface Service {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}

const services: Service[] = [
  { 
    id: 'cv-optimization', 
    name: 'CV Optimization', 
    price: 7.99,
    description: 'Perfect your existing resume with professional AI keywords and formatting.',
    features: ['ATS Compatibility Check', 'Keyword Optimization', 'Grammar & Tone Polish']
  },
  { 
    id: 'cv-builder', 
    name: 'CV Builder + Optimization', 
    price: 11.99,
    description: 'Build a brand new high-converting professional CV from scratch with Claude AI.',
    features: ['Full Resume Generation', 'Custom Executive Summary', '3 Downloadable Formats', 'Priority Processing']
  },
  { 
    id: 'linkedin-optimization', 
    name: 'LinkedIn Optimization', 
    price: 6.99,
    description: 'Transform your LinkedIn profile into a recruiter magnet.',
    features: ['Headline & About Rewrite', 'Experience Bullet Points', 'Skills Alignment Strategy']
  },
];

export default function HomePage(): JSX.Element {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [unlockedService, setUnlockedService] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState<number>(0);
  const [promptInput, setPromptInput] = useState<string>('');
  const [aiResult, setAiResult] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect((): void => {
    const activeService: string | null = sessionStorage.getItem('unlockedService');
    const count: string | null = sessionStorage.getItem('usageCount');
    
    if (activeService) setUnlockedService(activeService);
    if (count) setUsageCount(parseInt(count, 10));
  }, []);

  const handleSelectService = async (serviceId: string): Promise<void> => {
    setSelectedService(serviceId);
    setClientSecret('');
    
    const response: Response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId }),
    });
    
    const data: { clientSecret: string } = await response.json();
    setClientSecret(data.clientSecret);
  };

  const handlePaymentSuccess = (serviceName: string): void => {
    setUnlockedService(serviceName);
    setUsageCount(0);
    setSelectedService(null);
  };

  const handleGenerate = async (): Promise<void> => {
    if (usageCount >= 3) {
      alert('You have reached the maximum of 3 generations for this session.');
      return;
    }

    setIsGenerating(true);
    try {
      const response: Response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptInput, service: unlockedService }),
      });
      
      const data: { result?: string; error?: string } = await response.json();
      
      if (data.result) {
        setAiResult(data.result);
        const newCount: number = usageCount + 1;
        setUsageCount(newCount);
        sessionStorage.setItem('usageCount', newCount.toString());
      } else {
        alert(data.error || 'Failed to generate');
      }
    } catch (error: any) {
      alert('Error during generation');
    }
    setIsGenerating(false);
  };

  const renderServices = (): JSX.Element[] => {
    const serviceElementsMap: Map<string, JSX.Element> = new Map();
    
    services.forEach((service: Service) => {
      const isCurrentSelected: boolean = selectedService === service.id;
      serviceElementsMap.set(service.id, (
        <div 
          key={service.id} 
          className={`flex flex-col h-full bg-white border rounded-2xl p-6 transition-all duration-200 shadow-sm ${
            isCurrentSelected ? 'ring-2 ring-indigo-600 border-transparent shadow-md' : 'hover:shadow-md border-gray-100'
          }`}
        >
          <div className="flex-1">
            <h3 className="font-bold text-xl text-gray-900 mb-2">{service.name}</h3>
            <p className="text-gray-500 text-sm mb-4 min-h-[40px]">{service.description}</p>
            <div className="flex items-baseline mb-6">
              <span className="text-4xl font-extrabold text-gray-900">${service.price}</span>
              <span className="text-gray-500 text-sm ml-1">/ session</span>
            </div>
            <ul className="space-y-2.5 mb-6 text-sm text-gray-600">
              {service.features.map((feature: string, index: number) => (
                <li key={index} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => handleSelectService(service.id)}
            className={`w-full py-3 px-4 rounded-xl font-medium text-sm transition-all ${
              isCurrentSelected 
                ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
            }`}
          >
            {isCurrentSelected ? 'Selected' : 'Get Started'}
          </button>
        </div>
      ));
    });

    return Array.from(serviceElementsMap.values());
  };

  return (
    <main className="min-h-screen bg-slate-50 text-gray-800 antialiased selection:bg-indigo-500 selection:text-white">
      <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        
        <header className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
            ResuVanta
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Optimize your professional presence and pass ATS filters instantly using Claude AI.
          </p>
        </header>

        {!unlockedService ? (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {renderServices()}
            </div>

            {selectedService && clientSecret && (
              <div className="max-w-md mx-auto bg-white border border-gray-100 rounded-2xl p-6 shadow-xl animate-fade-in">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Secure Checkout
                </h2>
                <StripeWrapper clientSecret={clientSecret}>
                  <PaymentForm serviceName={selectedService} onSuccess={handlePaymentSuccess} />
                </StripeWrapper>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-6 mb-6 gap-4">
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 mb-2">
                  Active Workspace
                </span>
                <h2 className="text-2xl font-bold text-gray-900 capitalize">
                  {unlockedService.replace('-', ' ')}
                </h2>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-center sm:text-right">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Generations Remaining</p>
                <p className="text-lg font-bold text-gray-900">{3 - usageCount} <span className="text-gray-400 text-sm font-normal">out of 3</span></p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700">
                Your Professional Background / Current CV Data
              </label>
              <textarea
                value={promptInput}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPromptInput(e.target.value)}
                placeholder="Paste your resume content, experience details, or specifics you want optimized..."
                className="w-full h-48 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm resize-none placeholder-gray-400 shadow-inner bg-slate-50/50"
              />

              <button
                onClick={handleGenerate}
                disabled={isGenerating || usageCount >= 3}
                className="w-full sm:w-auto flex items-center justify-center bg-indigo-600 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm shadow-indigo-200"
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Claude is optimizing...
                  </span>
                ) : 'Generate AI Review'}
              </button>
            </div>

            {aiResult && (
              <div className="mt-8 border border-gray-100 bg-slate-50/50 rounded-2xl p-6 animate-fade-in">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Optimized Output
                </h3>
                <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                  {aiResult}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
