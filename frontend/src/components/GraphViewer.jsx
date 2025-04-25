// src/components/GraphViewer.jsx

import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import * as d3 from 'd3';
import * as THREE from 'three';
import ForceGraph3D from 'react-force-graph-3d';

import ReactEChartsCore from 'echarts-for-react';
import * as echarts from 'echarts/core';
import { GraphChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// Let ECharts know which features to use
echarts.use([GraphChart, TooltipComponent, LegendComponent, CanvasRenderer]);

/***************************************************
 * 1) Color Mappings
 ***************************************************/
export const META_CATEGORY_COLORS = {
  'input condition': '#1f77b4',
  'design driver factor': '#ff7f0e',
  'inference process': '#2ca02c',
  'result output': '#9467bd',
  'auxiliary reference': '#8c564b',
  other: '#999999',
};

export const INFO_CATEGORY_COLORS = {
  location: '#d62728',
  climate: '#bcbd22',
  disaster: '#17becf',
  projectType: '#e377c2',
  buildingFunction: '#7f7f7f',
  scaleAndSize: '#8c564b',
  structureSystem: '#ff9896',
  buildingStrategy: '#c49c94',
  isBuilt: '#f7b6d2',
  budget: '#c5b0d5',
  regulationBackground: '#1f77b4',
  other: '#999999',
};

function getMetaCategoryColor(meta) {
  return META_CATEGORY_COLORS[meta] || '#999999';
}
function getInfoCategoryColor(info) {
  return INFO_CATEGORY_COLORS[info] || '#999999';
}

/***************************************************
 * 2) Some shared utilities
 ***************************************************/
function lightenColor(hex, percent = 0.3) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.round(r + (255 - r) * percent);
  g = Math.round(g + (255 - g) * percent);
  b = Math.round(b + (255 - b) * percent);
  if (r > 255) r = 255;
  if (g > 255) g = 255;
  if (b > 255) b = 255;
  const rr = r.toString(16).padStart(2, '0');
  const gg = g.toString(16).padStart(2, '0');
  const bb = b.toString(16).padStart(2, '0');
  return `#${rr}${gg}${bb}`;
}

function fadeByDistance(dist, maxDist = 1000) {
  const d0 = 350;
  const k = 0.1;
  const ratio = 0.2 + 1 / (1 + Math.exp(k * (dist - d0)));
  return ratio;
}

/**
 * makeTextSprite: draws multiline text on a canvas => sprite for 3D ForceGraph
 */
function makeTextSprite(message, { fontsize = 70, color = '#ffffff' } = {}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const font = `${fontsize}px sans-serif`;
  ctx.font = font;

  // measure max line width
  const lines = message.split('\n');
  let maxWidth = 0;
  for (const line of lines) {
    const w = ctx.measureText(line).width;
    if (w > maxWidth) maxWidth = w;
  }
  canvas.width = maxWidth;
  canvas.height = fontsize * 1.2 * lines.length;

  ctx.font = font;
  ctx.fillStyle = color;
  lines.forEach((line, idx) => {
    ctx.fillText(line, 0, fontsize * (idx + 1));
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(0.1 * canvas.width, 0.1 * canvas.height, 1);
  return sprite;
}

// small helper for degree
function computeNodeDegrees(graphData) {
  if (!graphData?.nodes || !graphData?.edges) return graphData;
  graphData.nodes.forEach((n) => {
    n.degree = 0;
  });
  graphData.edges.forEach((edge) => {
    const sNode = graphData.nodes.find((m) => m.id === edge.source);
    if (sNode) sNode.degree++;
    const tNode = graphData.nodes.find((m) => m.id === edge.target);
    if (tNode) tNode.degree++;
  });
  return graphData;
}

/***************************************************
 * 3) GraphViewerCytoscape
 ***************************************************/
function GraphViewerCytoscape({ graphData }) {
  const elements = useMemo(() => {
    if (!graphData || !graphData.nodes) return [];
    const nodeElements = graphData.nodes.map((n) => ({
      data: { id: n.id, label: n.label, ...n },
    }));
    const edgeElements = (graphData.edges || []).map((e, idx) => ({
      data: {
        id: e.id || `edge-${idx}`,
        source: e.source,
        target: e.target,
        label: e.relation || '',
      },
    }));
    return [...nodeElements, ...edgeElements];
  }, [graphData]);

  function pickNodeColor(ele) {
    const meta = ele.data('metaCategory');
    const info = ele.data('infoCategory');
    if (meta && meta !== 'other') {
      return getMetaCategoryColor(meta);
    }
    if (info && info !== 'other') {
      return getInfoCategoryColor(info);
    }
    return '#999999';
  }

  const stylesheet = [
    {
      selector: 'node',
      style: {
        label: 'data(label)',
        'font-size': 12,
        'text-wrap': 'wrap',
        'text-max-width': '200px', // can tweak
      },
    },
    {
      selector: 'node',
      style: {
        'background-color': pickNodeColor,
        shape: (ele) => {
          const type = ele.data('type');
          if (type === 'doc') return 'diamond';
          return 'ellipse';
        },
        'border-width': 1,
        'border-color': '#aaa',
      },
    },
    {
      selector: 'edge',
      style: {
        'line-color': '#999',
        'target-arrow-color': '#999',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        label: 'data(label)',
        'font-size': 10,
        'text-background-color': '#fff',
        'text-background-opacity': 1,
      },
    },
  ];

  const layout = { name: 'cose', animate: true };

  return (
    <div style={{ width: '100%', height: '800px', border: '1px solid #ccc' }}>
      <CytoscapeComponent
        elements={elements}
        style={{ width: '100%', height: '100%' }}
        layout={layout}
        stylesheet={stylesheet}
      />
    </div>
  );
}

/***************************************************
 * 4) GraphViewerD3Force
 ***************************************************/
function GraphViewerD3Force({ graphData }) {
  const svgRef = useRef(null);
  const width = 600;
  const height = 600;
  const containerRef = useRef(null);

  useEffect(() => {
    if (!graphData || !graphData.nodes?.length) return;
    computeNodeDegrees(graphData);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const container = svg.append('g');

    const links = (graphData.edges || []).map((e) => ({
      ...e,
      source: e.source,
      target: e.target,
    }));
    const nodes = graphData.nodes.map((n) => ({ ...n }));

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(80)
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const linkGroup = container.append('g').attr('class', 'links');
    const linkElems = linkGroup
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.8);

    const nodeGroup = container.append('g').attr('class', 'nodes');
    const nodeElems = nodeGroup
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', (d) => {
        d.radius = 6 + (d.degree || 0);
        return d.radius;
      })
      .attr('fill', (d) => {
        const meta = d.metaCategory || 'other';
        const info = d.infoCategory || 'other';
        if (meta !== 'other') return getMetaCategoryColor(meta);
        if (info !== 'other') return getInfoCategoryColor(info);
        return '#999999';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .call(
        d3
          .drag()
          .on('start', dragStarted)
          .on('drag', dragged)
          .on('end', dragEnded)
      );

    // For multiline label via <tspan>, parse \n
    const labelGroup = container.append('g').attr('class', 'labels');
    const labelElems = labelGroup
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .style('fill', '#eee')
      .style('font-size', '12px')
      .each(function (d) {
        const lines = (d.label || '').split('\n');
        d3.select(this)
          .selectAll('tspan')
          .data(lines)
          .enter()
          .append('tspan')
          .attr('x', 0)
          .attr('dy', (dd, i) => (i === 0 ? 0 : 1.2) + 'em')
          .text((dd) => dd);
      });

    simulation.on('tick', () => {
      linkElems
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);

      nodeElems.attr('cx', (d) => d.x).attr('cy', (d) => d.y);

      labelElems.attr('transform', function (d) {
        // place label to the right of node
        return `translate(${d.x + d.radius + 3}, ${d.y - 2})`;
      });
    });

    const zoom = d3
      .zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });
    svg.call(zoom).call(zoom.transform, d3.zoomIdentity);

    function dragStarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    function dragEnded(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  }, [graphData]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '600px', position: 'relative' }}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ border: '1px solid #ccc', background: '#111' }}
      ></svg>
    </div>
  );
}

/***************************************************
 * 5) GraphViewerReactForceGraph
 ***************************************************/
function GraphViewerReactForceGraph({ graphData }) {
  const fgRef = useRef(null);

  useEffect(() => {
    if (!graphData?.nodes) return;
    computeNodeDegrees(graphData);
  }, [graphData]);

  const nodeThreeObject = useCallback((node) => {
    const mainColor = pickNodeColor(node);
    const deg = node.degree || 0;
    const radius = (0.1 + Math.sqrt(deg)) * 1;

    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = new THREE.MeshLambertMaterial({
      color: mainColor,
      transparent: true,
      opacity: 1,
    });
    const sphere = new THREE.Mesh(geometry, material);

    if (node.label) {
      const sprite = makeTextSprite(node.label, {
        fontsize: 40,
        color: lightenColor(mainColor, 0.5),
      });
      sprite.position.set(0, radius + 0.5, 0);
      sphere.add(sprite);
    }
    return sphere;
  }, []);

  const handleEngineTick = useCallback(() => {
    if (!fgRef.current) return;
    const fgInstance = fgRef.current;
    const camera = fgInstance.camera();
    if (!camera || !graphData?.nodes) return;

    graphData.nodes.forEach((node) => {
      const nodeObj = node.__threeObj;
      if (!nodeObj) return;
      const worldPos = new THREE.Vector3();
      nodeObj.getWorldPosition(worldPos);
      const dist = camera.position.distanceTo(worldPos);
      const fadeRatio = fadeByDistance(dist, 1000);
      if (nodeObj.material) {
        nodeObj.material.opacity = fadeRatio;
      }
      nodeObj.children.forEach((child) => {
        if (child.material) {
          child.material.opacity = fadeRatio;
        }
      });
    });
  }, [graphData]);

  return (
    <div style={{ width: '100%', height: '600px', border: '1px solid red' }}>
      <ForceGraph3D
        ref={fgRef}
        graphData={{
          nodes: graphData?.nodes || [],
          links: (graphData?.edges || []).map((e) => ({
            source: e.source,
            target: e.target,
            rel: e.relation || '',
          })),
        }}
        nodeThreeObject={nodeThreeObject}
        linkCurvature={0.3}
        linkCurveRotation={0}
        linkAutoColorBy="rel"
        linkDirectionalArrowLength={3}
        linkDirectionalArrowRelPos={1}
        linkOpacity={0.7}
        linkWidth={0.5}
        onEngineTick={handleEngineTick}
        showNavInfo={false}
        backgroundColor="#111111"
        enableNodeDrag={true}
      />
    </div>
  );
}

// helper pick color
function pickNodeColor(node) {
  const meta = node.metaCategory || 'other';
  const info = node.infoCategory || 'other';
  if (meta !== 'other') return getMetaCategoryColor(meta);
  if (info !== 'other') return getInfoCategoryColor(info);
  return '#999999';
}

/***************************************************
 * 6) GraphViewerECharts
 ***************************************************/
// function GraphViewerECharts({ graphData }) {
//   // convert to ECharts 'graph' series
//   const { nodes = [], edges = [] } = graphData || {};

//   const option = useMemo(() => {
//     const seriesData = nodes.map((n) => ({
//       name: n.id,
//       value: n.label,
//       category:
//         n.metaCategory && n.metaCategory !== 'other'
//           ? n.metaCategory
//           : n.infoCategory || 'other',
//       // ECharts label: we can do a small multiline if there's \n
//       symbolSize: 30,
//     }));
//     const seriesEdges = edges.map((e) => ({
//       source: e.source,
//       target: e.target,
//       label: { formatter: e.relation || '' },
//     }));

//     // ECharts "categories" + color
//     // We'll create categories from meta + info?
//     // For minimal example, let's just define "other" and "some" ...
//     // or we dynamically create categories. We'll do a quick approach:
//     const categorySet = new Set();
//     seriesData.forEach((d) => {
//       categorySet.add(d.category);
//     });
//     const categories = Array.from(categorySet).map((c) => ({
//       name: c,
//       itemStyle: {
//         color: META_CATEGORY_COLORS[c] || INFO_CATEGORY_COLORS[c] || '#999999',
//       },
//     }));

//     return {
//       tooltip: {},
//       legend: [
//         {
//           data: categories.map((c) => c.name),
//         },
//       ],
//       series: [
//         {
//           name: 'Graph',
//           type: 'graph',
//           layout: 'force',
//           categories,
//           data: seriesData,
//           links: seriesEdges,
//           label: {
//             show: true,
//             formatter: (params) => {
//               // `params.value` is the node.label with possible \n
//               return params.value?.replace(/\\n/g, '\n');
//             },
//           },
//           force: {
//             repulsion: 100,
//             gravity: 0.03,
//           },
//           roam: true,
//           edgeSymbol: ['none', 'arrow'],
//         },
//       ],
//     };
//   }, [graphData]);

//   return (
//     <div style={{ width: '100%', height: '600px' }}>
//       <ReactEChartsCore
//         echarts={echarts}
//         option={option}
//         style={{ width: '100%', height: '100%' }}
//       />
//     </div>
//   );
// }

/***************************************************
 * 7) Main exported GraphViewer
 ***************************************************/
export default function GraphViewer({ graphData, library = 'd3Force' }) {
  switch (library) {
    case 'd3Force':
      return <GraphViewerD3Force graphData={graphData} />;
    case 'cytoscape':
      return <GraphViewerCytoscape graphData={graphData} />;
    case 'ReactForceGraph3d':
      return <GraphViewerReactForceGraph graphData={graphData} />;
    // case 'echarts':
    //   return <GraphViewerECharts graphData={graphData} />;
    default:
      return <div>No library selected or unsupported: {library}</div>;
  }
}
