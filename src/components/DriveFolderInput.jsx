import React, { useState, useEffect } from "react";
import { FolderGit2, Link, RefreshCw } from "lucide-react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../components/ui/select";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { getApiUrl } from "../utils/config";

export default function DriveFolderInput({ value, onChange, onInputModeChange }) {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [customLink, setCustomLink] = useState("");
  const [inputMode, setInputMode] = useState("dropdown"); // "dropdown" or "custom"
  const [userEnteredCustomLink, setUserEnteredCustomLink] = useState(false);

  const fetchFolders = async () => {
    setLoading(true);
    setError('');
    
    try {
      const accessToken = localStorage.getItem('google_access_token');
      
      if (!accessToken) {
        setError('Please connect your Google Drive first');
        setLoading(false);
        return;
      }

      const response = await fetch(`${getApiUrl()}/api/drive-folders?access_token=${encodeURIComponent(accessToken)}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Please reconnect your Google Drive');
        } else {
          throw new Error('Failed to fetch folders');
        }
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      setFolders(data);
      setError(''); // Clear any previous errors
    } catch (err) {
      setError('Failed to load folders from Google Drive');
      console.error('Error fetching folders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
    // Don't process placeholder values
    if (folderId === "no-folders") {
      return;
    }
    
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
      <div className="flex border border-border rounded-md overflow-hidden bg-background">
        <button
          type="button"
          onClick={() => handleInputModeChange("dropdown")}
          className={`flex-1 px-3 py-2 text-sm font-medium transition-colors border-r border-border
            ${inputMode === "dropdown"
              ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border-r border-primary"
              : "bg-background text-muted-foreground hover:bg-muted dark:bg-background dark:text-muted-foreground dark:hover:bg-muted"}
          `}
        >
          <FolderGit2 className="inline-block w-4 h-4 mr-2" />
          Select from folders
        </button>
        <button
          type="button"
          onClick={() => handleInputModeChange("custom")}
          className={`flex-1 px-3 py-2 text-sm font-medium transition-colors border-l border-border
            ${inputMode === "custom"
              ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border-l border-primary"
              : "bg-background text-muted-foreground hover:bg-muted dark:bg-background dark:text-muted-foreground dark:hover:bg-muted"}
          `}
        >
          <Link className="inline-block w-4 h-4 mr-2" />
          Custom link
        </button>
      </div>

      {/* Dropdown Mode */}
      {inputMode === "dropdown" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <FolderGit2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Select value={selectedFolderId} onValueChange={handleFolderChange} disabled={loading || !!error}>
                <SelectTrigger className="pl-9">
                  <SelectValue placeholder={
                    loading ? "Loading folders..." :
                    error ? "Error loading folders" :
                    folders.length === 0 ? "No folders found" :
                    "Select a folder..."
                  } />
                </SelectTrigger>
                <SelectContent>
                  {folders.length > 0 ? (
                    folders.map(folder => (
                      <SelectItem key={folder.id} value={folder.id}>
                        <div className="flex items-center">
                          <FolderGit2 className="h-4 w-4 mr-2 text-blue-500" />
                          <span>{folder.name}</span>
                          {folder.isRoot && <span className="ml-2 text-xs text-gray-500">(Root)</span>}
                        </div>
                      </SelectItem>
                    ))
                                  ) : (
                  <SelectItem value="no-folders" disabled>
                    {loading ? "Loading..." : error || "No folders available"}
                  </SelectItem>
                )}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={fetchFolders}
              disabled={loading}
              className="shrink-0"
              title="Refresh folders"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          {error && (
            <div className="text-sm text-red-600 mt-1">
              {error}
            </div>
          )}
          {!error && folders.length > 0 && (
            <div className="text-xs text-green-600 mt-1">
              Found {folders.length} folders in your Google Drive
            </div>
          )}
        </div>
      )}

      {/* Custom Link Mode */}
      {inputMode === "custom" && (
        <div className="space-y-2">
          <div className="relative flex-1">
            <Link className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="url"
              placeholder="https://drive.google.com/drive/folders/your-folder-id"
              className="pl-9"
              value={customLink}
              onChange={(e) => handleCustomLinkChange(e.target.value)}
            />
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 flex items-center gap-1">
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${
          localStorage.getItem('google_access_token') ? 'bg-green-500' : 'bg-amber-500'
        }`}></span>
        {localStorage.getItem('google_access_token') 
          ? "Connected to Google Drive - all your folders are available"
          : "Connect your Google Drive to see all your folders automatically"
        }
      </p>
    </div>
  );
} 