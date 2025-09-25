import React, { useState, useEffect } from "react";
import { FaTable, FaThLarge, FaClipboardList, FaCalendarAlt, FaTimesCircle, FaEnvelopeOpenText, FaCircle, FaSave } from 'react-icons/fa';
import * as XLSX from "xlsx";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import ResultsTable from "./ResultsTable";

// Add status constants
const CANDIDATE_STATUS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  REJECTED: 'rejected'
};

// Add status colors
const STATUS_COLORS = {
  [CANDIDATE_STATUS.NEW]: 'text-gray-400',
  [CANDIDATE_STATUS.CONTACTED]: 'text-black',
  [CANDIDATE_STATUS.REJECTED]: 'text-red-500'
};

// Add status labels
const STATUS_LABELS = {
  [CANDIDATE_STATUS.NEW]: 'New',
  [CANDIDATE_STATUS.CONTACTED]: 'Contacted',
  [CANDIDATE_STATUS.REJECTED]: 'Rejected'
};

// Scheduling Modal Component
function SchedulingModal({ isOpen, onClose, selectedCandidates, onSchedule, fields, setFields }) {
  const handleChange = (key, value) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSchedule({
      ...fields,
      candidates: selectedCandidates
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-2xl p-8 max-w-lg w-full shadow-xl text-foreground">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Schedule Individual Interviews</h2>
            <p className="text-muted-foreground text-sm mt-1">Set up interviews with selected candidates.</p>
          </div>
          <Button onClick={onClose} variant="ghost" size="icon" className="text-muted-foreground text-2xl leading-none">&times;</Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Interview Title</label>
            <Input
              type="text"
              value={fields.interviewTitle}
              onChange={e => handleChange('interviewTitle', e.target.value)}
              className="w-full border border-border bg-background text-foreground focus-visible:ring-primary focus-visible:border-primary rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Interview Description</label>
            <Textarea
              value={fields.interviewDescription}
              onChange={e => handleChange('interviewDescription', e.target.value)}
              className="w-full border border-border bg-background text-foreground focus-visible:ring-primary focus-visible:border-primary rounded-lg px-3 py-2"
              rows="2"
              placeholder="Add any additional details about the interview..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Interviewer Name</label>
              <Input
                type="text"
                value={fields.interviewerName}
                onChange={e => handleChange('interviewerName', e.target.value)}
                className="w-full border border-border bg-background text-foreground focus-visible:ring-primary focus-visible:border-primary rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Interviewer Email</label>
              <Input
                type="email"
                value={fields.interviewerEmail}
                onChange={e => handleChange('interviewerEmail', e.target.value)}
                className="w-full border border-border bg-background text-foreground focus-visible:ring-primary focus-visible:border-primary rounded-lg px-3 py-2"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Start Date</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </span>
                <Input
                  type="datetime-local"
                  value={fields.startDate}
                  onChange={e => handleChange('startDate', e.target.value)}
                  className="w-full border border-border bg-background text-foreground focus-visible:ring-primary focus-visible:border-primary rounded-lg px-10 py-2 placeholder-muted-foreground"
                  placeholder="Select date and time"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">End Date</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </span>
                <Input
                  type="datetime-local"
                  value={fields.endDate}
                  onChange={e => handleChange('endDate', e.target.value)}
                  className="w-full border border-border bg-background text-foreground focus-visible:ring-primary focus-visible:border-primary rounded-lg px-10 py-2 placeholder-muted-foreground"
                  placeholder="Select date and time"
                  required
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Interview Duration (minutes)</label>
            <select
              value={fields.duration}
              onChange={e => handleChange('duration', Number(e.target.value))}
              className="w-full border border-border bg-background text-foreground focus-visible:ring-primary focus-visible:border-primary rounded-lg px-3 py-2"
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Selected Candidates ({selectedCandidates.length}):</label>
            <ul className="list-disc list-inside text-foreground text-base mt-1">
              {selectedCandidates.map((candidate, index) => (
                <li key={index}>{candidate.fileName}</li>
              ))}
            </ul>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="premium"
              size="sm"
            >
              Schedule Individual Interviews
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper to format ISO string to local datetime-local input value
function formatLocalForInput(dateString) {
  const date = new Date(dateString);
  const pad = n => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Calendar Review Table Modal Component
function CalendarReviewTableModal({ isOpen, onClose, events, setEvents, onAddAll, loading }) {
  if (!isOpen) return null;

  const handleTimeChange = (index, field, value) => {
    const updatedEvents = [...events];
    updatedEvents[index][field] = new Date(value).toISOString();
    updatedEvents[index][field + 'Local'] = new Date(value).toLocaleString();
    setEvents(updatedEvents);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto text-foreground shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-foreground">Review & Edit Calendar Events</h2>
          <Button onClick={onClose} variant="ghost" size="icon" className="text-muted-foreground">&times;</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border mb-4 bg-background rounded-lg">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-primary uppercase tracking-wider">Candidate</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-primary uppercase tracking-wider">Start Time</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-primary uppercase tracking-wider">End Time</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, idx) => (
                <tr key={event.fileName} className="border-b border-border last:border-0">
                  <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">{event.candidateName || event.fileName}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <Input
                      type="datetime-local"
                      value={event.startTime ? formatLocalForInput(event.startTime) : ''}
                      onChange={e => handleTimeChange(idx, 'startTime', e.target.value)}
                      className="border border-border bg-background text-foreground focus-visible:ring-primary focus-visible:border-primary rounded-lg p-1"
                    />
                    <div className="text-xs text-muted-foreground mt-1">{event.startTimeLocal}</div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <Input
                      type="datetime-local"
                      value={event.endTime ? formatLocalForInput(event.endTime) : ''}
                      onChange={e => handleTimeChange(idx, 'endTime', e.target.value)}
                      className="border border-border bg-background text-foreground focus-visible:ring-primary focus-visible:border-primary rounded-lg p-1"
                    />
                    <div className="text-xs text-muted-foreground mt-1">{event.endTimeLocal}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
          >
            Close
          </Button>
          <Button
            onClick={onAddAll}
            variant="premium"
            size="sm"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add All Events to Calendar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Rejection Emails Modal Component
function RejectionEmailsModal({ isOpen, onClose, unselectedCandidates, onStatusUpdate }) {
  const [mailBody, setMailBody] = useState("");

  // Generate the default sample rejection email
  const sampleBody = `Dear Candidate,\n\nThank you for your interest in the position and for taking the time to apply. We appreciate the effort you put into your application.\n\nAfter careful consideration of your application and the current requirements of the role, we regret to inform you that we have decided to move forward with other candidates whose qualifications more closely match our current needs.\n\nWe were impressed with your background and experience, and we encourage you to apply for future positions that match your skills and interests.\n\nWe wish you the best in your job search and future professional endeavors.\n\nBest regards,\nThe Hiring Team`;

  // Reset mailBody to sampleBody every time the modal is opened
  React.useEffect(() => {
    if (isOpen) setMailBody(sampleBody);
  }, [isOpen]);

  // Get all valid email addresses
  const validCandidates = unselectedCandidates
    .map(candidate => candidate.analysis?.email)
    .filter(email => email && email !== 'No email found');

  const handleOpenGmail = () => {
    if (validCandidates.length === 0) return;
    const recipients = validCandidates.join(',');
    const subject = "Application Status Update";
    const mailtoLink = `https://mail.google.com/mail/?view=cm&fs=1&to=&bcc=${encodeURIComponent(recipients)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(mailBody)}`;
    window.open(mailtoLink, '_blank');
    
    // Update statuses for rejected candidates
    onStatusUpdate(unselectedCandidates);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Rejection Email</h2>
          <div className="flex items-center gap-4">
            {validCandidates.length > 0 && (
              <button
                onClick={handleOpenGmail}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                Open in Gmail
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        {validCandidates.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-600">No valid email addresses found for unselected candidates.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                Edit the rejection email below. When ready, click "Open in Gmail" to send to all unselected candidates.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Body</label>
              <Textarea
                value={mailBody}
                onChange={e => setMailBody(e.target.value)}
                rows={12}
                className="w-full p-3 border rounded font-mono text-sm"
              />
            </div>
          </div>
        )}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResultsDisplay({ results, jobTitle, canSave = true }) {
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [calendarLinks, setCalendarLinks] = useState([]);
  const [showRejectionEmails, setShowRejectionEmails] = useState(false);
  const [loadingAddAll, setLoadingAddAll] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [candidateStatuses, setCandidateStatuses] = useState({});
  const [numCandidatesToSelect, setNumCandidatesToSelect] = useState("");
  // Save Results Modal State
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveJobTitle, setSaveJobTitle] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Scheduling modal fields state (lifted up)
  const [schedulingFields, setSchedulingFields] = useState({
    startDate: "",
    endDate: "",
    duration: 30,
    interviewerName: "",
    interviewerEmail: "",
    interviewTitle: "Technical Interview",
    interviewDescription: ""
  });
  
  // Extract results array from the response object
  const resultsArray = results?.results || [];
  
  // Check if results is an error object
  if (results && results.error) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-medium text-red-600 mb-4">Error</h2>
        <p className="text-gray-800">{results.error}</p>
      </div>
    );
  }
  
  // Generate comparative summary
  const generateSummary = () => {
    if (!resultsArray || resultsArray.length === 0) return null;
    
    // Filter out error results
    const validResults = resultsArray.filter(r => r.analysis);
    
    if (validResults.length === 0) return null;
    
    // Find top candidate
    const topCandidate = validResults[0]; // Already sorted by totalScore
    
    // Find average scores
    const avgSkills = validResults.reduce((sum, r) => sum + r.analysis.skillsMatch, 0) / validResults.length;
    const avgExperience = validResults.reduce((sum, r) => sum + r.analysis.experienceRelevance, 0) / validResults.length;
    const avgEducation = validResults.reduce((sum, r) => sum + r.analysis.educationFit, 0) / validResults.length;
    const avgProject = validResults.reduce((sum, r) => sum + r.analysis.projectImpact, 0) / validResults.length;
    const avgTotal = validResults.reduce((sum, r) => sum + r.analysis.totalScore, 0) / validResults.length;
    
    return {
      topCandidate: topCandidate.fileName,
      topScore: topCandidate.analysis.totalScore,
      averageScore: avgTotal.toFixed(1),
      candidateCount: validResults.length,
      topStrengths: topCandidate.analysis.keyStrengths,
      comparisons: [
        {
          category: "Skills Match",
          topScore: topCandidate.analysis.skillsMatch,
          avgScore: avgSkills.toFixed(1),
        },
        {
          category: "Experience",
          topScore: topCandidate.analysis.experienceRelevance,
          avgScore: avgExperience.toFixed(1),
        },
        {
          category: "Education",
          topScore: topCandidate.analysis.educationFit,
          avgScore: avgEducation.toFixed(1),
        },
        {
          category: "Project Impact",
          topScore: topCandidate.analysis.projectImpact,
          avgScore: avgProject.toFixed(1),
        }
      ]
    };
  };
  
  const summary = generateSummary();
  
  const handleCandidateSelect = (candidate) => {
    setSelectedCandidates(prev => {
      const isSelected = prev.some(c => c.fileName === candidate.fileName);
      if (isSelected) {
        return prev.filter(c => c.fileName !== candidate.fileName);
      } else {
        return [...prev, candidate];
      }
    });
  };

  const handleViewDetails = (candidate) => {
    setSelectedCandidate(candidate);
    setShowDetailsModal(true);
  };

  const handleSchedule = async (scheduleData) => {
    try {
      const { startDate, endDate, duration, candidates } = scheduleData;
      const startTime = new Date(startDate);
      const endTime = new Date(endDate);
      const interviewDuration = duration * 60 * 1000;
      const numInterviews = Math.floor((endTime - startTime) / interviewDuration);

      if (numInterviews < candidates.length) {
        alert(`Not enough time slots for all candidates. You have ${candidates.length} candidates but only ${numInterviews} time slots available.`);
        return;
      }

      // Create calendar events for each candidate
      const events = candidates.map((candidate, index) => {
        const interviewStart = new Date(startTime.getTime() + (index * interviewDuration));
        const interviewEnd = new Date(interviewStart.getTime() + interviewDuration);
        const candidateName = candidate.analysis?.candidateName || candidate.fileName;
        return {
          title: `${scheduleData.interviewTitle} with ${candidateName}`,
          description: `${scheduleData.interviewDescription}\n\nInterviewer: ${scheduleData.interviewerName} (${scheduleData.interviewerEmail})\nCandidate: ${candidateName}`,
          startTime: interviewStart.toISOString(),
          endTime: interviewEnd.toISOString(),
          startTimeLocal: interviewStart.toLocaleString(),
          endTimeLocal: interviewEnd.toLocaleString(),
          attendees: [
            scheduleData.interviewerEmail,
            candidate.analysis?.email
          ].filter(email => email && email !== 'No email found'),
          fileName: candidate.fileName,
          candidateName
        };
      });

      setCalendarLinks(events);
      setShowSchedulingModal(false);
      setShowReviewModal(true);
    } catch (error) {
      console.error('Error creating calendar events:', error);
      alert('Error creating calendar events. Please try again.');
    }
  };

  const handleDeselectAll = () => {
    setSelectedCandidates([]);
  };

  const handleSendRejectionEmails = () => {
    const unselectedCandidates = resultsArray.filter(
      candidate => !selectedCandidates.some(selected => selected.fileName === candidate.fileName)
    );
    setShowRejectionEmails(true);
  };

  const handleRejectionStatusUpdate = (rejectedCandidates) => {
    const newStatuses = { ...candidateStatuses };
    rejectedCandidates.forEach(candidate => {
      newStatuses[candidate.fileName] = CANDIDATE_STATUS.REJECTED;
    });
    setCandidateStatuses(newStatuses);
  };

  // Add handler for Add All Events
  const handleAddAllEvents = async () => {
    setLoadingAddAll(true);
    try {
      // First create the calendar events
      const calendarResponse = await fetch('/api/n8n/create-calendar-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: calendarLinks }),
      });
      
      if (!calendarResponse.ok) {
        throw new Error('Failed to create calendar events');
      }

      // Send email notifications to all attendees
      const emailPromises = calendarLinks.map(event => {
        const recipients = event.attendees.filter(email => email && email !== 'No email found');
        if (recipients.length === 0) return Promise.resolve();

        const subject = `Calendar Invitation: ${event.title}`;
        const body = `
Dear ${event.candidateName || 'Candidate'},

Your interview has been scheduled:

Title: ${event.title}
Date: ${new Date(event.startTime).toLocaleDateString()}
Time: ${new Date(event.startTime).toLocaleTimeString()} - ${new Date(event.endTime).toLocaleTimeString()}
Description: ${event.description}

A calendar invitation has been sent to your email address. Please accept the invitation to confirm your attendance.

Best regards,
The Hiring Team
        `;

        return fetch('/api/n8n/send-rejection-emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ recipients, subject, body }),
        });
      });

      await Promise.all(emailPromises);
      
      // Update candidate statuses after successful calendar event creation
      const newStatuses = { ...candidateStatuses };
      calendarLinks.forEach(event => {
        newStatuses[event.fileName] = CANDIDATE_STATUS.CONTACTED;
      });
      setCandidateStatuses(newStatuses);
      
      setShowReviewModal(false);
      setCalendarLinks([]);
      alert('All events added to calendar and notifications sent!');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to add events to calendar or send notifications.');
    } finally {
      setLoadingAddAll(false);
    }
  };

  // Get status for a candidate
  const getCandidateStatus = (candidate) => {
    return candidateStatuses[candidate.fileName] || CANDIDATE_STATUS.NEW;
  };

  // Status badge component
  const StatusBadge = ({ status }) => (
    <div className="flex items-center space-x-1">
      <FaCircle className={`h-2 w-2 ${STATUS_COLORS[status]}`} />
      <span className={`text-xs font-medium ${STATUS_COLORS[status]}`}>
        {STATUS_LABELS[status]}
      </span>
    </div>
  );


  const handleSelectTopCandidates = () => {
    const num = parseInt(numCandidatesToSelect);
    if (isNaN(num) || num <= 0) return;
    
    const topCandidates = resultsArray
      .filter(candidate => !candidate.error)
      .slice(0, num);
    
    setSelectedCandidates(topCandidates);
    setNumCandidatesToSelect(""); // Clear the input after selection
  };

  // Export to XLSX handler
  const handleExportXLSX = () => {
    const exportData = resultsArray.map((candidate, idx) => ({
      "#": idx + 1,
      "Candidate": candidate.analysis?.candidateName || candidate.fileName,
      "Email": candidate.analysis?.email || "",
      "Skills": candidate.analysis?.skillsMatch ?? "",
      "Experience": candidate.analysis?.experienceRelevance ?? "",
      "Education": candidate.analysis?.educationFit ?? "",
      "Projects": candidate.analysis?.projectImpact ?? "",
      "Overall": candidate.analysis?.totalScore ?? "",
      "Key Strengths": candidate.analysis?.keyStrengths?.join("; ") ?? "",
      "Areas for Improvement": candidate.analysis?.areasForImprovement?.join("; ") ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Candidates");
    XLSX.writeFile(wb, "candidates.xlsx");
  };

  return (
    <div className="p-6 relative bg-card rounded-2xl">
      {/* Job Title Header and Save Button */}
      {canSave && (
        <Button
          className="absolute top-0 right-0 mt-4 mr-4 z-10"
          onClick={() => setShowSaveModal(true)}
          size="sm"
        >
          <FaSave className="mr-2" />
          Save Results
        </Button>
      )}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-foreground mb-2">{jobTitle || "Job Title"}</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Found {resultsArray.length} candidates
        </p>
      </div>

      {/* Select Top Candidates Input */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="1"
            max={resultsArray.length}
            value={numCandidatesToSelect}
            onChange={(e) => setNumCandidatesToSelect(e.target.value)}
            placeholder="Number of top candidates"
            className="w-48 border border-border bg-background text-foreground focus-visible:ring-primary focus-visible:border-primary rounded-md"
          />
          <Button
            onClick={handleSelectTopCandidates}
            className="font-semibold"
            size="sm"
            variant="glass"
          >
            Select Top Candidates
          </Button>
        </div>
      </div>


      {/* Action Buttons */}
      {selectedCandidates.length > 0 && (
        <div className="mb-6 flex items-center space-x-4">
          <Button
            onClick={() => setShowSchedulingModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-900"
          >
            <FaCalendarAlt className="mr-2" />
            Schedule Interviews
          </Button>
          <Button
            onClick={() => setShowRejectionEmails(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            <FaEnvelopeOpenText className="mr-2" />
            Send Rejection Emails
          </Button>
          <Button
            onClick={() => setSelectedCandidates([])}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FaTimesCircle className="mr-2" />
            Clear Selection
          </Button>
        </div>
      )}

      {/* Results Display using TanStack Table */}
      <ResultsTable
        results={results}
        jobTitle={jobTitle}
        canSave={canSave}
        onCandidateSelect={handleCandidateSelect}
        selectedCandidates={selectedCandidates}
        onViewDetails={handleViewDetails}
        candidateStatuses={candidateStatuses}
        onStatusUpdate={handleRejectionStatusUpdate}
      />

      {/* Candidate Details Modal */}
      {showDetailsModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto text-foreground">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Candidate Details</h2>
              <Button
                onClick={() => setShowDetailsModal(false)}
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">Profile</h3>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Name:</span> {selectedCandidate.analysis?.candidateName || selectedCandidate.fileName}
                  </p>
                  {selectedCandidate.analysis?.email && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Email:</span> {selectedCandidate.analysis.email}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">Key Strengths</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {selectedCandidate.analysis?.keyStrengths.map((strength, i) => (
                    <li key={i}>{strength}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">Areas for Improvement</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {selectedCandidate.analysis?.areasForImprovement.map((area, i) => (
                    <li key={i}>{area}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">Detailed Analysis</h3>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {selectedCandidate.analysis?.analysis}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showSchedulingModal && (
        <SchedulingModal
          isOpen={showSchedulingModal}
          onClose={() => setShowSchedulingModal(false)}
          selectedCandidates={selectedCandidates}
          onSchedule={handleSchedule}
          fields={schedulingFields}
          setFields={setSchedulingFields}
        />
      )}
      {showReviewModal && (
        <CalendarReviewTableModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          events={calendarLinks}
          setEvents={setCalendarLinks}
          onAddAll={handleAddAllEvents}
          loading={loadingAddAll}
        />
      )}
      {showRejectionEmails && (
        <RejectionEmailsModal
          isOpen={showRejectionEmails}
          onClose={() => setShowRejectionEmails(false)}
          unselectedCandidates={resultsArray.filter(
            candidate => !selectedCandidates.some(selected => selected.fileName === candidate.fileName)
          )}
          onStatusUpdate={handleRejectionStatusUpdate}
        />
      )}

      {/* Save Results Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Save Results</h2>
              <button onClick={() => setShowSaveModal(false)} className="text-gray-500 hover:text-gray-700">&times;</button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Job Title</label>
              <Input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={saveJobTitle}
                onChange={e => setSaveJobTitle(e.target.value)}
                placeholder="Enter a job title for these results"
              />
            </div>
            {saveError && <div className="text-red-600 text-sm mb-2">{saveError}</div>}
            {saveSuccess && <div className="text-green-600 text-sm mb-2">Results saved successfully!</div>}
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                onClick={() => setShowSaveModal(false)}
                disabled={saveLoading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={async () => {
                  setSaveLoading(true);
                  setSaveError("");
                  setSaveSuccess(false);
                  try {
                    const response = await fetch("/api/save-job", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ jobTitle: saveJobTitle, results }),
                    });
                    const data = await response.json();
                    if (data.success) {
                      setSaveSuccess(true);
                      setTimeout(() => {
                        setShowSaveModal(false);
                        setSaveSuccess(false);
                        setSaveJobTitle("");
                      }, 1200);
                    } else {
                      setSaveError(data.error || "Failed to save results");
                    }
                  } catch (err) {
                    setSaveError("Failed to save results");
                  } finally {
                    setSaveLoading(false);
                  }
                }}
                disabled={saveLoading || !saveJobTitle}
              >
                {saveLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 