"use client";
import { useState, useEffect } from "react";

// A safe hook that doesn"t require wrapping root layout
export function useActiveJob() {
  const [activeJob, setActiveJobState] = useState(null);

  useEffect(() => {
    // Load on mount
    const saved = localStorage.getItem("fdo_active_job");
    if (saved) {
      try {
        setActiveJobState(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse active job");
      }
    }

    // Listen for cross-tab or cross-component updates
    const handleStorageChange = () => {
       const current = localStorage.getItem("fdo_active_job");
       if (current) setActiveJobState(JSON.parse(current));
    };

    window.addEventListener("storage", handleStorageChange);
    // Custom event for same-tab updates
    window.addEventListener("active-job-update", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("active-job-update", handleStorageChange);
    };
  }, []);

  const setActiveJob = (job) => {
    setActiveJobState(job);
    localStorage.setItem("fdo_active_job", JSON.stringify(job));
    // Dispatch event so other components update instantly
    window.dispatchEvent(new Event("active-job-update"));
  };

  return { activeJob, setActiveJob };
}
