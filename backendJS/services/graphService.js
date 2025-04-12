import { loadFrameworkData } from '../frameworks/frameworkManager.js';

export const graphService = {
  async buildGraphDataFromDocs(docs, frameworkName) {
    if (!docs || docs.length === 0) {
      return { nodes: [], edges: [] };
    }

    let frameworkData = null;
    if (frameworkName) {
      frameworkData = loadFrameworkData(frameworkName);
    }

    const nodesMap = {};
    const edges = [];

    docs.forEach((doc, idx) => {
      const strategyId = `strategy-${idx}`;
      const label = doc.pageContent.slice(0, 50).replace(/\n/g, ' ');
      if (!nodesMap[strategyId]) {
        nodesMap[strategyId] = {
          id: strategyId,
          label,
          type: 'strategy',
        };
      }

      // dependency
      const depVal = doc.metadata?.dependency || '';
      depVal
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((d) => {
          const depId = `dep-${d}`;
          if (!nodesMap[depId]) {
            nodesMap[depId] = {
              id: depId,
              label: d,
              type: 'dependency',
            };
          }
          edges.push({
            source: strategyId,
            target: depId,
            relation: 'addresses',
          });
        });

      // reference
      const refVal = doc.metadata?.reference || '';
      refVal
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((r) => {
          const refId = `ref-${r}`;
          if (!nodesMap[refId]) {
            nodesMap[refId] = {
              id: refId,
              label: r,
              type: 'reference',
            };
          }
          edges.push({
            source: strategyId,
            target: refId,
            relation: 'references',
          });
        });

      // framework
      if (frameworkData && frameworkData.dimensions) {
        const lower = doc.pageContent.toLowerCase();
        frameworkData.dimensions.forEach((dim) => {
          const hits = dim.keywords.filter((kw) =>
            lower.includes(kw.toLowerCase())
          );
          if (hits.length > 0) {
            const dimId = `fw-${dim.id}`;
            if (!nodesMap[dimId]) {
              nodesMap[dimId] = {
                id: dimId,
                label: dim.name,
                type: 'frameworkDimension',
              };
            }
            edges.push({
              source: strategyId,
              target: dimId,
              relation: 'alignedWith',
            });
          }
        });
      }
    });

    return {
      nodes: Object.values(nodesMap),
      edges,
    };
  },
};
