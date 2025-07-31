import React from 'react';
import { ProcessedData } from '../types';

interface DataLoadingStatusProps {
  data: ProcessedData | null;
  loading: boolean;
  error: string | null;
}

export const DataLoadingStatus: React.FC<DataLoadingStatusProps> = ({ data, loading, error }) => {
  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
          <div>
            <h3 className="text-sm font-medium text-blue-900">Loading Ben Kereopa-Yorke's Research Data</h3>
            <p className="text-sm text-blue-700">Processing his literature review dataset...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="text-red-600 mr-3">⚠️</div>
          <div>
            <h3 className="text-sm font-medium text-red-900">Data Loading Error</h3>
            <p className="text-sm text-red-700">{error}</p>
            <p className="text-xs text-red-600 mt-1">Check browser console for details</p>
          </div>
        </div>
      </div>
    );
  }

  if (data) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-green-600 mr-3">✅</div>
            <div>
              <h3 className="text-sm font-medium text-green-900">🎯 FINAL SCREENED Dataset Loaded!</h3>
              <p className="text-sm text-green-700">
                {data.papers.length} papers • {data.authorNetwork.length} authors • {data.topicClusters.length} topics
              </p>
              <p className="text-xs text-green-600 mt-1">
                Using the dataset from BKY's literature review (XLSX)
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-green-600">
              Year Range: {data.yearRange[0]}-{data.yearRange[1]}
            </div>
            <div className="text-xs text-green-600">
              Quality: {data.qualityMetrics.doiCoverage.toFixed(1)}% DOI coverage
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};