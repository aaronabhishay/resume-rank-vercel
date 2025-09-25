import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

/**
 * Processing Monitor Dashboard Component
 * Real-time monitoring of resume processing system
 * Shows queue status, processing statistics, and performance metrics
 */

const ProcessingMonitor = () => {
  const [status, setStatus] = useState({
    queues: { urgent: 0, high: 0, normal: 0, low: 0 },
    processing: 0,
    completed: 0,
    failed: 0,
    statistics: {
      totalQueued: 0,
      totalProcessed: 0,
      totalCompleted: 0,
      totalFailed: 0,
      averageProcessingTime: 0,
      queueThroughput: 0,
      lastReset: new Date().toISOString()
    }
  });

  const [apiUsage, setApiUsage] = useState({
    requestsToday: 0,
    requestsThisMinute: 0,
    dailyLimit: 200,
    minuteLimit: 15,
    utilizationRate: 0
  });

  const [batchStats, setBatchStats] = useState({
    averageBatchSize: 0,
    tokenUtilization: 0,
    processingSpeed: 0,
    successRate: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [systemHealth, setSystemHealth] = useState('healthy');
  const [alerts, setAlerts] = useState([]);

  const wsRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Initialize monitoring
    initializeMonitoring();
    
    // Set up real-time updates
    startRealTimeUpdates();
    
    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const initializeMonitoring = async () => {
    try {
      // Fetch initial status
      await Promise.all([
        fetchQueueStatus(),
        fetchApiUsage(),
        fetchBatchStats(),
        fetchRecentActivity()
      ]);
    } catch (error) {
      console.error('Failed to initialize monitoring:', error);
      addAlert('Failed to initialize monitoring system', 'error');
    }
  };

  const startRealTimeUpdates = () => {
    // Poll for updates every 5 seconds
    intervalRef.current = setInterval(() => {
      fetchQueueStatus();
      fetchApiUsage();
      fetchBatchStats();
    }, 5000);

    // Try to establish WebSocket connection for real-time updates
    try {
      const wsUrl = `ws://${window.location.host}/ws/monitoring`;
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleRealtimeUpdate(data);
      };
      
      wsRef.current.onerror = () => {
        console.log('WebSocket not available, using polling updates');
      };
    } catch (error) {
      console.log('WebSocket not available, using polling updates');
    }
  };

  const fetchQueueStatus = async () => {
    try {
      const response = await fetch('/api/monitoring/queue-status');
      const data = await response.json();
      setStatus(data);
      
      // Check for system health issues
      assessSystemHealth(data);
    } catch (error) {
      console.error('Failed to fetch queue status:', error);
    }
  };

  const fetchApiUsage = async () => {
    try {
      const response = await fetch('/api/monitoring/api-usage');
      const data = await response.json();
      setApiUsage(data);
      
      // Check for rate limit issues
      checkRateLimits(data);
    } catch (error) {
      console.error('Failed to fetch API usage:', error);
    }
  };

  const fetchBatchStats = async () => {
    try {
      const response = await fetch('/api/monitoring/batch-stats');
      const data = await response.json();
      setBatchStats(data);
    } catch (error) {
      console.error('Failed to fetch batch stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/monitoring/recent-activity');
      const data = await response.json();
      setRecentActivity(data.slice(0, 10)); // Show last 10 activities
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
    }
  };

  const handleRealtimeUpdate = (data) => {
    switch (data.type) {
      case 'queue_update':
        setStatus(prev => ({ ...prev, ...data.payload }));
        break;
      case 'api_usage_update':
        setApiUsage(prev => ({ ...prev, ...data.payload }));
        break;
      case 'batch_completed':
        addRecentActivity(data.payload);
        break;
      case 'alert':
        addAlert(data.payload.message, data.payload.severity);
        break;
      default:
        console.log('Unknown update type:', data.type);
    }
  };

  const assessSystemHealth = (statusData) => {
    let health = 'healthy';
    const issues = [];

    // Check queue size
    const totalQueued = Object.values(statusData.queues).reduce((sum, count) => sum + count, 0);
    if (totalQueued > 500) {
      health = 'warning';
      issues.push('High queue volume');
    }

    // Check processing failures
    const failureRate = statusData.statistics.totalProcessed > 0 
      ? statusData.statistics.totalFailed / statusData.statistics.totalProcessed 
      : 0;
    
    if (failureRate > 0.1) {
      health = 'critical';
      issues.push('High failure rate');
    }

    // Check processing speed
    if (statusData.statistics.queueThroughput < 10) {
      health = 'warning';
      issues.push('Low throughput');
    }

    setSystemHealth(health);
    
    if (issues.length > 0) {
      addAlert(`System issues detected: ${issues.join(', ')}`, health === 'critical' ? 'error' : 'warning');
    }
  };

  const checkRateLimits = (usageData) => {
    const dailyUsage = (usageData.requestsToday / usageData.dailyLimit) * 100;
    const minuteUsage = (usageData.requestsThisMinute / usageData.minuteLimit) * 100;

    if (dailyUsage > 90) {
      addAlert('Daily API limit nearly reached', 'warning');
    }

    if (minuteUsage > 80) {
      addAlert('Rate limit threshold exceeded', 'error');
    }
  };

  const addAlert = (message, severity = 'info') => {
    const alert = {
      id: Date.now(),
      message,
      severity,
      timestamp: new Date().toISOString()
    };

    setAlerts(prev => [alert, ...prev.slice(0, 4)]); // Keep last 5 alerts

    // Auto-remove alerts after 10 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== alert.id));
    }, 10000);
  };

  const addRecentActivity = (activity) => {
    setRecentActivity(prev => [activity, ...prev.slice(0, 9)]);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getHealthColor = (health) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'error': return 'border-red-500 bg-red-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      case 'info': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Processing Monitor</h1>
        <div className="flex items-center space-x-4">
          <Badge className={getHealthColor(systemHealth)}>
            System {systemHealth}
          </Badge>
          <div className="text-sm text-gray-500">
            Last updated: {formatTime(new Date().toISOString())}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`p-3 border rounded-lg ${getAlertColor(alert.severity)}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{alert.message}</span>
                <span className="text-xs text-gray-500">
                  {formatTime(alert.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Queue Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Queue Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(status.queues).map(([priority, count]) => (
                <div key={priority} className="flex justify-between">
                  <span className="capitalize text-sm">{priority}:</span>
                  <Badge variant={count > 0 ? 'default' : 'secondary'}>
                    {count}
                  </Badge>
                </div>
              ))}
              <div className="pt-2 border-t">
                <div className="flex justify-between font-medium">
                  <span>Processing:</span>
                  <Badge variant="default">{status.processing}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Usage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">API Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm">
                  <span>Daily Usage</span>
                  <span>{apiUsage.requestsToday}/{apiUsage.dailyLimit}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(apiUsage.requestsToday / apiUsage.dailyLimit) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Rate Limit</span>
                  <span>{apiUsage.requestsThisMinute}/{apiUsage.minuteLimit}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${(apiUsage.requestsThisMinute / apiUsage.minuteLimit) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Batch Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Batch Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Avg Batch Size:</span>
                <span>{batchStats.averageBatchSize.toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Token Utilization:</span>
                <span>{batchStats.tokenUtilization.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Success Rate:</span>
                <span>{(batchStats.successRate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Speed:</span>
                <span>{batchStats.processingSpeed}/hr</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Statistics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">System Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Processed:</span>
                <span>{status.statistics.totalProcessed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Completed:</span>
                <span className="text-green-600">{status.statistics.totalCompleted}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Failed:</span>
                <span className="text-red-600">{status.statistics.totalFailed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Avg Time:</span>
                <span>{formatDuration(status.statistics.averageProcessingTime)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Views */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium text-sm">{activity.message}</div>
                      <div className="text-xs text-gray-500">{activity.details}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTime(activity.timestamp)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No recent activity
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Processing Throughput Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Processing Throughput</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Current Rate:</span>
                <Badge className="text-lg">
                  {status.statistics.queueThroughput} resumes/hour
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Daily Target (1000):</span>
                  <span>{((status.statistics.queueThroughput * 24 / 1000) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full"
                    style={{ width: `${Math.min((status.statistics.queueThroughput * 24 / 1000) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(status.statistics.queueThroughput * 24)}
                  </div>
                  <div className="text-sm text-gray-500">Projected Daily</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round((1000 / (status.statistics.queueThroughput || 1)) * 100) / 100}
                  </div>
                  <div className="text-sm text-gray-500">Hours to 1000</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={() => window.location.href = '/api/monitoring/export-stats'}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Export Statistics
        </button>
        <button
          onClick={() => {
            if (confirm('Are you sure you want to reset all statistics?')) {
              fetch('/api/monitoring/reset-stats', { method: 'POST' });
            }
          }}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Reset Statistics
        </button>
        <button
          onClick={() => window.location.href = '/dashboard/queue-details'}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          View Queue Details
        </button>
      </div>
    </div>
  );
};

export default ProcessingMonitor;
