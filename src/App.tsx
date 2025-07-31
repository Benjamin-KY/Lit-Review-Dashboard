import { useState, useEffect } from 'react'
import { ProcessedData, PaperRecord } from './types'
import { loadActualResearchData } from './data/dataLoader'
import { OverviewDashboard } from './components/OverviewDashboard'
import { TimelineVisualization } from './components/TimelineVisualization'
import { TopicNetworkVisualization } from './components/TopicNetworkVisualization'
import { AuthorNetworkVisualization } from './components/AuthorNetworkVisualization'
import { MethodologyShowcase } from './components/MethodologyShowcase'
import { ResearchGapDashboard } from './components/ResearchGapDashboard'
import { AdvancedSearch } from './components/AdvancedSearch'
import { PaperDetailModal } from './components/PaperDetailModal'
import { MobileOverview } from './components/MobileOverview'
import { ResponsiveWrapper, MobileNavigation } from './components/ResponsiveWrapper'
import { DataLoadingStatus } from './components/DataLoadingStatus'

type ViewType = 'overview' | 'timeline' | 'topics' | 'authors' | 'methodology' | 'gaps' | 'search';

function App() {
  const [data, setData] = useState<ProcessedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<ViewType>('overview')
  const [selectedYearRange, setSelectedYearRange] = useState<[number, number] | undefined>()
  const [selectedTopic, setSelectedTopic] = useState<string | undefined>()
  const [selectedAuthor, setSelectedAuthor] = useState<string | undefined>()
  const [filteredPapers, setFilteredPapers] = useState<PaperRecord[]>([])
  const [selectedPaper, setSelectedPaper] = useState<PaperRecord | null>(null)
  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    // Load actual research data
    const loadData = async () => {
      try {
        setLoading(true)
        const { combinedData } = await loadActualResearchData()
        setData(combinedData)
        setFilteredPapers(combinedData.papers)
        console.log(`Loaded ${combinedData.papers.length} papers from research dataset`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load research data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Filter papers based on selections
  useEffect(() => {
    if (!data) return

    let filtered = data.papers

    // Filter by year range
    if (selectedYearRange) {
      filtered = filtered.filter(paper => 
        paper.publicationYear && 
        paper.publicationYear >= selectedYearRange[0] && 
        paper.publicationYear <= selectedYearRange[1]
      )
    }

    // Filter by topic
    if (selectedTopic) {
      const topicCluster = data.topicClusters.find(t => t.id === selectedTopic)
      if (topicCluster) {
        const topicPaperKeys = new Set(topicCluster.papers.map(p => p.key))
        filtered = filtered.filter(paper => topicPaperKeys.has(paper.key))
      }
    }

    // Filter by author
    if (selectedAuthor) {
      filtered = filtered.filter(paper => 
        paper.authors.some(author => 
          author.toLowerCase().includes(selectedAuthor.toLowerCase())
        )
      )
    }

    setFilteredPapers(filtered)
  }, [data, selectedYearRange, selectedTopic, selectedAuthor])

  const handleYearRangeChange = (startYear: number, endYear: number) => {
    setSelectedYearRange([startYear, endYear])
  }

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopic(selectedTopic === topicId ? undefined : topicId)
  }

  const handleAuthorSelect = (authorId: string) => {
    setSelectedAuthor(selectedAuthor === authorId ? undefined : authorId)
  }

  const clearFilters = () => {
    setSelectedYearRange(undefined)
    setSelectedTopic(undefined)
    setSelectedAuthor(undefined)
  }

  const handlePaperSelect = (paper: PaperRecord) => {
    setSelectedPaper(paper)
    setIsPaperModalOpen(true)
  }

  const handleSearchResults = (results: PaperRecord[]) => {
    setFilteredPapers(results)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading literature review data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error loading data</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'timeline', label: 'Timeline', icon: '📈' },
    { id: 'topics', label: 'Topics', icon: '🔗' },
    { id: 'authors', label: 'Authors', icon: '👥' },
    { id: 'gaps', label: 'Research Gaps', icon: '🔍' },
    { id: 'search', label: 'Search', icon: '🔎' },
    { id: 'methodology', label: 'Methodology', icon: '🔬' }
  ]

  const renderCurrentView = () => {
    if (!data) return null

    switch (currentView) {
      case 'overview':
        return isMobile ? <MobileOverview data={data} /> : <OverviewDashboard data={data} />
      case 'timeline':
        return (
          <TimelineVisualization 
            papers={filteredPapers}
            onYearRangeChange={handleYearRangeChange}
            selectedYearRange={selectedYearRange}
          />
        )
      case 'topics':
        return (
          <TopicNetworkVisualization 
            topicClusters={data.topicClusters}
            onTopicSelect={handleTopicSelect}
            selectedTopic={selectedTopic}
          />
        )
      case 'authors':
        return (
          <AuthorNetworkVisualization 
            authors={data.authorNetwork}
            onAuthorSelect={handleAuthorSelect}
            selectedAuthor={selectedAuthor}
          />
        )
      case 'gaps':
        return <ResearchGapDashboard data={data} />
      case 'search':
        return (
          <div className="space-y-6">
            <AdvancedSearch 
              data={data}
              onSearchResults={handleSearchResults}
              onFiltersChange={() => {}}
            />
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Search Results ({filteredPapers.length} papers)
              </h3>
              <div className="space-y-3">
                {filteredPapers.slice(0, 20).map(paper => (
                  <div 
                    key={paper.key}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => handlePaperSelect(paper)}
                  >
                    <h4 className="font-medium text-gray-900 mb-2">{paper.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {paper.authors.join(', ')} • {paper.publicationYear} • {paper.venue || paper.publicationTitle}
                    </p>
                    {paper.abstract && (
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {paper.abstract.substring(0, 200)}...
                      </p>
                    )}
                  </div>
                ))}
                {filteredPapers.length > 20 && (
                  <div className="text-center py-4 text-gray-500">
                    Showing first 20 results. Use filters to narrow down your search.
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      case 'methodology':
        return <MethodologyShowcase data={data} />
      default:
        return isMobile ? <MobileOverview data={data} /> : <OverviewDashboard data={data} />
    }
  }

  return (
    <ResponsiveWrapper className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-4 lg:mb-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                      Literature Review Showcase
                    </h1>
                    <p className="mt-2 text-gray-600 text-sm md:text-base">
                      Systematic literature review: {data?.papers.length || 0} papers on AI Security Economics and Game Theory ({data ? data.yearRange[0] : 1990}-{data ? data.yearRange[1] : 2025})
                    </p>
                  </div>
                  <MobileNavigation
                    currentView={currentView}
                    onViewChange={(view) => setCurrentView(view as ViewType)}
                    navigationItems={navigationItems}
                  />
                </div>
              </div>
              
              {/* Filter Status */}
              {(selectedYearRange || selectedTopic || selectedAuthor) && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Filters active:</span>
                  {selectedYearRange && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {selectedYearRange[0]}-{selectedYearRange[1]}
                    </span>
                  )}
                  {selectedTopic && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Topic: {data?.topicClusters.find(t => t.id === selectedTopic)?.label}
                    </span>
                  )}
                  {selectedAuthor && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      Author: {selectedAuthor}
                    </span>
                  )}
                  <button
                    onClick={clearFilters}
                    className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full hover:bg-red-200 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-24 z-30 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  currentView === item.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DataLoadingStatus data={data} loading={loading} error={error} />
        {renderCurrentView()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>Literature Review Showcase - PhD Research Demonstration</p>
            <p className="mt-2">
              Systematic analysis of {data?.papers.length || 0} papers spanning {data ? data.yearRange[1] - data.yearRange[0] : 0} years
            </p>
          </div>
        </div>
      </footer>

      {/* Paper Detail Modal */}
      {data && (
        <PaperDetailModal
          paper={selectedPaper}
          isOpen={isPaperModalOpen}
          onClose={() => setIsPaperModalOpen(false)}
          data={data}
        />
      )}
    </ResponsiveWrapper>
  )
}

export default App