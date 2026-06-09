"use client";

import React, { useState } from "react";

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <section style={{
      padding: '60px 24px',
      borderTop: '1px solid #1e293b',
      background: 'transparent',
    }}>
      <div className="contact-grid" style={{
        maxWidth: 900,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1.6fr',
        gap: 24,
        alignItems: 'start',
      }}>

        {/* Contact Info Card */}
        <div style={{
          background: 'linear-gradient(145deg, #1e3a5f, #0f172a)',
          borderRadius: 16,
          padding: '32px 24px',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          border: '1px solid #1e293b',
        }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 10px', color: '#f1f5f9' }}>Contact Us</h2>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              Have a question or feedback about ResuVanta? Send us a message and we will get back to you as soon as possible.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>📧</span>
              <span style={{ fontSize: 13, color: '#cbd5e1' }}>support@resuvanta.com</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>🌐</span>
              <span style={{ fontSize: 13, color: '#cbd5e1' }}>www.resuvanta.com</span>
            </div>
          </div>
          <div style={{
            borderTop: '1px solid #1e293b',
            paddingTop: 16,
            fontSize: 11,
            color: '#475569',
          }}>
            © {new Date().getFullYear()} ResuVanta. All rights reserved.
          </div>
        </div>

        {/* Contact Form */}
        <div style={{
          background: '#0f172a',
          borderRadius: 16,
          padding: '28px 24px',
          border: '1px solid #1e293b',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {[
              { label: 'Full Name', key: 'name', type: 'text', placeholder: 'e.g. John Smith' },
              { label: 'Email Address', key: 'email', type: 'email', placeholder: 'your-email@example.com' },
              { label: 'Subject', key: 'subject', type: 'text', placeholder: 'Message subject' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>
                  {label}
                </label>
                <input
                  type={type}
                  required
                  value={formData[key]}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  placeholder={placeholder}
                  style={{
                    width: '100%',
                    padding: '9px 14px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    color: '#f1f5f9',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}

            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>
                Message
              </label>
              <textarea
                rows={4}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Type your message here..."
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  color: '#f1f5f9',
                  fontSize: 13,
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {status === 'success' && (
              <p style={{ color: '#4ade80', fontSize: 13, margin: 0 }}>
                ✓ Message sent successfully!
              </p>
            )}
            {status === 'error' && (
              <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>
                ✗ Failed to send. Please try again.
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                width: '100%',
                padding: '11px 20px',
                background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                marginTop: 4,
                opacity: status === 'loading' ? 0.7 : 1,
              }}
            >
              {status === 'loading' ? '⏳ Sending...' : 'Send Message 🚀'}
            </button>

          </form>
        </div>

      </div>
    </section>
  );
}
