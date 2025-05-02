import React from "react";

export default function JobDescriptionInput({ value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Job Description
      </label>
      <textarea
        value={value}
        onChange={onChange}
        placeholder="Enter the job description here..."
        className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
} 