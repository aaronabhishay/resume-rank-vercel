import React from "react";

export default function DriveFolderInput({ value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Google Drive Folder Link
      </label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder="Enter Google Drive folder link..."
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      />
      <p className="text-xs text-gray-500">
        Make sure the folder is shared with the service account email
      </p>
    </div>
  );
} 