"use client";

import React from "react";

export const CustomPageLoader = ({
  message = "Chargement des données...",
  className = "",
}: {
  message?: string;
  className?: string;
}) => {
  return (
    <div className={`fixed inset-0 z-[9998] flex items-center justify-center bg-white/60 backdrop-blur-sm ${className}`}>
      <div className="flex flex-col items-center justify-center gap-6 px-4">
        <div className="relative flex items-center justify-center w-24 h-24">
          <svg
            className="absolute inset-0 w-full h-full animate-[spin_3s_linear_infinite]"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-blue-200 dark:text-slate-700"
              strokeDasharray="20 10"
            />
          </svg>
          <svg
            className="absolute inset-0 w-full h-full animate-[spin_2s_linear_infinite_reverse]"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-indigo-500 dark:text-indigo-400"
              strokeDasharray="40 20"
              strokeLinecap="round"
            />
          </svg>
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-full animate-pulse shadow-lg shadow-indigo-500/50" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {message}
          </h3>
          <div className="flex gap-1.5">
            <div
              className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
