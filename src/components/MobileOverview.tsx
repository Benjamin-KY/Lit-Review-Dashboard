import React, { useState } from 'react';
import { ProcessedData } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface MobileOverviewProps {
  data: ProcessedData;
}

export const MobileOverview: React.FC<MobileOverviewProps> = ({ data }) => {
  const [activeCard, setActiveCard] = useState<string | null>(null);

  // Calculate key metrics
  const currentYear = new Date().getFullYear();
  const recentPapers = data.papers.filter(p => 
    p.publicationYear && p.publicationYear >= currentYear - 5
  ).length;
  const recentPercentage = (recentPapers / data.papers.length) * 100;

  // Simplified data for mobile charts
  const topTopics = data.topicClusters.slice(0, 5).map(topic => ({
    name: topic.label,
    value: topic.size,
    percentage: topic.coverage.toFixed(1)
  }));

  const topVenues = data.venueStats.slice(0, 5).map(venue => ({
    name: venue.name.length > 20 ? venue.name.substring(0, 20) + '...' : venue.name,
    papers: venue.paperCount
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    subtitle: string;
    color: string;
    id: string;
  }> = ({ title, value, subtitle, color, id }) => (
    <div 
      className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all duration-200 ${
        activeCard === id ? 'ring-2 ring-blue-500 scale-105' : ''
      }`}
      onClick={() => setActiveCard(activeCard === id ? null : id)}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className={`w-3 h-3 rounded-full ${color.replace('text-', 'bg-')}`}></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          id="papers"
          title="Total Papers"
          value={data.papers.length.toLocaleString()}
          subtitle={`${data.yearRange[1] - data.yearRange[0]} year span`}
          color="text-blue-600"
        />
        <MetricCard
          id="authors"
          title="Authors"
          value={data.authorNetwork.length.toLocaleString()}
          subtitle="Research network"
          color="text-green-600"
        />
        <MetricCard
          id="topics"
          title="Topics"
          value={data.topicClusters.length}
          subtitle="Research areas"
          color="text-purple-600"
        />
        <MetricCard
          id="recent"
          title="Recent"
          value={`${recentPercentage.toFixed(1)}%`}
          subtitle="Last 5 years"
          color="text-orange-600"
        />
      </div>

      {/* Quality Indicators */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Data Quality</h3>
        <div className="space-y-3">
          {[
            { label: 'DOI Coverage', value: data.qualityMetrics.doiCoverage, color: 'bg-blue-500' },
            { label: 'URL Coverage', value: data.qualityMetrics.urlCoverage, color: 'bg-green-500' },
            { label: 'Abstracts', value: data.qualityMetrics.abstractCoverage, color: 'bg-purple-500' }
          ].map((metric, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{metric.label}</span>
                <span className="font-medium">{metric.value.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`${metric.color} h-2 rounded-full transition-all duration-1000`}
                  style={{ width: `${metric.value}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Topics - Mobile Optimized */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Top Research Topics</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={topTopics}
                cx="50%"
                cy="50%"
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percentage }) => `${percentage}%`}
                labelLine={false}
              >
                {topTopics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} papers`, name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 space-y-1">
          {topTopics.map((topic, index) => (
            <div key={index} className="flex items-center text-xs">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              ></div>
              <span className="flex-1">{topic.name}</span>
              <span className="text-gray-500">{topic.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Venues - Horizontal Bar Chart */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Top Venues</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topVenues} layout="horizontal">
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={80} fontSize={10} />
              <Tooltip />
              <Bar dataKey="papers" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Stats</h3>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-blue-600">
              {Math.round(data.papers.reduce((sum, p) => sum + p.authors.length, 0) / data.papers.length * 10) / 10}
            </div>
            <div className="text-xs text-gray-600">Avg Authors/Paper</div>
          </div>
          <div>
            <div className="text-xl font-bold text-green-600">
              {data.venueStats.length}
            </div>
            <div className="text-xs text-gray-600">Publication Venues</div>
          </div>
          <div>
            <div className="text-xl font-bold text-purple-600">
              {data.yearRange[1] - data.yearRange[0]}
            </div>
            <div className="text-xs text-gray-600">Years Covered</div>
          </div>
          <div>
            <div className="text-xl font-bold text-orange-600">
              {Math.round((data.qualityMetrics.doiCoverage + data.qualityMetrics.urlCoverage) / 2)}%
            </div>
            <div className="text-xs text-gray-600">Accessibility</div>
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      {activeCard && (
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
          <h4 className="font-semibold text-gray-900 mb-2">
            {activeCard === 'papers' && 'Paper Collection Details'}
            {activeCard === 'authors' && 'Author Network Details'}
            {activeCard === 'topics' && 'Topic Analysis Details'}
            {activeCard === 'recent' && 'Recent Publications Details'}
          </h4>
          <div className="text-sm text-gray-600">
            {activeCard === 'papers' && (
              <p>Comprehensive collection spanning {data.yearRange[0]} to {data.yearRange[1]}, 
              covering {data.topicClusters.length} major research areas in AI Security Economics and Game Theory.</p>
            )}
            {activeCard === 'authors' && (
              <p>Network of {data.authorNetwork.length} researchers from diverse institutions, 
              with {data.authorNetwork.filter(a => a.paperCount > 5).length} highly active contributors.</p>
            )}
            {activeCard === 'topics' && (
              <p>Research spans {data.topicClusters.length} interconnected topics, with Security ({data.topicClusters[0]?.coverage.toFixed(1)}%) 
              and Economics being the most prominent areas.</p>
            )}
            {activeCard === 'recent' && (
              <p>{recentPapers} papers published in the last 5 years, showing {recentPercentage > 30 ? 'strong' : 'moderate'} 
              recent activity in the field.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};