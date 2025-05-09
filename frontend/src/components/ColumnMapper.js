// src/components/ColumnMapper.js
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Select,
  MenuItem,
} from '@mui/material';

/**
 * ColumnMapper
 *   props:
 *     columns:        array   → e.g. ['Project Name', 'Climate', 'Strategy', 'Budget']
 *     columnSchema:   array   → e.g. [{ columnName:'Project Name', infoCategory:'location', metaCategory:'input condition' }]
 *     setColumnSchema: setter → updates parent state
 */
const infoCategories = [
  // '地理位置',
  // '气候',
  // '灾害',
  // '项目类型',
  // '建筑功能',
  // '体量与尺度',
  // '结构系统',
  // '建筑策略',
  // '是否建成',
  // '预算/投资',
  // '法规背景',
  // '其他',
  'location',
  'climate',
  'disaster',
  'projectType',
  'buildingFunction',
  'scaleAndSize',
  'structureSystem',
  'buildingStrategy',
  'isBuilt',
  'budget',
  'regulationBackground',
  'other',
];

const metaCategories = [
  // '输入条件',
  // '设计驱动因素',
  // '推理过程',
  // '结果输出',
  // '辅助参考',
  'input condition',
  'design driver factor',
  'inference process',
  'result output',
  'auxiliary reference',
];

const ColumnMapper = ({ columns, columnSchema, setColumnSchema }) => {
  // 构造一个 map: { colName -> {infoCategory, metaCategory} }
  // 如果 columnSchema 里还没有该列，就默认 { infoCategory:'', metaCategory:'' }

  // 先把 columnSchema 转成 map
  const [schemaMap, setSchemaMap] = useState({});

  useEffect(() => {
    const temp = {};
    columns.forEach((col) => {
      const existing = columnSchema.find((x) => x.columnName === col);
      temp[col] = existing
        ? { 
          infoCategory: existing.infoCategory, 
            metaCategory: existing.metaCategory,
        }
        : { infoCategory: '', metaCategory: '' };
    });
    setSchemaMap(temp);
  }, [columns, columnSchema]);

  const handleChange = (colName, field, value) => {
    const updated = {
      ...schemaMap,
      [colName]: { ...schemaMap[colName], [field]: value },
    };
    setSchemaMap(updated);

    // flatten back to array for parent
    const newSchemaArray = Object.entries(updated).map(([columnName, obj]) => ({
      columnName,
      infoCategory: obj.infoCategory,
      metaCategory: obj.metaCategory,
    }));
    setColumnSchema(newSchemaArray);
  };

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={{ fontWeight: 600 }}>Column</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Info&nbsp;Category</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Meta&nbsp;Category</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {columns.map((col) => {
          const { infoCategory, metaCategory } = schemaMap[col] || {};
          return (
            <TableRow key={col}>
              <TableCell>{col}</TableCell>

              <TableCell>
                <Select
                  value={infoCategory}
                  onChange={(e) =>
                    handleChange(col, 'infoCategory', e.target.value)
                  }
                  displayEmpty
                  size="small"
                  sx={{ width: 180 }}
                >
                  <MenuItem value="" disabled>
                    Select Info Category
                  </MenuItem>
                  {infoCategories.map((ic) => (
                    <MenuItem key={ic} value={ic}>
                      {ic}
                    </MenuItem>
                  ))}
                </Select>
              </TableCell>

              <TableCell>
                <Select
                  value={metaCategory}
                  onChange={(e) =>
                    handleChange(col, 'metaCategory', e.target.value)
                  }
                  displayEmpty
                  size="small"
                  sx={{ width: 180 }}
                >
                  {/* <MenuItem value="" disabled>
                    Select Meta Category
                  </MenuItem> */}
                  {metaCategories.map((mc) => (
                    <MenuItem key={mc} value={mc}>
                      {mc}
                    </MenuItem>
                  ))}
                </Select>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default ColumnMapper;
