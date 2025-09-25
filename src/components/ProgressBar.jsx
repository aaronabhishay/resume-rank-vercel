import React from 'react';

export default function ProgressBar({ 
  current = 0, 
  total = 0, 
  isVisible = false, 
  currentBatch = 0, 
  totalBatches = 0,
  currentResume = "",
  status = "Processing resumes..."
}) {
  if (!isVisible || total === 0) return null;

  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const batchProgress = totalBatches > 0 ? Math.round((currentBatch / totalBatches) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Analyzing Resumes
          </h3>
          <p className="text-sm text-muted-foreground">
            {status}
          </p>
        </div>

        {/* Main Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-foreground">
              Overall Progress
            </span>
            <span className="text-sm text-muted-foreground">
              {current} / {total} ({percentage}%)
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Batch Progress */}
        {totalBatches > 1 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground">
                Batch Progress
              </span>
              <span className="text-sm text-muted-foreground">
                {currentBatch} / {totalBatches} batches
              </span>
            </div>
            <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${batchProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Current Resume */}
        {currentResume && (
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="truncate">
                Currently processing: {currentResume}
              </span>
            </div>
          </div>
        )}

        {/* Processing Animation */}
        <div className="flex justify-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
