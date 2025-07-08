import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import GlobalHeader from 'components/ui/GlobalHeader';
import BreadcrumbTrail from 'components/ui/BreadcrumbTrail';
import Icon from 'components/AppIcon';
import MetricsCard from './components/MetricsCard';
import FilterControls from './components/FilterControls';
import ProcessingJobsTable from './components/ProcessingJobsTable';
import ExportModal from './components/ExportModal';

const AnalysisDashboard = () => {
  const [dateRange, setDateRange] = useState('30days');
  const [documentType, setDocumentType] = useState('all');
  const [practiceArea, setPracticeArea] = useState('all');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedChart, setSelectedChart] = useState('volume');

  // Mock data for metrics
  const metricsData = [
    {
      id: 'total-docs',
      title: 'Total Documents Analyzed',
      value: '2,847',
      change: '+12.5%',
      trend: 'up',
      icon: 'FileText',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'avg-processing',
      title: 'Avg Processing Time',
      value: '2.3 min',
      change: '-8.2%',
      trend: 'down',
      icon: 'Clock',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'accuracy-rate',
      title: 'Analysis Accuracy',
      value: '94.7%',
      change: '+2.1%',
      trend: 'up',
      icon: 'Target',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'cost-savings',
      title: 'Cost Savings',
      value: '$45,230',
      change: '+18.9%',
      trend: 'up',
      icon: 'DollarSign',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    }
  ];

  // Mock data for document type distribution
  const documentTypeData = [
    { name: 'Contracts', value: 35, count: 996 },
    { name: 'Legal Briefs', value: 28, count: 797 },
    { name: 'Case Files', value: 22, count: 626 },
    { name: 'Regulatory', value: 15, count: 427 }
  ];

  // Mock data for processing volume over time
  const volumeData = [
    { date: '2024-01-01', documents: 45, accuracy: 92.1 },
    { date: '2024-01-02', documents: 52, accuracy: 93.4 },
    { date: '2024-01-03', documents: 38, accuracy: 94.2 },
    { date: '2024-01-04', documents: 67, accuracy: 93.8 },
    { date: '2024-01-05', documents: 71, accuracy: 95.1 },
    { date: '2024-01-06', documents: 43, accuracy: 94.7 },
    { date: '2024-01-07', documents: 58, accuracy: 96.2 }
  ];

  // Mock data for accuracy by category
  const accuracyData = [
    { category: 'Contract Analysis', accuracy: 96.2, processed: 1245 },
    { category: 'Entity Extraction', accuracy: 94.8, processed: 2847 },
    { category: 'Date Recognition', accuracy: 98.1, processed: 2654 },
    { category: 'Clause Detection', accuracy: 92.3, processed: 1876 },
    { category: 'Risk Assessment', accuracy: 89.7, processed: 987 }
  ];

  const COLORS = ['#1E3A8A', '#64748B', '#F59E0B', '#10B981', '#DC2626'];

  const handleExport = (format, options) => {
    console.log('Exporting report:', format, options);
    // Mock export functionality
    setIsExportModalOpen(false);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <BreadcrumbTrail />
          
          {/* Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">Analysis Dashboard</h1>
              <p className="text-text-secondary">
                Comprehensive insights into document processing workflows and analysis results
              </p>
            </div>
            
            <div className="flex items-center space-x-4 mt-4 lg:mt-0">
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Icon name="Download" size={16} />
                <span>Export Report</span>
              </button>
              
              <button className="flex items-center space-x-2 px-4 py-2 border border-border-medium text-text-primary rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <Icon name="Settings" size={16} />
                <span>Configure</span>
              </button>
            </div>
          </div>

          {/* Filter Controls */}
          <FilterControls
            dateRange={dateRange}
            setDateRange={setDateRange}
            documentType={documentType}
            setDocumentType={setDocumentType}
            practiceArea={practiceArea}
            setPracticeArea={setPracticeArea}
          />

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metricsData.map((metric) => (
              <MetricsCard key={metric.id} {...metric} />
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Document Type Distribution */}
            <div className="bg-surface rounded-lg border border-border-light p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-text-primary">Document Type Distribution</h3>
                <Icon name="PieChart" size={20} className="text-text-secondary" />
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={documentTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {documentTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `${value}% (${props.payload.count} docs)`,
                        props.payload.name
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                {documentTypeData.map((item, index) => (
                  <div key={item.name} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-text-secondary">{item.name}</span>
                    <span className="text-sm font-medium text-text-primary">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Processing Volume Chart */}
            <div className="bg-surface rounded-lg border border-border-light p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-text-primary">Processing Volume</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedChart('volume')}
                    className={`px-3 py-1 text-sm rounded ${
                      selectedChart === 'volume' ?'bg-primary text-white' :'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Volume
                  </button>
                  <button
                    onClick={() => setSelectedChart('accuracy')}
                    className={`px-3 py-1 text-sm rounded ${
                      selectedChart === 'accuracy' ?'bg-primary text-white' :'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Accuracy
                  </button>
                </div>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {selectedChart === 'volume' ? (
                    <AreaChart data={volumeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        stroke="#6B7280"
                        fontSize={12}
                      />
                      <YAxis stroke="#6B7280" fontSize={12} />
                      <Tooltip 
                        labelFormatter={(value) => formatDate(value)}
                        formatter={(value) => [value, 'Documents']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="documents" 
                        stroke="#1E3A8A" 
                        fill="#1E3A8A" 
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  ) : (
                    <LineChart data={volumeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        stroke="#6B7280"
                        fontSize={12}
                      />
                      <YAxis 
                        domain={['dataMin - 2', 'dataMax + 2']}
                        stroke="#6B7280" 
                        fontSize={12}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip 
                        labelFormatter={(value) => formatDate(value)}
                        formatter={(value) => [`${value}%`, 'Accuracy']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="accuracy" 
                        stroke="#10B981" 
                        strokeWidth={3}
                        dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Accuracy by Category */}
          <div className="bg-surface rounded-lg border border-border-light p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-text-primary">Analysis Accuracy by Category</h3>
              <Icon name="BarChart3" size={20} className="text-text-secondary" />
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={accuracyData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    type="number" 
                    domain={[80, 100]}
                    stroke="#6B7280"
                    fontSize={12}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="category" 
                    stroke="#6B7280"
                    fontSize={12}
                    width={120}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value}%`,
                      'Accuracy'
                    ]}
                    labelFormatter={(label) => `Category: ${label}`}
                  />
                  <Bar 
                    dataKey="accuracy" 
                    fill="#1E3A8A"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Processing Jobs Table */}
          <ProcessingJobsTable />

          {/* Alert Notifications */}
          <div className="bg-surface rounded-lg border border-border-light p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Icon name="AlertTriangle" size={20} className="text-warning" />
              <h3 className="text-lg font-semibold text-text-primary">System Alerts</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <Icon name="AlertCircle" size={16} className="text-error mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-error">Processing Error Detected</p>
                  <p className="text-sm text-red-600">
                    3 documents failed processing due to OCR issues. Manual review required.
                  </p>
                  <p className="text-xs text-red-500 mt-1">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Icon name="Clock" size={16} className="text-warning mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-700">Unusual Processing Time</p>
                  <p className="text-sm text-amber-600">
                    Average processing time increased by 45% in the last 4 hours.
                  </p>
                  <p className="text-xs text-amber-500 mt-1">4 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Icon name="Info" size={16} className="text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary">Scheduled Maintenance</p>
                  <p className="text-sm text-blue-600">
                    System maintenance scheduled for tonight at 2:00 AM EST (4 hours).
                  </p>
                  <p className="text-xs text-blue-500 mt-1">1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Export Modal */}
      {isExportModalOpen && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onExport={handleExport}
        />
      )}
    </div>
  );
};

export default AnalysisDashboard;