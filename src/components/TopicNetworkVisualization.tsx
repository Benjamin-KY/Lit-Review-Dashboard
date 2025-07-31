import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  NodeTypes,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { TopicCluster, PaperRecord } from '../types';

interface TopicNetworkVisualizationProps {
  topicClusters: TopicCluster[];
  onTopicSelect?: (topicId: string, papers: PaperRecord[]) => void;
  selectedTopic?: string;
}

// Custom Topic Node Component
const TopicNode: React.FC<{
  data: {
    label: string;
    size: number;
    coverage: number;
    paperCount: number;
    isSelected: boolean;
    onClick: () => void;
  };
}> = ({ data }) => {
  const nodeSize = Math.max(40, Math.min(120, data.size * 2));
  const fontSize = Math.max(10, Math.min(14, nodeSize / 8));
  
  return (
    <div
      className={`relative flex items-center justify-center rounded-full border-2 cursor-pointer transition-all duration-200 ${
        data.isSelected
          ? 'border-blue-600 bg-blue-100 shadow-lg scale-110'
          : 'border-gray-400 bg-white hover:border-blue-400 hover:shadow-md hover:scale-105'
      }`}
      style={{
        width: nodeSize,
        height: nodeSize,
      }}
      onClick={data.onClick}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
      
      <div className="text-center p-1">
        <div 
          className="font-semibold text-gray-800 leading-tight"
          style={{ fontSize: `${fontSize}px` }}
        >
          {data.label}
        </div>
        <div 
          className="text-gray-600 text-xs mt-1"
          style={{ fontSize: `${fontSize - 2}px` }}
        >
          {data.coverage.toFixed(1)}%
        </div>
      </div>
      
      {/* Coverage indicator ring */}
      <div
        className="absolute inset-0 rounded-full border-4 opacity-30"
        style={{
          borderColor: getCoverageColor(data.coverage),
          borderWidth: Math.max(2, nodeSize / 20),
        }}
      />
    </div>
  );
};

const getCoverageColor = (coverage: number): string => {
  if (coverage >= 70) return '#ef4444'; // red-500
  if (coverage >= 50) return '#f97316'; // orange-500
  if (coverage >= 30) return '#eab308'; // yellow-500
  if (coverage >= 15) return '#22c55e'; // green-500
  return '#6366f1'; // indigo-500
};

const nodeTypes: NodeTypes = {
  topicNode: TopicNode,
};

export const TopicNetworkVisualization: React.FC<TopicNetworkVisualizationProps> = ({
  topicClusters,
  onTopicSelect,
  selectedTopic
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedTopicData, setSelectedTopicData] = useState<TopicCluster | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  useEffect(() => {
    if (topicClusters.length === 0) return;

    // Create nodes
    const newNodes: Node[] = topicClusters.map((cluster, index) => {
      const angle = (index / topicClusters.length) * 2 * Math.PI;
      const radius = 200;
      const x = 400 + radius * Math.cos(angle);
      const y = 300 + radius * Math.sin(angle);

      return {
        id: cluster.id,
        type: 'topicNode',
        position: { x, y },
        data: {
          label: cluster.label,
          size: cluster.size,
          coverage: cluster.coverage,
          paperCount: cluster.papers.length,
          isSelected: selectedTopic === cluster.id,
          onClick: () => handleTopicClick(cluster),
        },
        draggable: true,
      };
    });

    // Create edges based on topic connections
    const newEdges: Edge[] = [];
    topicClusters.forEach(cluster => {
      cluster.connections.forEach(connectedTopicId => {
        const targetCluster = topicClusters.find(c => c.id === connectedTopicId);
        if (targetCluster) {
          // Calculate edge strength based on shared papers
          const sharedPapers = cluster.papers.filter(p =>
            targetCluster.papers.some(tp => tp.key === p.key)
          );
          const strength = sharedPapers.length / Math.min(cluster.size, targetCluster.size);
          
          // Only add edge if not already exists (avoid duplicates)
          const edgeExists = newEdges.some(e => 
            (e.source === cluster.id && e.target === connectedTopicId) ||
            (e.source === connectedTopicId && e.target === cluster.id)
          );
          
          if (!edgeExists && strength > 0.1) {
            newEdges.push({
              id: `${cluster.id}-${connectedTopicId}`,
              source: cluster.id,
              target: connectedTopicId,
              style: {
                strokeWidth: Math.max(1, strength * 8),
                stroke: '#94a3b8',
                opacity: 0.6,
              },
              animated: false,
            });
          }
        }
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [topicClusters, selectedTopic]);

  const handleTopicClick = (cluster: TopicCluster) => {
    setSelectedTopicData(cluster);
    if (onTopicSelect) {
      onTopicSelect(cluster.id, cluster.papers);
    }
  };

  return (
    <div className="w-full h-96 border border-gray-300 rounded-lg relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls />
        <Background />
      </ReactFlow>
      
      {/* Topic Details Panel */}
      {selectedTopicData && (
        <div className="absolute top-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-xs z-10">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-900">{selectedTopicData.label}</h3>
            <button
              onClick={() => setSelectedTopicData(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Papers:</span>
              <span className="font-medium">{selectedTopicData.size}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Coverage:</span>
              <span className="font-medium">{selectedTopicData.coverage.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Connections:</span>
              <span className="font-medium">{selectedTopicData.connections.length}</span>
            </div>
          </div>
          
          {selectedTopicData.connections.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-gray-500 mb-1">Connected Topics:</div>
              <div className="flex flex-wrap gap-1">
                {selectedTopicData.connections.slice(0, 3).map(connId => {
                  const connectedTopic = topicClusters.find(c => c.id === connId);
                  return connectedTopic ? (
                    <span
                      key={connId}
                      className="px-2 py-1 bg-gray-100 text-xs rounded cursor-pointer hover:bg-gray-200"
                      onClick={() => handleTopicClick(connectedTopic)}
                    >
                      {connectedTopic.label}
                    </span>
                  ) : null;
                })}
                {selectedTopicData.connections.length > 3 && (
                  <span className="text-xs text-gray-400">
                    +{selectedTopicData.connections.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
          
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Recent Papers:</div>
            <div className="max-h-20 overflow-y-auto">
              {selectedTopicData.papers.slice(0, 3).map(paper => (
                <div key={paper.key} className="text-xs text-gray-700 mb-1 truncate">
                  {paper.title}
                </div>
              ))}
              {selectedTopicData.papers.length > 3 && (
                <div className="text-xs text-gray-400">
                  +{selectedTopicData.papers.length - 3} more papers
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white border border-gray-300 rounded-lg p-3 shadow-lg">
        <div className="text-sm font-semibold text-gray-900 mb-2">Topic Coverage</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: '#ef4444' }}></div>
            <span>70%+ High Impact</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: '#f97316' }}></div>
            <span>50-70% Major</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: '#eab308' }}></div>
            <span>30-50% Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: '#22c55e' }}></div>
            <span>15-30% Emerging</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: '#6366f1' }}></div>
            <span>&lt;15% Niche</span>
          </div>
        </div>
      </div>
    </div>
  );
};