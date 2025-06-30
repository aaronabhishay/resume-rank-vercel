import React, { useState, useEffect } from "react";
import { FolderGit2, Link } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

export default function DriveFolderInput({ value, onChange, onInputModeChange }) {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [customLink, setCustomLink] = useState("");
  const [inputMode, setInputMode] = useState("dropdown"); // "dropdown" or "custom"
  const [userEnteredCustomLink, setUserEnteredCustomLink] = useState(false);

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const response = await fetch(`${window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://resume-rank.onrender.com'}/api/drive-folders`);
        if (!response.ok) {
          throw new Error('Failed to fetch folders');
        }
        const data = await response.json();
        setFolders(data);
      } catch (err) {
        setError('Failed to load folders');
        console.error('Error fetching folders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFolders();
  }, []);

  useEffect(() => {
    if (inputMode === "dropdown") {
      setSelectedFolderId(value);
    } else {
      // Only update customLink if user hasn't manually entered a custom link
      // or if the incoming value looks like a full URL
      if (!userEnteredCustomLink || (value && value.includes('drive.google.com'))) {
        setCustomLink(value);
      }
    }
  }, [value, inputMode, userEnteredCustomLink]);

  const handleInputModeChange = (newMode) => {
    setInputMode(newMode);
    setUserEnteredCustomLink(false); // Reset when switching modes
    if (onInputModeChange) {
      onInputModeChange(newMode);
    }
  };

  const handleFolderChange = (folderId) => {
    setSelectedFolderId(folderId);
    // For dropdown mode, pass the folder ID to the parent
    onChange(folderId);
  };

  const handleCustomLinkChange = (link) => {
    setCustomLink(link);
    setUserEnteredCustomLink(true);
    // For custom mode, pass the full link to the parent
    // The parent will handle extracting the folder ID if needed
    onChange(link);
  };

  const getSelectedFolderName = () => {
    const selectedFolder = folders.find(folder => folder.id === selectedFolderId);
    return selectedFolder ? selectedFolder.name : "Select a folder...";
  };

  return (
    <div className="space-y-3 w-full">
      {/* Input Mode Tabs */}
      <div className="flex border rounded-md overflow-hidden">
        <button
          type="button"
          onClick={() => handleInputModeChange("dropdown")}
          className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
            inputMode === "dropdown"
              ? "bg-blue-50 text-blue-700 border-r border-gray-200"
              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <FolderGit2 className="inline-block w-4 h-4 mr-2" />
          Select from folders
        </button>
        <button
          type="button"
          onClick={() => handleInputModeChange("custom")}
          className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
            inputMode === "custom"
              ? "bg-blue-50 text-blue-700 border-l border-gray-200"
              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Link className="inline-block w-4 h-4 mr-2" />
          Custom link
        </button>
      </div>

      {/* Dropdown Mode */}
      {inputMode === "dropdown" && (
        <div className="space-y-2">
          <div className="relative flex-1">
            <FolderGit2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <select
              className="w-full border rounded-md p-2 pl-9"
              value={selectedFolderId}
              onChange={e => handleFolderChange(e.target.value)}
            >
              <option value="">Select a folder...</option>
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>{folder.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Custom Link Mode */}
      {inputMode === "custom" && (
        <div className="space-y-2">
          <div className="relative flex-1">
            <Link className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="url"
              placeholder="https://drive.google.com/drive/folders/your-folder-id"
              className="w-full border rounded-md p-2 pl-9"
              value={customLink}
              onChange={(e) => handleCustomLinkChange(e.target.value)}
            />
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 flex items-center gap-1">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500"></span>
        Make sure the folder is shared with the service account email
      </p>
    </div>
  );
} 