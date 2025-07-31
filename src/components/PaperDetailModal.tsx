import React, { useState, useEffect } from 'react';
import { PaperRecord, ProcessedData } from '../types';
import { CitationData, externalDataService } from '../services/externalDataService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface PaperDetailModalProps {
  paper: PaperRecord | null;
  isOpen: boolean;
  onClose: () => void;
  data: ProcessedData;
}

export const PaperDetailModal: React.FC<PaperDetailModalProps> = ({
  paper,
  isOpen,
  onClose,
  data
}) => {
  const [citationData, setCitationData] = useState<CitationData | null>(null);
  const [relatedPapers, setRelatedPapers] = useState<PaperRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'citations' | 'related' | 'metrics'>('overview');

  useEffect(() => {
    if (paper && isOpen) {
      loadPaperDetails();
      findRelatedPapers();
    }
  }, [paper, isOpen]);

  const loadPaperDetails = async () => {
    if (!paper) return;
    
    setLoading(true);
    try {
      const citations = await externalDataService.enrichPaperData([paper], 1);
      const paperData = citations.get(paper.key);
      if (paperData?.citations) {
        setCitationData(paperData.citations);
      }
    } catch (error) {
      console.warn('Failed to load citation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const findRelatedPapers = () => {
    if (!paper) return;

    // Find papers by same authors
    const sameAuthorPapers = data.papers.filter(p => 
      p.key !== paper.key && 
      p.authors.some(author => paper.authors.includes(author))
    );

    // Find papers with similar topics
    const paperTopics = data.topicClusters.filter(cluster =>
      cluster.papers.some(p => p.key === paper.key)
    );

    const similarTopicPapers = data.papers.filter(p => {
      if (p.key === paper.key) return false;
      
      return paperTopics.some(topic =>
        topic.papers.some(tp => tp.key === p.key)
      );
    });

    // Find papers from same venue
    const sameVenuePapers = data.papers.filter(p =>
      p.key !== paper.key &&
      (p.venue === paper.venue || p.publicationTitle === paper.publicationTitle) &&
      (paper.venue || paper.publicationTitle)
    );

    // Combine and deduplicate
    const allRelated = [...sameAuthorPapers, ...similarTopicPapers, ...sameVenuePapers];
    const uniqueRelated = allRelated.filter((p, index, arr) => 
      arr.findIndex(other => other.key === p.key) === index
    );

    // Sort by relevance (papers with multiple connections first)
    const scoredPapers = uniqueRelated.map(p => {
      let score = 0;
      if (sameAuthorPapers.some(sp => sp.key === p.key)) score += 3;
      if (similarTopicPapers.some(sp => sp.key === p.key)) score += 2;
      if (sameVenuePapers.some(sp => sp.key === p.key)) score += 1;
      return { paper: p, score };
    });

    setRelatedPapers(
      scoredPapers
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(item => item.paper)
    );
  };

  const exportCitation = (format: 'bibtex' | 'apa' | 'mla') => {
    if (!paper) return;

    let citation = '';
    const authors = paper.authors.join(', ');
    const year = paper.publicationYear || 'n.d.';
    const venue = paper.venue || paper.publicationTitle || 'Unknown venue';

    switch (format) {
      case 'bibtex':
        citation = `@article{${paper.key},
  title={${paper.title}},
  author={${authors}},
  year={${year}},
  journal={${venue}}${paper.doi ? `,\n  doi={${paper.doi}}` : ''}
}`;
        break;
      case 'apa':
        citation = `${authors} (${year}). ${paper.title}. ${venue}.${paper.doi ? ` https://doi.org/${paper.doi}` : ''}`;
        break;
      case 'mla':
        citation = `${authors}. "${paper.title}." ${venue}, ${year}.${paper.doi ? ` Web. https://doi.org/${paper.doi}` : ''}`;
        break;
    }

    navigator.clipboard.writeText(citation);
    alert(`${format.toUpperCase()} citation copied to clipboard!`);
  };

  const getTopicTags = () => {
    if (!paper) return [];
    
    return data.topicClusters
      .filter(cluster => cluster.papers.some(p => p.key === paper.key))
      .map(cluster => cluster.label);
  };

  const calculateImpactMetrics = () => {
    if (!paper) return null;

    const venue = data.venueStats.find(v => 
      v.name === paper.venue || v.name === paper.publicationTitle
    );

    const authorMetrics = paper.authors.map(authorName => {
      const author = data.authorNetwork.find(a => a.name === authorName);
      return author ? {
        name: authorName,
        paperCount: author.paperCount,
        influence: author.influence
      } : null;
    }).filter(Boolean);

    return {
      venue: venue ? {
        name: venue.name,
        paperCount: venue.paperCount,
        type: venue.type
      } : null,
      authors: authorMetrics,
      citationCount: citationData?.citationCount || 0,
      influentialCitations: citationData?.influentialCitationCount || 0
    };
  };

  if (!isOpen || !paper) return null;

  const impactMetrics = calculateImpactMetrics();
  const topicTags = getTopicTags();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex-1 pr-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{paper.title}</h2>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <span>{paper.authors.join(', ')}</span>
              {paper.publicationYear && (
                <>
                  <span>•</span>
                  <span>{paper.publicationYear}</span>
                </>
              )}
              {(paper.venue || paper.publicationTitle) && (
                <>
                  <span>•</span>
                  <span>{paper.venue || paper.publicationTitle}</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'citations', label: 'Citations' },
              { id: 'related', label: 'Related Papers' },
              { id: 'metrics', label: 'Impact Metrics' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Abstract */}
              {paper.abstract && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Abstract</h3>
                  <p className="text-gray-700 leading-relaxed">{paper.abstract}</p>
                </div>
              )}

              {/* Topic Tags */}
              {topicTags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Research Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {topicTags.map(topic => (
                      <span
                        key={topic}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Keywords */}
              {paper.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {paper.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Access</h3>
                <div className="space-y-2">
                  {paper.doi && (
                    <a
                      href={`https://doi.org/${paper.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                      </svg>
                      DOI: {paper.doi}
                    </a>
                  )}
                  {paper.url && (
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.559-.499-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.559.499.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.497-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                      </svg>
                      Full Text
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'citations' && (
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading citation data...</p>
                </div>
              ) : citationData ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{citationData.citationCount}</div>
                      <div className="text-sm text-gray-600">Total Citations</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{citationData.influentialCitationCount}</div>
                      <div className="text-sm text-gray-600">Influential Citations</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {citationData.citingPapers.length}
                      </div>
                      <div className="text-sm text-gray-600">Recent Citing Papers</div>
                    </div>
                  </div>

                  {citationData.citationTrend.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Citation Trend</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={citationData.citationTrend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {citationData.citingPapers.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Citing Papers</h3>
                      <div className="space-y-3">
                        {citationData.citingPapers.slice(0, 5).map((citingPaper, index) => (
                          <div key={index} className="p-3 border border-gray-200 rounded-lg">
                            <h4 className="font-medium text-gray-900">{citingPaper.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {citingPaper.authors.join(', ')} • {citingPaper.year} • {citingPaper.venue}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Citation data not available for this paper.</p>
                  <p className="text-sm mt-2">This may be due to API limitations or the paper not being indexed.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'related' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Related Papers ({relatedPapers.length})</h3>
              {relatedPapers.length > 0 ? (
                <div className="space-y-3">
                  {relatedPapers.map(relatedPaper => (
                    <div key={relatedPaper.key} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <h4 className="font-medium text-gray-900 mb-2">{relatedPaper.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {relatedPaper.authors.join(', ')} • {relatedPaper.publicationYear} • {relatedPaper.venue || relatedPaper.publicationTitle}
                      </p>
                      {relatedPaper.abstract && (
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {relatedPaper.abstract.substring(0, 200)}...
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No related papers found.</p>
              )}
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Impact Metrics</h3>
              
              {impactMetrics && (
                <>
                  {/* Venue Information */}
                  {impactMetrics.venue && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Publication Venue</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Venue:</span>
                          <div className="font-medium">{impactMetrics.venue.name}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Type:</span>
                          <div className="font-medium capitalize">{impactMetrics.venue.type}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Papers in Dataset:</span>
                          <div className="font-medium">{impactMetrics.venue.paperCount}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Author Metrics */}
                  {impactMetrics.authors.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Author Metrics</h4>
                      <div className="space-y-2">
                        {impactMetrics.authors.map((author, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <span className="font-medium">{author.name}</span>
                            <div className="text-sm text-gray-600">
                              {author.paperCount} papers • Influence: {author.influence.toFixed(1)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Citation Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Citation Impact</h4>
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {impactMetrics.citationCount}
                      </div>
                      <div className="text-sm text-gray-600">Total Citations</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Influential Impact</h4>
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {impactMetrics.influentialCitations}
                      </div>
                      <div className="text-sm text-gray-600">Influential Citations</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-2">
            <button
              onClick={() => exportCitation('bibtex')}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Export BibTeX
            </button>
            <button
              onClick={() => exportCitation('apa')}
              className="px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Export APA
            </button>
            <button
              onClick={() => exportCitation('mla')}
              className="px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Export MLA
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};