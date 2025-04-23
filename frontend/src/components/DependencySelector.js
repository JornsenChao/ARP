// src/components/DependencySelector.js

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Checkbox,
  Input,
  Button,
  Select,
  Typography,
  Space,
  message,
} from 'antd';
import { CloseOutlined } from '@ant-design/icons';

const { TextArea } = Input;

// 预设选项
const climateRiskPresets = [
  { label: 'Flooding', value: 'flooding' },
  { label: 'Drought', value: 'drought' },
  { label: 'Extreme Heat Wave', value: 'heatwave' },
  { label: 'Sea Level Rise', value: 'sea level rise' },
  { label: 'Landslide', value: 'landslide' },
];

const regulatoryPresets = [
  { label: 'Building Height Limit', value: 'height limit' },
  { label: 'Nature Reserve', value: 'wetland' },
];

const projectTypePresets = [
  { label: 'Civic Infrastructure', value: 'public building' },
  { label: 'Residential', value: 'residential' },
  { label: 'Commercial', value: 'commercial complex' },
];

const environmentPresets = [
  { label: 'Coastal', value: 'coastal' },
  { label: 'Inland', value: 'inland' },
  { label: 'Alpine', value: 'mountain' },
];

const scalePresets = [
  { label: 'Site', value: 'small-scale site' },
  { label: 'Building', value: 'medium-scale site' },
  { label: 'Campus', value: 'large-scale region' },
];

/**
 * DependencySelector:
 *  - 5 大字段: climateRisks / regulations / projectTypes / environment / scale
 *  - 每个字段: { values: string[], type: 'dep'|'ref'|'strategy' }
 *  - 另有 additional
 *  - 自定义项与预设项合并在 Set 里管理 => 不会覆盖
 *  - 若新添加的自定义值已存在 => 忽略
 */
const DependencySelector = ({ onChange }) => {
  // ========== State for each block ==========
  // 例如 climateRisksData: { set: Set<string>, type: string }
  // 内部存储 useMemo 预设 => union => build finalOptions
  const [climateRisksData, setClimateRisksData] = useState({
    set: new Set(),
    type: 'dependency',
  });
  const [regulationsData, setRegulationsData] = useState({
    set: new Set(),
    type: 'dependency',
  });
  const [projectTypesData, setProjectTypesData] = useState({
    set: new Set(),
    type: 'dependency',
  });
  const [environmentData, setEnvironmentData] = useState({
    set: new Set(),
    type: 'dependency',
  });
  const [scaleData, setScaleData] = useState({
    set: new Set(),
    type: 'dependency',
  });

  // 其他补充
  const [additional, setAdditional] = useState('');

  // 每个区块的自定义输入
  const [customInput, setCustomInput] = useState({
    climateRisk: '',
    regulation: '',
    projectType: '',
    environment: '',
    scale: '',
  });

  // ========== 构建 block => final output for onChange ==========
  // 例如 climateRisksData.set => array, type => "dep|ref|str"
  const buildBlock = (theState) => {
    // 先把 set => array
    return {
      values: Array.from(theState.set),
      type: theState.type,
    };
  };

  const prevDataRef = useRef();
  useEffect(() => {
    // 1) build the final object
    const newData = {
      climateRisks: buildBlock(climateRisksData),
      regulations: buildBlock(regulationsData),
      projectTypes: buildBlock(projectTypesData),
      environment: buildBlock(environmentData),
      scale: buildBlock(scaleData),
      additional,
    };
    // 2) if changed => onChange
    if (JSON.stringify(prevDataRef.current) !== JSON.stringify(newData)) {
      prevDataRef.current = newData;
      onChange?.(newData);
    }
  }, [
    climateRisksData,
    regulationsData,
    projectTypesData,
    environmentData,
    scaleData,
    additional,
    onChange,
  ]);

  // ========== Handler: type select (dep/ref/str) ==========
  const handleTypeChange = (fieldKey, newType) => {
    switch (fieldKey) {
      case 'climateRisks':
        setClimateRisksData((prev) => ({ ...prev, type: newType }));
        break;
      case 'regulations':
        setRegulationsData((prev) => ({ ...prev, type: newType }));
        break;
      case 'projectTypes':
        setProjectTypesData((prev) => ({ ...prev, type: newType }));
        break;
      case 'environment':
        setEnvironmentData((prev) => ({ ...prev, type: newType }));
        break;
      case 'scale':
        setScaleData((prev) => ({ ...prev, type: newType }));
        break;
      default:
        break;
    }
  };

  // ========== Handler: checkbox group onChange ==========
  // antd <Checkbox.Group> returns an array of [value, value]
  // we unify with the current set => new set
  function handleCheckboxChange(fieldKey, newArr) {
    switch (fieldKey) {
      case 'climateRisks': {
        setClimateRisksData((prev) => {
          return { ...prev, set: new Set(newArr) };
        });
        break;
      }
      case 'regulations': {
        setRegulationsData((prev) => {
          return { ...prev, set: new Set(newArr) };
        });
        break;
      }
      case 'projectTypes': {
        setProjectTypesData((prev) => {
          return { ...prev, set: new Set(newArr) };
        });
        break;
      }
      case 'environment': {
        setEnvironmentData((prev) => {
          return { ...prev, set: new Set(newArr) };
        });
        break;
      }
      case 'scale': {
        setScaleData((prev) => {
          return { ...prev, set: new Set(newArr) };
        });
        break;
      }
      default:
        break;
    }
  }

  // ========== Handler: add custom input ==========
  function handleAddCustom(fieldKey) {
    const val = customInput[fieldKey]?.trim();
    if (!val) return;

    switch (fieldKey) {
      case 'climateRisk': {
        setClimateRisksData((prev) => {
          if (prev.set.has(val)) {
            // already exist => skip
            return prev;
          }
          const newSet = new Set(prev.set);
          newSet.add(val);
          return { ...prev, set: newSet };
        });
        break;
      }
      case 'regulation': {
        setRegulationsData((prev) => {
          if (prev.set.has(val)) {
            return prev;
          }
          const newSet = new Set(prev.set);
          newSet.add(val);
          return { ...prev, set: newSet };
        });
        break;
      }
      case 'projectType': {
        setProjectTypesData((prev) => {
          if (prev.set.has(val)) {
            return prev;
          }
          const newSet = new Set(prev.set);
          newSet.add(val);
          return { ...prev, set: newSet };
        });
        break;
      }
      case 'environment': {
        setEnvironmentData((prev) => {
          if (prev.set.has(val)) {
            return prev;
          }
          const newSet = new Set(prev.set);
          newSet.add(val);
          return { ...prev, set: newSet };
        });
        break;
      }
      case 'scale': {
        setScaleData((prev) => {
          if (prev.set.has(val)) {
            return prev;
          }
          const newSet = new Set(prev.set);
          newSet.add(val);
          return { ...prev, set: newSet };
        });
        break;
      }
      default:
        break;
    }

    setCustomInput({ ...customInput, [fieldKey]: '' });
  }

  // ========== Handler: remove single custom item ==========
  // e.g. remove "flooding" from climateRisks
  function handleRemoveCustom(fieldKey, val) {
    switch (fieldKey) {
      case 'climateRisk': {
        setClimateRisksData((prev) => {
          const newSet = new Set(prev.set);
          newSet.delete(val);
          return { ...prev, set: newSet };
        });
        break;
      }
      case 'regulation': {
        setRegulationsData((prev) => {
          const newSet = new Set(prev.set);
          newSet.delete(val);
          return { ...prev, set: newSet };
        });
        break;
      }
      case 'projectType': {
        setProjectTypesData((prev) => {
          const newSet = new Set(prev.set);
          newSet.delete(val);
          return { ...prev, set: newSet };
        });
        break;
      }
      case 'environment': {
        setEnvironmentData((prev) => {
          const newSet = new Set(prev.set);
          newSet.delete(val);
          return { ...prev, set: newSet };
        });
        break;
      }
      case 'scale': {
        setScaleData((prev) => {
          const newSet = new Set(prev.set);
          newSet.delete(val);
          return { ...prev, set: newSet };
        });
        break;
      }
      default:
        break;
    }
  }

  // ========== Build final "options" for each block: preset + custom ==========

  function buildOptions(presets, blockSet) {
    // 先保留预设
    const result = [...presets];
    // blockSet 里可能有自定义 => 过滤掉已经在预设中的
    // to do that, we compare value
    // we can store all preset values in a set
    const presetVals = new Set(presets.map((p) => p.value));
    blockSet.forEach((val) => {
      if (!presetVals.has(val)) {
        // custom
        result.push({ label: val, value: val });
      }
    });
    return result;
  }

  // 构建 climateRiskOptions + user custom
  const climateRiskFullOpts = useMemo(() => {
    return buildOptions(climateRiskPresets, climateRisksData.set);
    // eslint-disable-next-line
  }, [climateRisksData.set]);

  const regulationsFullOpts = useMemo(() => {
    return buildOptions(regulatoryPresets, regulationsData.set);
    // eslint-disable-next-line
  }, [regulationsData.set]);

  const projectTypeFullOpts = useMemo(() => {
    return buildOptions(projectTypePresets, projectTypesData.set);
    // eslint-disable-next-line
  }, [projectTypesData.set]);

  const environmentFullOpts = useMemo(() => {
    return buildOptions(environmentPresets, environmentData.set);
    // eslint-disable-next-line
  }, [environmentData.set]);

  const scaleFullOpts = useMemo(() => {
    return buildOptions(scalePresets, scaleData.set);
    // eslint-disable-next-line
  }, [scaleData.set]);

  return (
    <div style={{ marginBottom: 16 }}>
      {/* ---------- climateRisks ---------- */}
      <h4>Climate Hazard(s)</h4>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Checkbox.Group
          options={climateRiskFullOpts}
          value={Array.from(climateRisksData.set)}
          onChange={(vals) => handleCheckboxChange('climateRisks', vals)}
        />
        <Select
          style={{ width: 100 }}
          value={climateRisksData.type}
          onChange={(val) => handleTypeChange('climateRisks', val)}
        >
          <Select.Option value="dependency">dep</Select.Option>
          <Select.Option value="reference">ref</Select.Option>
          <Select.Option value="strategy">str</Select.Option>
        </Select>
      </div>
      {/* custom input */}
      <div style={{ marginTop: 5 }}>
        <Input
          style={{ width: 160 }}
          placeholder="Add custom hazard"
          value={customInput.climateRisk}
          onChange={(e) =>
            setCustomInput({ ...customInput, climateRisk: e.target.value })
          }
          onPressEnter={() => handleAddCustom('climateRisk')}
        />
        <Button
          style={{ marginLeft: 5 }}
          onClick={() => handleAddCustom('climateRisk')}
        >
          Add
        </Button>
      </div>
      {/* show custom items (like a small list) */}
      <div style={{ marginLeft: 24, marginTop: 5 }}>
        {Array.from(climateRisksData.set)
          .filter(
            (val) => !climateRiskPresets.some((p) => p.value === val) // not preset => custom
          )
          .map((val) => (
            <div key={val} style={{ display: 'flex', alignItems: 'center' }}>
              <Typography style={{ marginRight: 4 }}>{val}</Typography>
              <Button
                size="small"
                onClick={() => handleRemoveCustom('climateRisk', val)}
              >
                <CloseOutlined />
              </Button>
            </div>
          ))}
      </div>

      {/* ---------- regulations ---------- */}
      <h4 style={{ marginTop: 20 }}>Code/Regulatory Requirement</h4>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Checkbox.Group
          options={regulationsFullOpts}
          value={Array.from(regulationsData.set)}
          onChange={(vals) => handleCheckboxChange('regulations', vals)}
        />
        <Select
          style={{ width: 100 }}
          value={regulationsData.type}
          onChange={(val) => handleTypeChange('regulations', val)}
        >
          <Select.Option value="dependency">dep</Select.Option>
          <Select.Option value="reference">ref</Select.Option>
          <Select.Option value="strategy">str</Select.Option>
        </Select>
      </div>
      <div style={{ marginTop: 5 }}>
        <Input
          style={{ width: 160 }}
          placeholder="Add custom regulation"
          value={customInput.regulation}
          onChange={(e) =>
            setCustomInput({ ...customInput, regulation: e.target.value })
          }
          onPressEnter={() => handleAddCustom('regulation')}
        />
        <Button
          style={{ marginLeft: 5 }}
          onClick={() => handleAddCustom('regulation')}
        >
          Add
        </Button>
      </div>
      <div style={{ marginLeft: 24, marginTop: 5 }}>
        {Array.from(regulationsData.set)
          .filter((val) => !regulatoryPresets.some((p) => p.value === val))
          .map((val) => (
            <div key={val} style={{ display: 'flex', alignItems: 'center' }}>
              <Typography style={{ marginRight: 4 }}>{val}</Typography>
              <Button
                size="small"
                onClick={() => handleRemoveCustom('regulation', val)}
              >
                <CloseOutlined />
              </Button>
            </div>
          ))}
      </div>

      {/* ---------- projectTypes ---------- */}
      <h4 style={{ marginTop: 20 }}>Project Type</h4>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Checkbox.Group
          options={projectTypeFullOpts}
          value={Array.from(projectTypesData.set)}
          onChange={(vals) => handleCheckboxChange('projectTypes', vals)}
        />
        <Select
          style={{ width: 100 }}
          value={projectTypesData.type}
          onChange={(val) => handleTypeChange('projectTypes', val)}
        >
          <Select.Option value="dependency">dep</Select.Option>
          <Select.Option value="reference">ref</Select.Option>
          <Select.Option value="strategy">str</Select.Option>
        </Select>
      </div>
      <div style={{ marginTop: 5 }}>
        <Input
          style={{ width: 160 }}
          placeholder="Add custom projectType"
          value={customInput.projectType}
          onChange={(e) =>
            setCustomInput({ ...customInput, projectType: e.target.value })
          }
          onPressEnter={() => handleAddCustom('projectType')}
        />
        <Button
          style={{ marginLeft: 5 }}
          onClick={() => handleAddCustom('projectType')}
        >
          Add
        </Button>
      </div>
      <div style={{ marginLeft: 24, marginTop: 5 }}>
        {Array.from(projectTypesData.set)
          .filter((val) => !projectTypePresets.some((p) => p.value === val))
          .map((val) => (
            <div key={val} style={{ display: 'flex', alignItems: 'center' }}>
              <Typography style={{ marginRight: 4 }}>{val}</Typography>
              <Button
                size="small"
                onClick={() => handleRemoveCustom('projectType', val)}
              >
                <CloseOutlined />
              </Button>
            </div>
          ))}
      </div>

      {/* ---------- environment ---------- */}
      <h4 style={{ marginTop: 20 }}>Project Geolocation</h4>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Checkbox.Group
          options={environmentFullOpts}
          value={Array.from(environmentData.set)}
          onChange={(vals) => handleCheckboxChange('environment', vals)}
        />
        <Select
          style={{ width: 100 }}
          value={environmentData.type}
          onChange={(val) => handleTypeChange('environment', val)}
        >
          <Select.Option value="dependency">dep</Select.Option>
          <Select.Option value="reference">ref</Select.Option>
          <Select.Option value="strategy">str</Select.Option>
        </Select>
      </div>
      <div style={{ marginTop: 5 }}>
        <Input
          style={{ width: 160 }}
          placeholder="Add custom environment"
          value={customInput.environment}
          onChange={(e) =>
            setCustomInput({ ...customInput, environment: e.target.value })
          }
          onPressEnter={() => handleAddCustom('environment')}
        />
        <Button
          style={{ marginLeft: 5 }}
          onClick={() => handleAddCustom('environment')}
        >
          Add
        </Button>
      </div>
      <div style={{ marginLeft: 24, marginTop: 5 }}>
        {Array.from(environmentData.set)
          .filter((val) => !environmentPresets.some((p) => p.value === val))
          .map((val) => (
            <div key={val} style={{ display: 'flex', alignItems: 'center' }}>
              <Typography style={{ marginRight: 4 }}>{val}</Typography>
              <Button
                size="small"
                onClick={() => handleRemoveCustom('environment', val)}
              >
                <CloseOutlined />
              </Button>
            </div>
          ))}
      </div>

      {/* ---------- scale ---------- */}
      <h4 style={{ marginTop: 20 }}>Project Scale</h4>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Checkbox.Group
          options={scaleFullOpts}
          value={Array.from(scaleData.set)}
          onChange={(vals) => handleCheckboxChange('scale', vals)}
        />
        <Select
          style={{ width: 100 }}
          value={scaleData.type}
          onChange={(val) => handleTypeChange('scale', val)}
        >
          <Select.Option value="dependency">dep</Select.Option>
          <Select.Option value="reference">ref</Select.Option>
          <Select.Option value="strategy">str</Select.Option>
        </Select>
      </div>
      <div style={{ marginTop: 5 }}>
        <Input
          style={{ width: 160 }}
          placeholder="Add custom scale"
          value={customInput.scale}
          onChange={(e) =>
            setCustomInput({ ...customInput, scale: e.target.value })
          }
          onPressEnter={() => handleAddCustom('scale')}
        />
        <Button
          style={{ marginLeft: 5 }}
          onClick={() => handleAddCustom('scale')}
        >
          Add
        </Button>
      </div>
      <div style={{ marginLeft: 24, marginTop: 5 }}>
        {Array.from(scaleData.set)
          .filter((val) => !scalePresets.some((p) => p.value === val))
          .map((val) => (
            <div key={val} style={{ display: 'flex', alignItems: 'center' }}>
              <Typography style={{ marginRight: 4 }}>{val}</Typography>
              <Button
                size="small"
                onClick={() => handleRemoveCustom('scale', val)}
              >
                <CloseOutlined />
              </Button>
            </div>
          ))}
      </div>

      {/* ---------- additional ---------- */}
      <h4 style={{ marginTop: 20 }}>Other</h4>
      <TextArea
        rows={3}
        placeholder="e.g. budget limited, time sensitive, etc."
        value={additional}
        onChange={(e) => setAdditional(e.target.value)}
        style={{ width: '100%' }}
      />
    </div>
  );
};

export default DependencySelector;
