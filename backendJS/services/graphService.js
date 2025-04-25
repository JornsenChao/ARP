import { loadFrameworkData } from '../frameworks/frameworkManager.js';

/**
 * 简易的多行插入: 每 lineLen 字符插入 '\n'
 */
function insertLineBreaks(str, lineLen = 40) {
  if (!str) return '';
  const parts = [];
  for (let i = 0; i < str.length; i += lineLen) {
    parts.push(str.slice(i, i + lineLen));
  }
  return parts.join('\n');
}

function normalizeFileKey(rawKey) {
  if (!rawKey) return 'unknownFile';
  // 假设你想去掉 _chunk 之类:
  // e.g. "fema-case-studies.csv_0" => "fema-case-studies.csv"
  // or "fema-case-studies.csv_12" => "fema-case-studies.csv"
  const match = rawKey.match(/^(.*\.csv)/i); // 只要匹配到 .csv 就截断
  if (match) {
    return match[1]; // "fema-case-studies.csv"
  }
  // 若没匹配 => 原值
  return rawKey;
}

export const graphService = {
  /**
   * buildGraphDataFromDocs(docs, frameworkName)
   *   - docs[].metadata.columnData => colName, cellValue, infoCategory, metaCategory
   *   - 同 fileKey => 同 doc node
   *   - 长文本自动插入 \n
   *   - colVal node 以 meta+info+cellValue => 跨文件合并
   */
  async buildGraphDataFromDocs(docs, frameworkName) {
    if (!docs || docs.length === 0) {
      return { nodes: [], edges: [] };
    }

    // 如果需要根据 frameworkName 做一些额外处理，也可以在这里
    let frameworkData = null;
    if (frameworkName) {
      frameworkData = loadFrameworkData(frameworkName);
    }

    // 存放最终 graph 结果
    const nodesMap = {}; // key => nodeObj
    const edges = [];

    // 记录 fileKey => docNodeId
    const docNodesMap = {};

    // local + global map 用于合并 colVal
    const localNodesMap = {};
    const globalNodesMap = {};

    docs.forEach((doc, i) => {
      let rawFileKey = doc.metadata?.fileKey || `unknownFile_${i}`;
      // 1) 统一处理
      const fileKey = normalizeFileKey(rawFileKey);

      if (!docNodesMap[fileKey]) {
        const docNodeId = `doc-${fileKey}`;
        const fileName = doc.metadata?.fileName || fileKey;
        nodesMap[docNodeId] = {
          id: docNodeId,
          label: fileName,
          type: 'doc',
        };
        docNodesMap[fileKey] = docNodeId;
      }
    });

    docs.forEach((doc, idx) => {
      const fileKey = doc.metadata?.fileKey || `unknownFile_${idx}`;
      const docNodeId = docNodesMap[fileKey];

      const colData = doc.metadata?.columnData || [];
      colData.forEach((colObj, colIdx) => {
        const colName = colObj.colName || `col-${colIdx}`;
        const metaC = colObj.metaCategory || 'other';
        const infoC = colObj.infoCategory || 'other';

        let valRaw = (colObj.cellValue || '').trim();
        if (valRaw.length > 80) {
          valRaw = insertLineBreaks(valRaw, 60);
        }
        if (!valRaw) return;

        // localKey => 同文件 + 同列 => 不同列不合并
        const localKey = `${fileKey}::${colName}::${valRaw}`;
        // globalKey => meta+info+val => 跨文件可合并
        const globalKey = `${metaC}::${infoC}::${valRaw}`;

        let foundNodeId = localNodesMap[localKey];
        if (!foundNodeId) {
          foundNodeId = globalNodesMap[globalKey];
        }

        if (!foundNodeId) {
          // create new node
          const newNodeId = `valNode-${Object.keys(nodesMap).length}`;
          nodesMap[newNodeId] = {
            id: newNodeId,
            label: valRaw,
            type: 'colVal',
            metaCategory: metaC,
            infoCategory: infoC,
          };
          foundNodeId = newNodeId;
          localNodesMap[localKey] = newNodeId;
          globalNodesMap[globalKey] = newNodeId;
        } else {
          localNodesMap[localKey] = foundNodeId;
          globalNodesMap[globalKey] = foundNodeId;
        }

        edges.push({
          id: `edge-${docNodeId}-${foundNodeId}-${colIdx}`,
          source: docNodeId,
          target: foundNodeId,
          relation: 'hasValue',
        });
      });
    });

    const nodes = Object.values(nodesMap);
    return {
      nodes,
      edges,
    };
  },
};
