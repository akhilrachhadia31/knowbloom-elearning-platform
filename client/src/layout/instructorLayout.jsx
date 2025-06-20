// src/layout/instructorLayout.jsx

import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import InstructorSidebar from "@/pages/instructor/Sidebar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";


const InstructorLayout = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* ─── NAVBAR ─── */}
      <Navbar />

      {/* ─── BODY (SIDEBAR + MAIN + FOOTER) ─── */}
      <div className="flex flex-1 pt-16">
        {/* 
          - `pt-16` pushes everything down beneath the fixed Navbar (64px tall). 
          - Now Sidebar and Main will be side by side.
        */}

        {/* ─── LEFT: Sidebar (no fixed positioning) ─── */}
        <InstructorSidebar
          expanded={sidebarExpanded}
          onHoverChange={setSidebarExpanded}
        />

        {/* ─── RIGHT: Main Content + Footer ─── */}
        <div className="flex flex-col flex-1">
          {/* 
            ─── Main scrollable area ───
            - `flex-1` so it grows to fill vertical space above Footer
            - `overflow-auto` for scrollable instructor content
            - `p-10` is your existing padding
            - `bg-white dark:bg-gray-900` to match theme
          */}
          <main className="flex-1 overflow-auto p-10 bg-white dark:bg-gray-900">
            <Outlet />
          </main>

          {/* Single Footer (always visible at bottom of right column) */}
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default InstructorLayout; // ← Capitalized export
