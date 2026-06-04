"use client";

import React, { useState } from "react";

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Thank you! Your message has been sent to support@resuvanta.com.");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <section className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
      <div className="max-w-7xl mx-auto lg:grid lg:grid-cols-5 lg:gap-8">
        
        {/* Contact Information Card */}
        <div className="lg:col-span-2 bg-indigo-950 rounded-2xl p-8 text-white flex flex-col justify-between shadow-lg mb-8 lg:mb-0">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Contact Us</h2>
            <p className="mt-4 text-base text-indigo-200">
              Have a question or feedback about ResuVanta? Send us a message and we will get back to you as soon as possible.
            </p>
          </div>
          
          <div className="mt-8 space-y-4">
            <div className="flex items-center space-x-3">
              <span className="text-xl">📧</span>
              <span className="text-md font-medium text-indigo-100">support@resuvanta.com</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-xl">🌐</span>
              <span className="text-md font-medium text-indigo-100">www.resuvanta.com</span>
            </div>
          </div>
          
          <div className="mt-8 text-xs text-indigo-300 border-t border-indigo-900 pt-4">
            © {new Date().getFullYear()} ResuVanta. All rights reserved.
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm"
                placeholder="Abdelhameed ..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm"
                placeholder="your-email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Subject</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="mt-1 block w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm"
                placeholder="Message subject"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Message</label>
              <textarea
                rows={4}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="mt-1 block w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none text-sm"
                placeholder="Type your message here..."
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 px-6 text-white bg-indigo-600 hover:bg-indigo-700 font-medium rounded-lg shadow-sm transition duration-200 text-sm flex justify-center items-center gap-2"
              >
                Send Message 🚀
              </button>
            </div>
          </form>
        </div>

      </div>
    </section>
  );
}
