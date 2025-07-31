import React, { useState, useEffect } from 'react';
import { PaperRecord, ProcessedData } from '../types';

interface SearchFilters {
  query: string;
  yearRange: [number, number];
  authors: string[];
  topics: string[];
  venues: string[];
  itemTypes: string[];
}

interface AdvancedSearchProps {
  data: ProcessedData;
  onSearchResults: (results: PaperRecord[]) => void;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  data,
  onSearchResults,
  onFiltersChange
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    yearRange: [data.yearRange[0], data.yearRange[1]],
    authors: [],
    topics: [],
    venues: [],
    itemTypes: []
  });

  const [searchResults, setSearchResults] = useState<PaperRecord[]>(data.papers);
  const [isExpanded, setIsExpanded] = useState(false);
  const [savedSearches, setSavedSearches] = useState<Array<{
    name: string;
    filters: SearchFilters;
    resultCount: number;
  }>>([]);

  // Get unique values for filter options
  const uniqueAuthors = Array.from(new Set(
    data.papers.flatMap(p => p.authors)
  )).sort();

  const uniqueVenues = Array.from(new Set(
    data.papers.map(p => p.venue || p.publicationTitle).filter(Boolean)
  )).sort();

  const uniqueItemTypes = Array.from(new Set(
    data.papers.map(p => p.itemType)
  )).sort();

  const topicOptions = data.topicClusters.map(t => t.label);

  useEffect(() => {
    performSearch();
  }, [filters, data.papers]);

  const performSearch = () => {
    let results = data.papers;

    // Text search
    if (filters.query.trim()) {
      const query = filters.query.toLowerCase();
      results = results.filter(paper =>
        paper.title.toLowerCase().includes(query) ||
        paper.abstract.toLowerCase().includes(query) ||
        paper.authors.some(author => author.toLowerCase().includes(query)) ||
        paper.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Year range filter
    results = results.filter(paper =>
      paper.publicationYear &&
      paper.publicationYear >= filters.yearRange[0] &&
      paper.publicationYear <= filters.yearRange[1]
    );

    // Author filter
    if (filters.authors.length > 0) {
      results = results.filter(paper =>
        paper.authors.some(author =>
          filters.authors.some(filterAuthor =>
            author.toLowerCase().includes(filterAuthor.toLowerCase())
          )
        )
      );
    }

    // Topic filter
    if (filters.topics.length > 0) {
      results = results.filter(paper => {
        const paperTopics = data.topicClusters
          .filter(cluster => cluster.papers.some(p => p.key === paper.key))
          .map(cluster => cluster.label);
        
        return filters.topics.some(topic => paperTopics.includes(topic));
      });
    }

    // Venue filter
    if (filters.venues.length > 0) {
      results = results.filter(paper =>
        filters.venues.some(venue =>
          (paper.venue && paper.venue.toLowerCase().includes(venue.toLowerCase())) ||
          (paper.publicationTitle && paper.publicationTitle.toLowerCase().includes(venue.toLowerCase()))
        )
      );
    }

    // Item type filter
    if (filters.itemTypes.length > 0) {
      results = results.filter(paper =>
        filters.itemTypes.includes(paper.itemType)
      );
    }

    setSearchResults(results);
    onSearchResults(results);
    onFiltersChange(filters);
  };

  const updateFilter = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      query: '',
      yearRange: [data.yearRange[0], data.yearRange[1]],
      authors: [],
      topics: [],
      venues: [],
      itemTypes: []
    };
    setFilters(clearedFilters);
  };

  const saveSearch = () => {
    const name = prompt('Enter a name for this search:');
    if (name) {
      const newSearch = {
        name,
        filters: { ...filters },
        resultCount: searchResults.length
      };
      setSavedSearches(prev => [...prev, newSearch]);
    }
  };

  const loadSavedSearch = (savedFilters: SearchFilters) => {
    setFilters(savedFilters);
  };

  const exportResults = () => {
    const csvContent = [
      ['Title', 'Authors', 'Year', 'Venue', 'DOI', 'Abstract'].join(','),
      ...searchResults.map(paper => [
        `"${paper.title}"`,
        `"${paper.authors.join('; ')}"`,
        paper.publicationYear || '',
        `"${paper.venue || paper.publicationTitle}"`,
        paper.doi || '',
        `"${paper.abstract.substring(0, 200)}..."`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `literature_search_results_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      {/* Basic Search */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search titles, abstracts, authors, or keywords..."
            value={filters.query}
            onChange={(e) => updateFilter('query', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {isExpanded ? 'Simple' : 'Advanced'}
        </button>
        <div className="text-sm text-gray-600">
          {searchResults.length} results
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="space-y-4 border-t border-gray-200 pt-4">
          {/* Year Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Publication Year Range
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                min={data.yearRange[0]}
                max={data.yearRange[1]}
                value={filters.yearRange[0]}
                onChange={(e) => updateFilter('yearRange', [parseInt(e.target.value), filters.yearRange[1]])}
                className="w-24 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="number"
                min={data.yearRange[0]}
                max={data.yearRange[1]}
                value={filters.yearRange[1]}
                onChange={(e) => updateFilter('yearRange', [filters.yearRange[0], parseInt(e.target.value)])}
                className="w-24 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Topics */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Research Topics
            </label>
            <div className="flex flex-wrap gap-2">
              {topicOptions.map(topic => (
                <label key={topic} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.topics.includes(topic)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateFilter('topics', [...filters.topics, topic]);
                      } else {
                        updateFilter('topics', filters.topics.filter(t => t !== topic));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{topic}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Publication Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Publication Types
            </label>
            <div className="flex flex-wrap gap-2">
              {uniqueItemTypes.map(type => (
                <label key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.itemTypes.includes(type)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateFilter('itemTypes', [...filters.itemTypes, type]);
                      } else {
                        updateFilter('itemTypes', filters.itemTypes.filter(t => t !== type));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Authors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Authors (select up to 5)
            </label>
            <select
              multiple
              value={filters.authors}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                updateFilter('authors', selected.slice(0, 5));
              }}
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {uniqueAuthors.slice(0, 50).map(author => (
                <option key={author} value={author}>
                  {author}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Hold Ctrl/Cmd to select multiple authors
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Clear Filters
              </button>
              <button
                onClick={saveSearch}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Save Search
              </button>
              <button
                onClick={exportResults}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                Export Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Saved Searches</h4>
          <div className="flex flex-wrap gap-2">
            {savedSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => loadSavedSearch(search.filters)}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded hover:bg-blue-200 transition-colors"
              >
                {search.name} ({search.resultCount} results)
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {(filters.query || filters.authors.length > 0 || filters.topics.length > 0 || 
        filters.venues.length > 0 || filters.itemTypes.length > 0 ||
        filters.yearRange[0] !== data.yearRange[0] || filters.yearRange[1] !== data.yearRange[1]) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Active Filters</h4>
          <div className="flex flex-wrap gap-2">
            {filters.query && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                Query: "{filters.query}"
              </span>
            )}
            {(filters.yearRange[0] !== data.yearRange[0] || filters.yearRange[1] !== data.yearRange[1]) && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                Years: {filters.yearRange[0]}-{filters.yearRange[1]}
              </span>
            )}
            {filters.topics.map(topic => (
              <span key={topic} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                Topic: {topic}
              </span>
            ))}
            {filters.authors.map(author => (
              <span key={author} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                Author: {author}
              </span>
            ))}
            {filters.itemTypes.map(type => (
              <span key={type} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                Type: {type}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};