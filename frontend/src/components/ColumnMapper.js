import React, { useState, useEffect } from 'react';
import { Select, Table, Space } from 'antd';
const { Option } = Select;

/**
 * ColumnMapper
 *   props:
 *     columns: array of columnName (strings)
 *     columnMap, setColumnMap -> 之前是 dependencyCol/strategyCol
 *   改成 columnSchema + setColumnSchema
 *
 * Demo usage:
 *   <ColumnMapper
 *     columns={columns}  // e.g. ['Project Name','Climate','Strategy','Budget']
 *     columnSchema={columnSchema} // e.g. [ { columnName:'Project Name', infoCategory:'项目类型', metaCategory:'输入条件'}, ...]
 *     setColumnSchema={setColumnSchema}
 *   />
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

  // 当用户选 infoCategory/metaCategory 时:
  const handleChange = (colName, field, val) => {
    const newMap = { ...schemaMap };
    newMap[colName] = {
      ...newMap[colName],
      [field]: val,
    };
    setSchemaMap(newMap);

    // 同时回写到 columnSchema
    const newSchemaArray = Object.entries(newMap).map(([columnName, obj]) => ({
      columnName,
      infoCategory: obj.infoCategory,
      metaCategory: obj.metaCategory,
    }));
    setColumnSchema(newSchemaArray);
  };

  // 用 antd Table 做一个表格，每行 = 1个 columnName
  // 两列下拉 => infoCategory, metaCategory
  const dataSource = columns.map((col) => ({
    key: col,
    columnName: col,
    infoCategory: schemaMap[col]?.infoCategory || '',
    metaCategory: schemaMap[col]?.metaCategory || '',
  }));

  const tableColumns = [
    {
      title: 'Column',
      dataIndex: 'columnName',
      key: 'columnName',
    },
    {
      title: 'Info Category',
      dataIndex: 'infoCategory',
      key: 'infoCategory',
      render: (val, record) => (
        <Select
          style={{ width: 150 }}
          placeholder="Select Info Category"
          value={val}
          onChange={(value) =>
            handleChange(record.columnName, 'infoCategory', value)
          }
        >
          {infoCategories.map((ic) => (
            <Option key={ic} value={ic}>
              {ic}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Meta Category',
      dataIndex: 'metaCategory',
      key: 'metaCategory',
      render: (val, record) => (
        <Select
          style={{ width: 150 }}
          placeholder="Select Meta Category"
          value={val}
          onChange={(value) =>
            handleChange(record.columnName, 'metaCategory', value)
          }
        >
          {metaCategories.map((mc) => (
            <Option key={mc} value={mc}>
              {mc}
            </Option>
          ))}
        </Select>
      ),
    },
  ];

  return (
    <div>
      <Table
        dataSource={dataSource}
        columns={tableColumns}
        pagination={false}
        size="small"
      />
    </div>
  );
};

export default ColumnMapper;
