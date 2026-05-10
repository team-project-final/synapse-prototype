import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { Graph, GraphNode } from '@/lib/graph';

interface SimNode extends d3.SimulationNodeDatum, GraphNode {}
interface SimEdge extends d3.SimulationLinkDatum<SimNode> {
  source: string | SimNode;
  target: string | SimNode;
}

interface Props {
  graph: Graph;
  highlight?: Set<string>;
  onNodeClick?: (id: string) => void;
}

export function GraphCanvas({ graph, highlight, onNodeClick }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svg = d3.select(svgEl);
    const width = svgEl.clientWidth || 800;
    const height = svgEl.clientHeight || 600;
    svg.selectAll('*').remove();

    const g = svg.append('g');
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on('zoom', (event) => g.attr('transform', event.transform.toString()));
    svg.call(zoom);

    const nodes: SimNode[] = graph.nodes.map((n) => ({ ...n }));
    const edges: SimEdge[] = graph.edges.map((e) => ({ source: e.source, target: e.target }));

    const sim = d3
      .forceSimulation<SimNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<SimNode, SimEdge>(edges)
          .id((d) => d.id)
          .distance(80),
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = g
      .append('g')
      .attr('stroke', '#A8A29E')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(edges)
      .enter()
      .append('line')
      .attr('stroke-width', 1);

    const node = g
      .append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .style('cursor', 'pointer');
    node
      .append('circle')
      .attr('r', (d) => 8 + Math.sqrt(d.degree) * 3)
      .attr('fill', (d) => (highlight?.has(d.id) ? '#0D9488' : '#D97706'))
      .attr('stroke', '#FAFAF9')
      .attr('stroke-width', 2);
    node
      .append('text')
      .text((d) => d.title)
      .attr('font-size', 11)
      .attr('font-family', 'Plus Jakarta Sans')
      .attr('fill', '#292524')
      .attr('dx', 12)
      .attr('dy', 4);

    let dragStartX = 0;
    let dragStartY = 0;
    node.call(
      d3
        .drag<SVGGElement, SimNode>()
        .on('start', (event, d) => {
          if (!event.active) sim.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
          dragStartX = event.x;
          dragStartY = event.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) sim.alphaTarget(0);
          d.fx = null;
          d.fy = null;
          const dx = event.x - dragStartX;
          const dy = event.y - dragStartY;
          if (dx * dx + dy * dy < 9) onNodeClick?.(d.id);
        }),
    );

    sim.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as SimNode).x ?? 0)
        .attr('y1', (d) => (d.source as SimNode).y ?? 0)
        .attr('x2', (d) => (d.target as SimNode).x ?? 0)
        .attr('y2', (d) => (d.target as SimNode).y ?? 0);
      node.attr('transform', (d) => `translate(${d.x ?? 0}, ${d.y ?? 0})`);
    });

    return () => {
      sim.stop();
    };
  }, [graph, highlight, onNodeClick]);

  return <svg ref={svgRef} className="w-full h-[600px] bg-stone-50 rounded-md" />;
}
