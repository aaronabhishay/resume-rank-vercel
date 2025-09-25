import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table';
import { FaTable, FaThLarge, FaClipboardList, FaCalendarAlt, FaTimesCircle, FaEnvelopeOpenText, FaCircle, FaSave, FaChevronUp, FaChevronDown, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import * as XLSX from "xlsx";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

// Status constants
const CANDIDATE_STATUS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  REJECTED: 'rejected'
};

const STATUS_COLORS = {
  [CANDIDATE_STATUS.NEW]: 'text-gray-400',
  [CANDIDATE_STATUS.CONTACTED]: 'text-black',
  [CANDIDATE_STATUS.REJECTED]: 'text-red-500'
};

const STATUS_LABELS = {
  [CANDIDATE_STATUS.NEW]: 'New',
  [CANDIDATE_STATUS.CONTACTED]: 'Contacted',
  [CANDIDATE_STATUS.REJECTED]: 'Rejected'
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

export default function ResultsTable({ 
  results, 
  jobTitle, 
  canSave = true,
  onCandidateSelect,
  selectedCandidates = [],
  onViewDetails,
  candidateStatuses = {},
  onStatusUpdate
}) {
  const [viewMode, setViewMode] = useState("table");
  const [showSummary, setShowSummary] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [pageSize, setPageSize] = useState(50);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 50,
  });

  // Extract results array from the response object
  const resultsArray = results?.results || [];

  // Column helper
  const columnHelper = createColumnHelper();

  // Define columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('analysis.candidateName', {
        id: 'candidateName',
        header: 'Candidate',
        cell: ({ row, getValue }) => {
          const candidate = row.original;
          const name = getValue() || candidate.fileName;
          return (
            <div className="text-sm font-medium text-foreground">
              {name}
            </div>
          );
        },
      }),
      columnHelper.accessor('analysis.email', {
        id: 'email',
        header: 'Email',
        cell: ({ getValue }) => {
          const email = getValue();
          return email && email !== 'No email found' ? (
            <div className="text-sm text-foreground">{email}</div>
          ) : (
            <div className="text-sm text-muted-foreground">No email</div>
          );
        },
      }),
      columnHelper.accessor('analysis.skillsMatch', {
        id: 'skillsMatch',
        header: 'Skills',
        cell: ({ getValue, row }) => {
          const candidate = row.original;
          if (candidate.error) return <div className="text-sm text-destructive">Error</div>;
          return <div className="text-sm text-foreground">{getValue()}/10</div>;
        },
      }),
      columnHelper.accessor('analysis.experienceRelevance', {
        id: 'experienceRelevance',
        header: 'Experience',
        cell: ({ getValue, row }) => {
          const candidate = row.original;
          if (candidate.error) return <div className="text-sm text-destructive">Error</div>;
          return <div className="text-sm text-foreground">{getValue()}/10</div>;
        },
      }),
      columnHelper.accessor('analysis.educationFit', {
        id: 'educationFit',
        header: 'Education',
        cell: ({ getValue, row }) => {
          const candidate = row.original;
          if (candidate.error) return <div className="text-sm text-destructive">Error</div>;
          return <div className="text-sm text-foreground">{getValue()}/10</div>;
        },
      }),
      columnHelper.accessor('analysis.projectImpact', {
        id: 'projectImpact',
        header: 'Projects',
        cell: ({ getValue, row }) => {
          const candidate = row.original;
          if (candidate.error) return <div className="text-sm text-destructive">Error</div>;
          return <div className="text-sm text-foreground">{getValue()}/10</div>;
        },
      }),
      columnHelper.accessor('analysis.totalScore', {
        id: 'totalScore',
        header: 'Overall',
        cell: ({ getValue, row }) => {
          const candidate = row.original;
          if (candidate.error) return <div className="text-sm text-destructive">Error</div>;
          return <div className="text-sm font-medium text-foreground">{getValue()}/100</div>;
        },
      }),
      columnHelper.accessor('status', {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const candidate = row.original;
          const status = candidateStatuses[candidate.fileName] || CANDIDATE_STATUS.NEW;
          return <StatusBadge status={status} />;
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const candidate = row.original;
          return (
            <Button
              onClick={() => onViewDetails(candidate)}
              variant="link"
              size="sm"
              className="text-primary"
            >
              View Details
            </Button>
          );
        },
      }),
    ],
    [candidateStatuses, onViewDetails]
  );

  // Table instance
  const table = useReactTable({
    data: resultsArray,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Handle candidate selection
  const handleCandidateSelect = (candidate) => {
    if (onCandidateSelect) {
      onCandidateSelect(candidate);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    const allCandidates = resultsArray.filter(candidate => !candidate.error);
    allCandidates.forEach(candidate => {
      if (!selectedCandidates.some(c => c.fileName === candidate.fileName)) {
        handleCandidateSelect(candidate);
      }
    });
  };

  // Handle deselect all
  const handleDeselectAll = () => {
    selectedCandidates.forEach(candidate => {
      handleCandidateSelect(candidate);
    });
  };

  // Export to XLSX
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

  // Generate summary
  const generateSummary = () => {
    if (!resultsArray || resultsArray.length === 0) return null;
    
    const validResults = resultsArray.filter(r => r.analysis);
    if (validResults.length === 0) return null;
    
    const topCandidate = validResults[0];
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

  if (results && results.error) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-medium text-red-600 mb-4">Error</h2>
        <p className="text-gray-800">{results.error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 relative bg-card rounded-2xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-foreground mb-2">{jobTitle || "Job Title"}</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Found {resultsArray.length} candidates
          {table.getPageCount() > 1 && ` (Page ${pagination.pageIndex + 1} of ${table.getPageCount()}, ${pagination.pageSize} per page)`}
        </p>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex rounded-md shadow-sm bg-muted/30">
            <Button
              onClick={() => setViewMode("table")}
              className={`rounded-l-md ${viewMode === "table" ? "bg-background text-foreground" : "bg-muted text-muted-foreground"}`}
              size="sm"
              variant={viewMode === "table" ? "glass" : "outline"}
            >
              <FaTable className="mr-2" />
              Table
            </Button>
            <Button
              onClick={() => setViewMode("cards")}
              className={`rounded-r-md ${viewMode === "cards" ? "bg-background text-foreground" : "bg-muted text-muted-foreground"}`}
              size="sm"
              variant={viewMode === "cards" ? "glass" : "outline"}
            >
              <FaThLarge className="mr-2" />
              Cards
            </Button>
          </div>

          {/* Summary Toggle */}
          <Button
            onClick={() => setShowSummary(!showSummary)}
            className="font-semibold"
            size="sm"
            variant="outline"
          >
            <FaClipboardList className="mr-2" />
            Summary
          </Button>
        </div>

        {/* Export Button */}
        <Button
          onClick={handleExportXLSX}
          className="font-semibold"
          size="sm"
          variant="glass"
        >
          <FaSave className="mr-2" />
          Export XLSX
        </Button>
      </div>

      {/* Global Filter and Page Size Controls */}
      <div className="mb-4 flex items-center gap-4">
        <Input
          placeholder="Search all columns..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Show:</label>
          <select
            value={pagination.pageSize}
            onChange={(e) => {
              const newPageSize = Number(e.target.value);
              setPageSize(newPageSize);
              setPagination(prev => ({
                ...prev,
                pageSize: newPageSize,
                pageIndex: 0, // Reset to first page when changing page size
              }));
            }}
            className="border border-border bg-background text-foreground rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={35}>35</option>
            <option value={50}>50</option>
          </select>
          <span className="text-sm text-muted-foreground">per page</span>
        </div>
      </div>

      {/* Summary Section */}
      {showSummary && summary && (
        <div className="mb-6 bg-muted/30 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">Analysis Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Top Candidate</h4>
              <p className="text-lg font-medium text-foreground">{summary.topCandidate}</p>
              <p className="text-sm text-muted-foreground">Score: {summary.topScore}/100</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Overall Statistics</h4>
              <p className="text-sm text-foreground">Average Score: {summary.averageScore}/100</p>
              <p className="text-sm text-foreground">Total Candidates: {summary.candidateCount}</p>
            </div>
            <div className="md:col-span-2">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Category Comparisons</h4>
              <div className="space-y-4">
                {summary.comparisons.map((comparison, index) => (
                  <div key={index} className="bg-background p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-foreground">{comparison.category}</span>
                      <span className="text-sm text-muted-foreground">
                        Top: {comparison.topScore}/10 | Avg: {comparison.avgScore}/10
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${(comparison.topScore / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {selectedCandidates.length > 0 && (
        <div className="mb-6 flex items-center space-x-4">
          <Button
            onClick={() => {/* Handle scheduling */}}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-900"
          >
            <FaCalendarAlt className="mr-2" />
            Schedule Interviews
          </Button>
          <Button
            onClick={() => {/* Handle rejection emails */}}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            <FaEnvelopeOpenText className="mr-2" />
            Send Rejection Emails
          </Button>
          <Button
            onClick={handleDeselectAll}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FaTimesCircle className="mr-2" />
            Clear Selection
          </Button>
        </div>
      )}

      {/* Table */}
      {viewMode === "table" && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-border bg-background">
            <table className="min-w-full divide-y divide-border bg-background text-foreground">
              <thead className="bg-muted/40">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={table.getIsAllRowsSelected()}
                        onChange={table.getToggleAllRowsSelectedHandler()}
                        className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                      />
                    </th>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/60"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center space-x-1">
                          <span>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          {header.column.getCanSort() && (
                            <span className="ml-1">
                              {header.column.getIsSorted() === 'asc' ? (
                                <FaChevronUp className="h-3 w-3" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <FaChevronDown className="h-3 w-3" />
                              ) : (
                                <span className="h-3 w-3" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row, index) => (
                  <tr 
                    key={row.id} 
                    className={row.original.error ? "bg-destructive/10" : index % 2 === 0 ? "bg-card" : "bg-muted/30"}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={row.getIsSelected()}
                        onChange={row.getToggleSelectedHandler()}
                        className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                      />
                    </td>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-muted-foreground">
              <span>
                Showing {pagination.pageIndex * pagination.pageSize + 1} to{' '}
                {Math.min(
                  (pagination.pageIndex + 1) * pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}{' '}
                of {table.getFilteredRowModel().rows.length} results
                {table.getFilteredRowModel().rows.length > pagination.pageSize && ` (${pagination.pageSize} per page)`}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                variant="outline"
                size="sm"
              >
                First
              </Button>
              <Button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                variant="outline"
                size="sm"
              >
                <FaChevronLeft className="h-3 w-3 mr-1" />
                Previous
              </Button>
              <Button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                variant="outline"
                size="sm"
              >
                Next
                <FaChevronRight className="h-3 w-3 ml-1" />
              </Button>
              <Button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                variant="outline"
                size="sm"
              >
                Last
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cards View (simplified for now) */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {table.getRowModel().rows.map((row) => {
            const candidate = row.original;
            return (
              <div
                key={row.id}
                className={`bg-card overflow-hidden rounded-lg ${candidate.error ? "border border-destructive/50" : ""}`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-foreground">
                        {candidate.analysis?.candidateName || candidate.fileName}
                      </h3>
                      <StatusBadge status={candidateStatuses[candidate.fileName] || CANDIDATE_STATUS.NEW} />
                    </div>
                    <input
                      type="checkbox"
                      checked={row.getIsSelected()}
                      onChange={row.getToggleSelectedHandler()}
                      className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    />
                  </div>
                  {candidate.error ? (
                    <div className="mt-4 text-sm text-destructive">{candidate.error}</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="pt-4 border-t border-border">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-foreground">Overall Score</span>
                          <span className="text-lg font-bold text-primary">{candidate.analysis.totalScore}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-muted/30 px-6 py-3">
                  <Button
                    onClick={() => onViewDetails(candidate)}
                    variant="link"
                    size="sm"
                    className="text-primary"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
