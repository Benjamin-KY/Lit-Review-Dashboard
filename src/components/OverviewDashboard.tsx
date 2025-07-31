import React, { useEffect, useState } from 'react';
import { ProcessedData, PaperRecord } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface OverviewDashboardProps {
  data: ProcessedData;
}

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  decimals?: number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ 
  end, 
  duration = 2000, 
  suffix = '', 
  decimals = 0 
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      setCount(end * progress);
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return (
    <span>
      {decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString()}
      {suffix}
    </span>
  );
};

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ data }) => {
  const [selectedMetric, setSelectedMetric] = useState<string>('papers');

  // Calculate additional metrics
  const currentYear = new Date().getFullYear();
  const recentPapers = data.papers.filter(p => 
    p.publicationYear && p.publicationYear >= currentYear - 5
  ).length;
  const recentPercentage = (recentPapers / data.papers.length) * 100;

  // Publication type breakdown
  const publicationTypes = data.papers.reduce((acc, paper) => {
    const type = paper.itemType || 'other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const publicationTypeData = Object.entries(publicationTypes).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count,
    percentage: ((count / data.papers.length) * 100).toFixed(1)
  }));

  // Yearly publication trend
  const yearlyTrend = data.papers
    .filter(p => p.publicationYear)
    .reduce((acc, paper) => {
      const year = paper.publicationYear!;
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

  const yearlyTrendData = Object.entries(yearlyTrend)
    .map(([year, count]) => ({ year: parseInt(year), papers: count }))
    .sort((a, b) => a.year - b.year)
    .slice(-10); // Last 10 years

  // Top venues
  const topVenues = data.venueStats.slice(0, 8);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

  return (
    <div className="space-y-6">
      {/* Hero Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Papers</p>
              <p className="text-3xl font-bold">
                <AnimatedCounter end={data.papers.length} />
              </p>
            </div>
            <div className="bg-blue-400 bg-opacity-30 rounded-full p-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 text-blue-100 text-sm">
            Spanning {data.yearRange[1] - data.yearRange[0]} years ({data.yearRange[0]}-{data.yearRange[1]})
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Unique Authors</p>
              <p className="text-3xl font-bold">
                <AnimatedCounter end={data.authorNetwork.length} />
              </p>
            </div>
            <div className="bg-green-400 bg-opacity-30 rounded-full p-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 text-green-100 text-sm">
            Research community network
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Research Topics</p>
              <p className="text-3xl font-bold">
                <AnimatedCounter end={data.topicClusters.length} />
              </p>
            </div>
            <div className="bg-purple-400 bg-opacity-30 rounded-full p-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 text-purple-100 text-sm">
            Thematic coverage areas
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Recent Papers</p>
              <p className="text-3xl font-bold">
                <AnimatedCounter end={recentPercentage} decimals={1} suffix="%" />
              </p>
            </div>
            <div className="bg-orange-400 bg-opacity-30 rounded-full p-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="mt-4 text-orange-100 text-sm">
            Published in last 5 years
          </div>
        </div>
      </div>

      {/* Quality Indicators */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Quality Indicators</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              <AnimatedCounter end={data.qualityMetrics.doiCoverage} decimals={1} suffix="%" />
            </div>
            <div className="text-sm text-gray-600">DOI Coverage</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${data.qualityMetrics.doiCoverage}%` }}
              ></div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              <AnimatedCounter end={data.qualityMetrics.urlCoverage} decimals={1} suffix="%" />
            </div>
            <div className="text-sm text-gray-600">URL Coverage</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${data.qualityMetrics.urlCoverage}%` }}
              ></div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              <AnimatedCounter end={data.qualityMetrics.abstractCoverage} decimals={1} suffix="%" />
            </div>
            <div className="text-sm text-gray-600">Abstract Coverage</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${data.qualityMetrics.abstractCoverage}%` }}
              ></div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              <AnimatedCounter end={recentPercentage} decimals={1} suffix="%" />
            </div>
            <div className="text-sm text-gray-600">Recent Papers</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-orange-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${recentPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Publication Types */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Publication Types</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={publicationTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} (${percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {publicationTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Publication Trend */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Publication Trend (Last 10 Years)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={yearlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="papers" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Venues */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Publication Venues</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={topVenues} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={200} />
            <Tooltip />
            <Bar dataKey="paperCount" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Topic Coverage */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Research Topic Coverage</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.topicClusters.slice(0, 6).map((topic, index) => (
            <div key={topic.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-900">{topic.label}</h4>
                <span className="text-sm font-semibold text-blue-600">
                  {topic.coverage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, topic.coverage)}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600">
                {topic.size} papers
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Research Impact Summary */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Research Impact Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-2">
              <AnimatedCounter end={data.venueStats.length} />
            </div>
            <div className="text-sm text-gray-600">Publication Venues</div>
            <div className="text-xs text-gray-500 mt-1">
              Diverse outlet coverage
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-teal-600 mb-2">
              <AnimatedCounter end={data.yearRange[1] - data.yearRange[0]} />
            </div>
            <div className="text-sm text-gray-600">Years Covered</div>
            <div className="text-xs text-gray-500 mt-1">
              Comprehensive temporal scope
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-rose-600 mb-2">
              <AnimatedCounter 
                end={data.papers.reduce((sum, p) => sum + p.authors.length, 0) / data.papers.length} 
                decimals={1} 
              />
            </div>
            <div className="text-sm text-gray-600">Avg Authors/Paper</div>
            <div className="text-xs text-gray-500 mt-1">
              Collaboration indicator
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};