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
}

const services: Service[] = [
  { id: 'cv-optimization', name: 'CV Optimization', price: 7.99 },
  { id: 'cv-builder', name: 'CV Builder + Optimization', price: 11.99 },
  { id: 'linkedin-optimization', name: 'LinkedIn Optimization', price: 6.99 },
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
      serviceElementsMap.set(service.id, (
        <div key={service.id} className="border p-4 rounded-lg shadow-sm">
          <h3 className="font-bold text-lg">{service.name}</h3>
          <p className="text-gray-600">${service.price}</p>
          <button
            onClick={() => handleSelectService(service.id)}
            className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded"
          >
            Select Service
          </button>
        </div>
      ));
    });

    return Array.from(serviceElementsMap.values());
  };

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">ResuVanta</h1>

      {!unlockedService ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {renderServices()}
          </div>

          {selectedService && clientSecret && (
            <div className="max-w-md mx-auto">
              <h2 className="text-xl font-bold mb-4">Complete Payment</h2>
              <StripeWrapper clientSecret={clientSecret}>
                <PaymentForm serviceName={selectedService} onSuccess={handlePaymentSuccess} />
              </StripeWrapper>
            </div>
          )}
        </>
      ) : (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-2">Service Unlocked: {unlockedService}</h2>
          <p className="text-sm text-gray-500 mb-6">Generations used: {usageCount} / 3</p>

          <textarea
            value={promptInput}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPromptInput(e.target.value)}
            placeholder="Paste your CV or details here..."
            className="w-full h-40 p-4 border rounded-md mb-4"
          />

          <button
            onClick={handleGenerate}
            disabled={isGenerating || usageCount >= 3}
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : 'Generate Magic'}
          </button>

          {aiResult && (
            <div className="mt-8 p-6 bg-white border rounded-md">
              <h3 className="font-bold text-lg mb-4">Result:</h3>
              <p className="whitespace-pre-wrap">{aiResult}</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
