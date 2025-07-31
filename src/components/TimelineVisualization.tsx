import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { PaperRecord, YearlyStatistics } from '../types';

interface TimelineVisualizationProps {
  papers: PaperRecord[];
  onYearRangeChange?: (startYear: number, endYear: number) => void;
  selectedYearRange?: [number, number];
}

export const TimelineVisualization: React.FC<TimelineVisualizationProps> = ({
  papers,
  onYearRangeChange,
  selectedYearRange
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredYear, setHoveredYear] = useState<YearlyStatistics | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!svgRef.current || papers.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Process data by year
    const yearlyData = processYearlyData(papers);
    
    // Set up dimensions
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(yearlyData, d => d.year) as [number, number])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(yearlyData, d => d.paperCount) || 0])
      .range([height, 0]);

    const radiusScale = d3.scaleSqrt()
      .domain([0, d3.max(yearlyData, d => d.paperCount) || 0])
      .range([3, 20]);

    // Color scale for topics
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format('d')));

    g.append('g')
      .call(d3.axisLeft(yScale));

    // Add axis labels
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text('Number of Papers');

    g.append('text')
      .attr('transform', `translate(${width / 2}, ${height + margin.bottom})`)
      .style('text-anchor', 'middle')
      .text('Publication Year');

    // Add bubbles
    const bubbles = g.selectAll('.bubble')
      .data(yearlyData)
      .enter()
      .append('circle')
      .attr('class', 'bubble')
      .attr('cx', d => xScale(d.year))
      .attr('cy', d => yScale(d.paperCount))
      .attr('r', d => radiusScale(d.paperCount))
      .attr('fill', (d, i) => colorScale(i.toString()))
      .attr('opacity', 0.7)
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer');

    // Add hover interactions
    bubbles
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 1)
          .attr('stroke-width', 2);
        
        setHoveredYear(d);
        setMousePosition({ x: event.pageX, y: event.pageY });
      })
      .on('mousemove', function(event) {
        setMousePosition({ x: event.pageX, y: event.pageY });
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 0.7)
          .attr('stroke-width', 1);
        
        setHoveredYear(null);
      })
      .on('click', function(event, d) {
        if (onYearRangeChange) {
          onYearRangeChange(d.year, d.year);
        }
      });

    // Highlight significant years
    const significantYears = [
      { year: 2024, papers: 86, label: '2024 Peak' },
      { year: 2018, papers: 64, label: '2018 Surge' }
    ];

    significantYears.forEach(({ year, label }) => {
      const yearData = yearlyData.find(d => d.year === year);
      if (yearData) {
        g.append('text')
          .attr('x', xScale(year))
          .attr('y', yScale(yearData.paperCount) - 25)
          .attr('text-anchor', 'middle')
          .attr('font-size', '12px')
          .attr('font-weight', 'bold')
          .attr('fill', '#d32f2f')
          .text(label);
      }
    });

    // Add brush for year range selection
    const brush = d3.brushX()
      .extent([[0, 0], [width, height]])
      .on('end', function(event) {
        if (!event.selection) return;
        
        const [x0, x1] = event.selection;
        const startYear = Math.round(xScale.invert(x0));
        const endYear = Math.round(xScale.invert(x1));
        
        if (onYearRangeChange) {
          onYearRangeChange(startYear, endYear);
        }
      });

    g.append('g')
      .attr('class', 'brush')
      .call(brush);

  }, [papers, selectedYearRange]);

  const processYearlyData = (papers: PaperRecord[]): YearlyStatistics[] => {
    const yearMap = new Map<number, PaperRecord[]>();
    
    papers.forEach(paper => {
      if (paper.publicationYear) {
        if (!yearMap.has(paper.publicationYear)) {
          yearMap.set(paper.publicationYear, []);
        }
        yearMap.get(paper.publicationYear)!.push(paper);
      }
    });

    return Array.from(yearMap.entries())
      .map(([year, yearPapers]) => ({
        year,
        paperCount: yearPapers.length,
        papers: yearPapers,
        topTopics: extractTopTopics(yearPapers)
      }))
      .sort((a, b) => a.year - b.year);
  };

  const extractTopTopics = (papers: PaperRecord[]): string[] => {
    const topicCounts = new Map<string, number>();
    
    papers.forEach(paper => {
      paper.tags.forEach(tag => {
        topicCounts.set(tag, (topicCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic]) => topic);
  };

  return (
    <div className="relative">
      <svg ref={svgRef} className="w-full h-auto"></svg>
      
      {hoveredYear && (
        <div 
          className="absolute bg-white border border-gray-300 rounded-lg p-3 shadow-lg z-10 pointer-events-none"
          style={{ 
            left: mousePosition.x + 10, 
            top: mousePosition.y - 10,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="font-semibold text-gray-900">
            {hoveredYear.year}
          </div>
          <div className="text-sm text-gray-600">
            {hoveredYear.paperCount} papers
          </div>
          {hoveredYear.topTopics.length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Top topics: {hoveredYear.topTopics.join(', ')}
            </div>
          )}
          <div className="text-xs text-gray-400 mt-1">
            Click to filter by this year
          </div>
        </div>
      )}
    </div>
  );
};