import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { AuthorNode, CollaborationEdge } from '../types';
import { analyzeAuthorNetwork, findProlificAuthors } from '../utils/authorAnalysis';

interface AuthorNetworkVisualizationProps {
  authors: AuthorNode[];
  onAuthorSelect?: (authorId: string) => void;
  selectedAuthor?: string;
  maxAuthors?: number;
}

interface NetworkNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  paperCount: number;
  influence: number;
  primaryTopics: string[];
  isProlific: boolean;
}

interface NetworkLink extends d3.SimulationLinkDatum<NetworkNode> {
  source: string | NetworkNode;
  target: string | NetworkNode;
  weight: number;
}

export const AuthorNetworkVisualization: React.FC<AuthorNetworkVisualizationProps> = ({
  authors,
  onAuthorSelect,
  selectedAuthor,
  maxAuthors = 50
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredAuthor, setHoveredAuthor] = useState<NetworkNode | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAuthors, setFilteredAuthors] = useState<AuthorNode[]>([]);

  useEffect(() => {
    // Filter authors based on search term
    const filtered = authors.filter(author =>
      author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      author.primaryTopics.some(topic => 
        topic.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredAuthors(filtered.slice(0, maxAuthors));
  }, [authors, searchTerm, maxAuthors]);

  useEffect(() => {
    if (!svgRef.current || filteredAuthors.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Set up dimensions
    const width = 800;
    const height = 600;
    
    svg.attr('width', width).attr('height', height);

    // Identify prolific authors
    const prolificAuthorNames = [
      'tyler moore', 'ross anderson', 'ken huang', 'quanyan zhu'
    ];

    // Create nodes
    const nodes: NetworkNode[] = filteredAuthors.map(author => ({
      id: author.id,
      name: author.name,
      paperCount: author.paperCount,
      influence: author.influence,
      primaryTopics: author.primaryTopics,
      isProlific: prolificAuthorNames.some(name => 
        author.name.toLowerCase().includes(name)
      )
    }));

    // Create links based on collaboration (simplified - in real implementation, 
    // this would come from the collaboration analysis)
    const links: NetworkLink[] = [];
    
    // For demo purposes, create some connections between authors with similar topics
    nodes.forEach((node, i) => {
      nodes.slice(i + 1).forEach(otherNode => {
        const sharedTopics = node.primaryTopics.filter(topic =>
          otherNode.primaryTopics.includes(topic)
        );
        
        if (sharedTopics.length > 0 && Math.random() < 0.1) { // 10% chance of connection
          links.push({
            source: node.id,
            target: otherNode.id,
            weight: sharedTopics.length
          });
        }
      });
    });

    // Set up scales
    const radiusScale = d3.scaleSqrt()
      .domain([0, d3.max(nodes, d => d.paperCount) || 1])
      .range([3, 15]);

    const colorScale = d3.scaleOrdinal()
      .domain(['Security', 'Economics', 'Game Theory', 'Risk', 'AI/ML', 'Network', 'Privacy'])
      .range(d3.schemeCategory10);

    // Create force simulation
    const simulation = d3.forceSimulation<NetworkNode>(nodes)
      .force('link', d3.forceLink<NetworkNode, NetworkLink>(links)
        .id(d => d.id)
        .distance(50)
        .strength(d => d.weight * 0.1)
      )
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => radiusScale(d.paperCount) + 2));

    // Create container group
    const g = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Add links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt(d.weight));

    // Add nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', d => radiusScale(d.paperCount))
      .attr('fill', d => {
        if (d.isProlific) return '#dc2626'; // red for prolific authors
        return colorScale(d.primaryTopics[0] || 'Other');
      })
      .attr('stroke', d => selectedAuthor === d.id ? '#1d4ed8' : '#fff')
      .attr('stroke-width', d => selectedAuthor === d.id ? 3 : 1.5)
      .style('cursor', 'pointer')
      .call(d3.drag<SVGCircleElement, NetworkNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      );

    // Add labels for prolific authors
    const labels = g.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(nodes.filter(d => d.isProlific || d.paperCount > 8))
      .enter()
      .append('text')
      .text(d => d.name)
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .attr('dy', d => radiusScale(d.paperCount) + 12)
      .attr('fill', '#333')
      .style('pointer-events', 'none');

    // Add hover interactions
    node
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('stroke-width', 3)
          .attr('r', radiusScale(d.paperCount) * 1.2);
        
        setHoveredAuthor(d);
        setMousePosition({ x: event.pageX, y: event.pageY });
      })
      .on('mousemove', function(event) {
        setMousePosition({ x: event.pageX, y: event.pageY });
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('stroke-width', selectedAuthor === d.id ? 3 : 1.5)
          .attr('r', radiusScale(d.paperCount));
        
        setHoveredAuthor(null);
      })
      .on('click', function(event, d) {
        if (onAuthorSelect) {
          onAuthorSelect(d.id);
        }
      });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as NetworkNode).x!)
        .attr('y1', d => (d.source as NetworkNode).y!)
        .attr('x2', d => (d.target as NetworkNode).x!)
        .attr('y2', d => (d.target as NetworkNode).y!);

      node
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!);

      labels
        .attr('x', d => d.x!)
        .attr('y', d => d.y!);
    });

    // Drag functions
    function dragstarted(event: d3.D3DragEvent<SVGCircleElement, NetworkNode, NetworkNode>) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: d3.D3DragEvent<SVGCircleElement, NetworkNode, NetworkNode>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGCircleElement, NetworkNode, NetworkNode>) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Cleanup
    return () => {
      simulation.stop();
    };

  }, [filteredAuthors, selectedAuthor, onAuthorSelect]);

  return (
    <div className="relative">
      {/* Search and Controls */}
      <div className="mb-4 flex gap-4 items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search authors or topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-sm text-gray-600">
          Showing {filteredAuthors.length} of {authors.length} authors
        </div>
      </div>

      {/* Network Visualization */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <svg ref={svgRef} className="w-full h-auto bg-gray-50"></svg>
      </div>

      {/* Tooltip */}
      {hoveredAuthor && (
        <div 
          className="absolute bg-white border border-gray-300 rounded-lg p-3 shadow-lg z-10 pointer-events-none max-w-xs"
          style={{ 
            left: mousePosition.x + 10, 
            top: mousePosition.y - 10,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="font-semibold text-gray-900">
            {hoveredAuthor.name}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {hoveredAuthor.paperCount} papers
          </div>
          <div className="text-sm text-gray-600">
            Influence: {hoveredAuthor.influence.toFixed(1)}
          </div>
          {hoveredAuthor.primaryTopics.length > 0 && (
            <div className="text-xs text-gray-500 mt-2">
              <div className="font-medium">Primary Topics:</div>
              <div>{hoveredAuthor.primaryTopics.join(', ')}</div>
            </div>
          )}
          {hoveredAuthor.isProlific && (
            <div className="text-xs text-red-600 font-medium mt-1">
              Prolific Author
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-300 rounded-lg p-3">
          <div className="text-sm font-semibold text-gray-900 mb-2">Node Size</div>
          <div className="text-xs text-gray-600">
            Node size represents the number of papers published by each author.
            Larger nodes indicate more prolific authors.
          </div>
        </div>
        
        <div className="bg-white border border-gray-300 rounded-lg p-3">
          <div className="text-sm font-semibold text-gray-900 mb-2">Colors & Highlights</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <span>Prolific Authors (Tyler Moore, Ross Anderson, etc.)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Selected Author</span>
            </div>
            <div className="text-gray-500 mt-1">
              Other colors represent primary research topics
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="mt-4 bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{authors.length}</div>
            <div className="text-sm text-gray-600">Total Authors</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {authors.filter(a => a.paperCount > 5).length}
            </div>
            <div className="text-sm text-gray-600">Active Researchers</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(authors.reduce((sum, a) => sum + a.paperCount, 0) / authors.length * 10) / 10}
            </div>
            <div className="text-sm text-gray-600">Avg Papers/Author</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {authors.filter(a => a.primaryTopics.length > 2).length}
            </div>
            <div className="text-sm text-gray-600">Interdisciplinary</div>
          </div>
        </div>
      </div>
    </div>
  );
};