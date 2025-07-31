import React, { useState, useEffect } from 'react';
import { ProcessedData } from '../types';
import { ResearchGap, analyzeResearchGaps } from '../utils/researchGapAnalysis';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface ResearchGapDashboardProps {
  data: ProcessedData;
}

export const ResearchGapDashboard: React.FC<ResearchGapDashboardProps> = ({ data }) => {
  const [gaps, setGaps] = useState<ResearchGap[]>([]);
  const [selectedGap, setSelectedGap] = useState<ResearchGap | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const analyzeGaps = async () => {
      setLoading(true);
      try {
        const analyzedGaps = analyzeResearchGaps(data.papers, data.topicClusters, data.authorNetwork);
        setGaps(analyzedGaps);
      } catch (error) {
        console.error('Error analyzing research gaps:', error);
      } finally {
        setLoading(false);
      }
    };

    analyzeGaps();
  }, [data]);

  const filteredGaps = filterType === 'all' 
    ? gaps 
    : gaps.filter(gap => gap.type === filterType);

  const gapTypeColors = {
    topical: '#3B82F6',
    temporal: '#10B981',
    methodological: '#F59E0B',
    geographic: '#EF4444'
  };

  const severityColors = {
    high: '#DC2626',
    medium: '#D97706',
    low: '#059669'
  };

  // Prepare data for visualizations
  const gapsByType = gaps.reduce((acc, gap) => {
    acc[gap.type] = (acc[gap.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeData = Object.entries(gapsByType).map(([type, count]) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    count,
    fill: gapTypeColors[type as keyof typeof gapTypeColors]
  }));

  const opportunityData = gaps.map(gap => ({
    title: gap.title.substring(0, 30) + '...',
    opportunity: gap.opportunityScore,
    impact: gap.evidence.potentialImpact * 100,
    type: gap.type,
    severity: gap.severity
  }));

  const radarData = [
    {
      category: 'Topical Gaps',
      value: gaps.filter(g => g.type === 'topical').length,
      fullMark: Math.max(5, gaps.length / 2)
    },
    {
      category: 'Temporal Gaps',
      value: gaps.filter(g => g.type === 'temporal').length,
      fullMark: Math.max(5, gaps.length / 2)
    },
    {
      category: 'Methodological',
      value: gaps.filter(g => g.type === 'methodological').length,
      fullMark: Math.max(5, gaps.length / 2)
    },
    {
      category: 'Geographic',
      value: gaps.filter(g => g.type === 'geographic').length,
      fullMark: Math.max(5, gaps.length / 2)
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Analyzing research gaps...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Research Gap Analysis</h2>
            <p className="text-gray-600 mt-1">
              Identified {gaps.length} potential research opportunities across {Object.keys(gapsByType).length} categories
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Gap Types</option>
              <option value="topical">Topical Gaps</option>
              <option value="temporal">Temporal Gaps</option>
              <option value="methodological">Methodological Gaps</option>
              <option value="geographic">Geographic Gaps</option>
            </select>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(gapsByType).map(([type, count]) => (
            <div key={type} className="text-center p-3 bg-gray-50 rounded-lg">
              <div 
                className="text-2xl font-bold mb-1"
                style={{ color: gapTypeColors[type as keyof typeof gapTypeColors] }}
              >
                {count}
              </div>
              <div className="text-sm text-gray-600 capitalize">{type} Gaps</div>
            </div>
          ))}
        </div>
      </div>

      {/* Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gap Types Distribution */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Gap Distribution by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={typeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Opportunity vs Impact Scatter */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Opportunity vs Impact Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={opportunityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="opportunity" name="Opportunity Score" />
              <YAxis dataKey="impact" name="Potential Impact" />
              <Tooltip 
                formatter={(value, name) => [
                  `${value}${name === 'opportunity' ? '' : '%'}`, 
                  name === 'opportunity' ? 'Opportunity Score' : 'Potential Impact'
                ]}
                labelFormatter={(label) => `Gap: ${label}`}
              />
              <Scatter 
                dataKey="impact" 
                fill="#8884d8"
                shape={(props) => {
                  const { cx, cy, payload } = props;
                  const color = gapTypeColors[payload.type as keyof typeof gapTypeColors];
                  return <circle cx={cx} cy={cy} r={6} fill={color} />;
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gap Categories Radar */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Research Gap Profile</h3>
        <div className="flex flex-col lg:flex-row items-center">
          <div className="w-full lg:w-1/2">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} />
                <Radar
                  name="Gap Count"
                  dataKey="value"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full lg:w-1/2 lg:pl-6 mt-4 lg:mt-0">
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                This radar chart shows the distribution of identified research gaps across different categories.
              </div>
              {Object.entries(gapsByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: gapTypeColors[type as keyof typeof gapTypeColors] }}
                    ></div>
                    <span className="text-sm font-medium capitalize">{type}</span>
                  </div>
                  <span className="text-sm text-gray-600">{count} gaps</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Gap List */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Detailed Gap Analysis ({filteredGaps.length} gaps)
        </h3>
        
        <div className="space-y-4">
          {filteredGaps.map((gap, index) => (
            <div 
              key={gap.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                selectedGap?.id === gap.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
              onClick={() => setSelectedGap(selectedGap?.id === gap.id ? null : gap)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span 
                      className="px-2 py-1 text-xs font-semibold rounded-full text-white"
                      style={{ backgroundColor: gapTypeColors[gap.type] }}
                    >
                      {gap.type.charAt(0).toUpperCase() + gap.type.slice(1)}
                    </span>
                    <span 
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        gap.severity === 'high' ? 'bg-red-100 text-red-800' :
                        gap.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}
                    >
                      {gap.severity.charAt(0).toUpperCase() + gap.severity.slice(1)} Priority
                    </span>
                  </div>
                  
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{gap.title}</h4>
                  <p className="text-gray-600 text-sm mb-3">{gap.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Opportunity Score: {gap.opportunityScore.toFixed(1)}</span>
                    <span>Impact: {(gap.evidence.potentialImpact * 100).toFixed(1)}%</span>
                  </div>
                </div>
                
                <div className="ml-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {gap.opportunityScore.toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-500">Score</div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedGap?.id === gap.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Evidence */}
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Evidence</h5>
                      <div className="space-y-2 text-sm">
                        {gap.evidence.underRepresentedTopics.length > 0 && (
                          <div>
                            <span className="font-medium">Under-represented topics:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {gap.evidence.underRepresentedTopics.map(topic => (
                                <span key={topic} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {gap.evidence.temporalGaps.length > 0 && (
                          <div>
                            <span className="font-medium">Temporal gaps:</span>
                            {gap.evidence.temporalGaps.map((tGap, i) => (
                              <div key={i} className="text-xs text-gray-600 ml-2">
                                {tGap.startYear}-{tGap.endYear}: {tGap.gapSize} fewer papers than expected
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {gap.evidence.supportingData && (
                          <div>
                            <span className="font-medium">Supporting data:</span>
                            <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(gap.evidence.supportingData, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Recommendations</h5>
                      <ul className="space-y-1 text-sm">
                        {gap.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            <span className="text-gray-700">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Research Opportunities Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Research Opportunities</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {gaps.filter(g => g.severity === 'high').length}
            </div>
            <div className="text-sm text-gray-600">High Priority Gaps</div>
            <div className="text-xs text-gray-500 mt-1">Immediate research opportunities</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(gaps.reduce((sum, g) => sum + g.opportunityScore, 0) / gaps.length)}
            </div>
            <div className="text-sm text-gray-600">Avg Opportunity Score</div>
            <div className="text-xs text-gray-500 mt-1">Overall research potential</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {gaps.filter(g => g.evidence.potentialImpact > 0.7).length}
            </div>
            <div className="text-sm text-gray-600">High Impact Potential</div>
            <div className="text-xs text-gray-500 mt-1">Transformative opportunities</div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-white rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Top Recommendations</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Focus on high-impact topical intersections with limited current research</li>
            <li>• Address methodological gaps through empirical validation studies</li>
            <li>• Explore temporal gaps that may indicate missed research opportunities</li>
            <li>• Consider geographic and cultural perspectives in research design</li>
          </ul>
        </div>
      </div>
    </div>
  );
};