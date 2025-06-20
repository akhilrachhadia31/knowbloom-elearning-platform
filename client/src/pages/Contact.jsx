// src/pages/Contact.jsx
import React, { useState, useEffect } from "react";
import { Mail, Phone } from "lucide-react";
import { useSendContactMessageMutation } from "@/features/api/contactApi";
import toast from "react-hot-toast";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sendContactMessage, { isLoading, isSuccess, isError, error }] =
    useSendContactMessageMutation();

  // Show toast notifications on success/error
  useEffect(() => {
    if (isSuccess) {
      toast.success("Your message has been sent!");
      setForm({ name: "", email: "", message: "" });
    } else if (isError) {
      toast.error(
        error?.data?.message || "Failed to send. Please try again later."
      );
    }
  }, [isSuccess, isError, error]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("All fields are required.");
      return;
    }
    try {
      await sendContactMessage(form).unwrap();
    } catch {
      // errors are handled by useEffect
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white text-center mb-12">
        Contact Us
      </h1>
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Info Panel */}
        <div className="lg:w-1/2 bg-cyan-50 dark:bg-cyan-900 p-8 rounded-xl shadow-md space-y-6">
          <h2 className="text-2xl font-semibold text-cyan-700 dark:text-cyan-300">
            Get in Touch
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            We’d love to hear from you! Fill out the form and we’ll get back to
            you as soon as possible.
          </p>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Phone className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              <span className="text-gray-800 dark:text-gray-200">
                +91 70430-41962
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              <span className="text-gray-800 dark:text-gray-200">
                knowbloom.team@gmail.com
              </span>
            </div>
          </div>
        </div>

        {/* Form Panel */}
        <div className="lg:w-1/2">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  type="text"
                  placeholder="Your name"
                  className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  type="email"
                  placeholder="you@example.com"
                  className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Message
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows="5"
                  placeholder="How can we help you?"
                  className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 transition"
              >
                {isLoading ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
