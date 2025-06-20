import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const svgPattern = encodeURIComponent(`
  <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="grad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" style="stop-color:rgb(102,126,234);stop-opacity:1" />
        <stop offset="100%" style="stop-color:rgb(76,201,240);stop-opacity:0.4" />
      </radialGradient>
    </defs>
    <rect width="800" height="600" fill="url(#grad)" />
    <circle cx="400" cy="300" r="200" fill="rgba(139,92,246,0.18)" />
    <circle cx="650" cy="100" r="80" fill="rgba(34,211,238,0.11)" />
    <circle cx="200" cy="400" r="60" fill="rgba(16,185,129,0.14)" />
  </svg>
`);

const HeroSection = () => {
  const navigate = useNavigate();

  const handleExplore = () => {
    navigate("/search");
  };

  return (
    <section className="mt-9 relative min-h-[70vh] flex items-center justify-center bg-slate-950">
      {/* Background SVG and Gradient */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,${svgPattern}")`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-purple-900/60 to-slate-900/90" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-6 md:px-12 max-w-4xl mx-auto">
        {/* Main Heading */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black mb-6 leading-tight">
          <span className="block bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
            Unlock Your
          </span>
          <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mt-2">
            Future
          </span>
        </h1>

        {/* Description */}
        <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-10 font-light">
          Master new technologies with{" "}
          <span className="text-blue-400 font-semibold">industry experts</span>,
          build real projects, and{" "}
          <span className="text-purple-400 font-semibold">
            launch your dream career
          </span>
          .
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={handleExplore}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-xl shadow-md transition-all"
          >
            Browse Courses
          </motion.button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
