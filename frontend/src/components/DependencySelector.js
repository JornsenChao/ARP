// src/components/DependencySelector.js
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Checkbox, Input, Button, Select, Typography, message } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

const { TextArea } = Input;

// ========== 预设数组 ========== //
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
 *  1) climateRisks, regulations, projectTypes, environment, scale => 用 Set + 预设 + 自定义
 *  2) otherData => { [fieldName: string]: Set<string> }
 *  3) each block has a "type" => 'dep'|'ref'|'strategy'
 *  4) onChange => { climateRisks, regulations, projectTypes, environment, scale, otherData }
 */
const DependencySelector = ({ onChange }) => {
  // ---------- A. state for 5 major blocks ----------
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

  // ========== B. "otherData" as { [fieldName: string]: Set<string> } ==========
  const [otherData, setOtherData] = useState({});

  // ========== 其他补充（若需要） ==========
  // 你原先 additional = string
  // 这里可选保留 or remove
  const [additional, setAdditional] = useState('');

  // ========== block: "customInput" for the 5 blocks' single-line input ==========
  const [customInput, setCustomInput] = useState({
    climateRisk: '',
    regulation: '',
    projectType: '',
    environment: '',
    scale: '',
  });

  // ========== C. "other" part: custom fieldName + fieldValue input  ==========
  const [otherFieldNameInput, setOtherFieldNameInput] = useState('');
  const [currentFieldName, setCurrentFieldName] = useState(''); // user selects an existing fieldName
  const [otherFieldValueInput, setOtherFieldValueInput] = useState('');

  // ========== onChange effect ==========
  const prevDataRef = useRef();
  useEffect(() => {
    const newData = {
      climateRisks: blockToOutput(climateRisksData),
      regulations: blockToOutput(regulationsData),
      projectTypes: blockToOutput(projectTypesData),
      environment: blockToOutput(environmentData),
      scale: blockToOutput(scaleData),
      otherData: convertOtherDataToOutput(otherData),
      additional,
    };
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
    otherData,
    additional,
    onChange,
  ]);

  // helper: block => { values, type }
  function blockToOutput(b) {
    return {
      values: Array.from(b.set),
      type: b.type,
    };
  }
  // helper: otherData => { fieldName: string[], ... } or keep as map-of-arr?
  // we keep it as { [fieldName]: string[] }
  function convertOtherDataToOutput(od) {
    const result = {};
    for (const fieldName in od) {
      result[fieldName] = Array.from(od[fieldName]);
    }
    return result;
  }

  // ========== 1) handle checkbox blocks ==========
  // merges new array => new Set
  function handleCheckboxChange(fieldKey, newArr) {
    switch (fieldKey) {
      case 'climateRisks':
        setClimateRisksData((prev) => ({ ...prev, set: new Set(newArr) }));
        break;
      case 'regulations':
        setRegulationsData((prev) => ({ ...prev, set: new Set(newArr) }));
        break;
      case 'projectTypes':
        setProjectTypesData((prev) => ({ ...prev, set: new Set(newArr) }));
        break;
      case 'environment':
        setEnvironmentData((prev) => ({ ...prev, set: new Set(newArr) }));
        break;
      case 'scale':
        setScaleData((prev) => ({ ...prev, set: new Set(newArr) }));
        break;
      default:
        break;
    }
  }

  // ========== 2) handle type select (dep/ref/str) ==========
  function handleTypeChange(fieldKey, newType) {
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
  }

  // ========== 3) handle add custom for the 5 blocks ==========
  function handleAddBlockCustom(fieldKey) {
    const val = customInput[fieldKey]?.trim();
    if (!val) return;
    switch (fieldKey) {
      case 'climateRisk':
        setClimateRisksData((prev) => addValueToSet(prev, val));
        break;
      case 'regulation':
        setRegulationsData((prev) => addValueToSet(prev, val));
        break;
      case 'projectType':
        setProjectTypesData((prev) => addValueToSet(prev, val));
        break;
      case 'environment':
        setEnvironmentData((prev) => addValueToSet(prev, val));
        break;
      case 'scale':
        setScaleData((prev) => addValueToSet(prev, val));
        break;
      default:
        break;
    }
    setCustomInput({ ...customInput, [fieldKey]: '' });
  }

  function addValueToSet(block, val) {
    const newSet = new Set(block.set);
    newSet.add(val);
    return { ...block, set: newSet };
  }

  function removeBlockCustom(fieldKey, val) {
    switch (fieldKey) {
      case 'climateRisk':
        setClimateRisksData((prev) => removeValueFromSet(prev, val));
        break;
      case 'regulation':
        setRegulationsData((prev) => removeValueFromSet(prev, val));
        break;
      case 'projectType':
        setProjectTypesData((prev) => removeValueFromSet(prev, val));
        break;
      case 'environment':
        setEnvironmentData((prev) => removeValueFromSet(prev, val));
        break;
      case 'scale':
        setScaleData((prev) => removeValueFromSet(prev, val));
        break;
      default:
        break;
    }
  }

  function removeValueFromSet(block, val) {
    const newSet = new Set(block.set);
    newSet.delete(val);
    return { ...block, set: newSet };
  }

  // ========== 4) otherData: custom fields + values ==========
  // shape: { "Budget": Set["1 million","2 million"], "Timeline": Set["3 months"] }
  // we want:
  //   a) user can add new fieldName (if not exist)
  //   b) user selects "currentFieldName"
  //   c) add new "fieldValue"
  //   d) remove fieldValue or entire field
  //   e) fieldName duplication => ignore, fieldValue duplication => ignore

  function addOtherFieldName() {
    const fn = otherFieldNameInput.trim();
    if (!fn) return;
    setOtherData((prev) => {
      if (prev[fn]) {
        // already exist => ignore
        return prev;
      }
      return {
        ...prev,
        [fn]: new Set(),
      };
    });
    setOtherFieldNameInput('');
    setCurrentFieldName(fn); // auto select it
  }

  function addOtherFieldValue() {
    if (!currentFieldName) {
      message.warn('Please select a field name first');
      return;
    }
    const val = otherFieldValueInput.trim();
    if (!val) return;
    setOtherData((prev) => {
      const oldSet = prev[currentFieldName] || new Set();
      if (oldSet.has(val)) {
        return prev; // ignore duplicate
      }
      const newSet = new Set(oldSet);
      newSet.add(val);
      return {
        ...prev,
        [currentFieldName]: newSet,
      };
    });
    setOtherFieldValueInput('');
  }

  function removeOtherFieldValue(fn, val) {
    setOtherData((prev) => {
      const oldSet = prev[fn];
      if (!oldSet) return prev;
      const newSet = new Set(oldSet);
      newSet.delete(val);
      return {
        ...prev,
        [fn]: newSet,
      };
    });
  }

  function removeOtherFieldName(fn) {
    setOtherData((prev) => {
      const newObj = { ...prev };
      delete newObj[fn];
      return newObj;
    });
    // if currentFieldName === fn => set it empty
    if (currentFieldName === fn) {
      setCurrentFieldName('');
    }
  }

  // ========== build block options => preset + custom ==========
  function buildOptions(presets, setOfVals) {
    const arr = [...presets];
    const presetVals = new Set(presets.map((p) => p.value));
    setOfVals.forEach((v) => {
      if (!presetVals.has(v)) {
        arr.push({ label: v, value: v });
      }
    });
    return arr;
  }

  const climateRiskOpts = useMemo(() => {
    return buildOptions(climateRiskPresets, climateRisksData.set);
    // eslint-disable-next-line
  }, [climateRisksData.set]);

  const regulationsOpts = useMemo(() => {
    return buildOptions(regulatoryPresets, regulationsData.set);
    // eslint-disable-next-line
  }, [regulationsData.set]);

  const projectTypeOpts = useMemo(() => {
    return buildOptions(projectTypePresets, projectTypesData.set);
    // eslint-disable-next-line
  }, [projectTypesData.set]);

  const environmentOpts = useMemo(() => {
    return buildOptions(environmentPresets, environmentData.set);
    // eslint-disable-next-line
  }, [environmentData.set]);

  const scaleOpts = useMemo(() => {
    return buildOptions(scalePresets, scaleData.set);
    // eslint-disable-next-line
  }, [scaleData.set]);

  // build array for otherData fields
  const otherFieldNames = Object.keys(otherData);

  return (
    <div style={{ marginBottom: 16 }}>
      {/* ========== Climate Risks ========== */}
      <h4>Climate Hazard(s)</h4>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Checkbox.Group
          options={climateRiskOpts}
          value={Array.from(climateRisksData.set)}
          onChange={(vals) => handleCheckboxChange('climateRisks', vals)}
        />
        <Select
          style={{ width: 120 }}
          value={climateRisksData.type}
          onChange={(val) => handleTypeChange('climateRisks', val)}
        >
          <Select.Option value="dependency">dep</Select.Option>
          <Select.Option value="reference">ref</Select.Option>
          <Select.Option value="strategy">str</Select.Option>
        </Select>
      </div>
      <div style={{ marginTop: 5 }}>
        <Input
          style={{ width: 180 }}
          placeholder="Add custom hazard"
          value={customInput.climateRisk}
          onChange={(e) =>
            setCustomInput({ ...customInput, climateRisk: e.target.value })
          }
          onPressEnter={() => handleAddBlockCustom('climateRisk')}
        />
        <Button
          style={{ marginLeft: 5 }}
          onClick={() => handleAddBlockCustom('climateRisk')}
        >
          Add
        </Button>
      </div>
      {/* Display custom climateRisks */}
      <div style={{ marginLeft: 24, marginTop: 5 }}>
        {[...climateRisksData.set]
          .filter((v) => !climateRiskPresets.some((p) => p.value === v))
          .map((val) => (
            <div key={val} style={{ display: 'flex', alignItems: 'center' }}>
              <Typography style={{ marginRight: 4 }}>{val}</Typography>
              <Button
                size="small"
                onClick={() => removeBlockCustom('climateRisk', val)}
              >
                <CloseOutlined />
              </Button>
            </div>
          ))}
      </div>

      {/* ========== Regulations ========== */}
      <h4 style={{ marginTop: 20 }}>Code/Regulatory Requirement</h4>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Checkbox.Group
          options={regulationsOpts}
          value={Array.from(regulationsData.set)}
          onChange={(vals) => handleCheckboxChange('regulations', vals)}
        />
        <Select
          style={{ width: 120 }}
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
          style={{ width: 180 }}
          placeholder="Add custom regulation"
          value={customInput.regulation}
          onChange={(e) =>
            setCustomInput({ ...customInput, regulation: e.target.value })
          }
          onPressEnter={() => handleAddBlockCustom('regulation')}
        />
        <Button
          style={{ marginLeft: 5 }}
          onClick={() => handleAddBlockCustom('regulation')}
        >
          Add
        </Button>
      </div>
      <div style={{ marginLeft: 24, marginTop: 5 }}>
        {[...regulationsData.set]
          .filter((v) => !regulatoryPresets.some((p) => p.value === v))
          .map((val) => (
            <div key={val} style={{ display: 'flex', alignItems: 'center' }}>
              <Typography style={{ marginRight: 4 }}>{val}</Typography>
              <Button
                size="small"
                onClick={() => removeBlockCustom('regulation', val)}
              >
                <CloseOutlined />
              </Button>
            </div>
          ))}
      </div>

      {/* ========== Project Types ========== */}
      <h4 style={{ marginTop: 20 }}>Project Type</h4>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Checkbox.Group
          options={projectTypeOpts}
          value={Array.from(projectTypesData.set)}
          onChange={(vals) => handleCheckboxChange('projectTypes', vals)}
        />
        <Select
          style={{ width: 120 }}
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
          style={{ width: 180 }}
          placeholder="Add custom projectType"
          value={customInput.projectType}
          onChange={(e) =>
            setCustomInput({ ...customInput, projectType: e.target.value })
          }
          onPressEnter={() => handleAddBlockCustom('projectType')}
        />
        <Button
          style={{ marginLeft: 5 }}
          onClick={() => handleAddBlockCustom('projectType')}
        >
          Add
        </Button>
      </div>
      <div style={{ marginLeft: 24, marginTop: 5 }}>
        {[...projectTypesData.set]
          .filter((v) => !projectTypePresets.some((p) => p.value === v))
          .map((val) => (
            <div key={val} style={{ display: 'flex', alignItems: 'center' }}>
              <Typography style={{ marginRight: 4 }}>{val}</Typography>
              <Button
                size="small"
                onClick={() => removeBlockCustom('projectType', val)}
              >
                <CloseOutlined />
              </Button>
            </div>
          ))}
      </div>

      {/* ========== Environment ========== */}
      <h4 style={{ marginTop: 20 }}>Project Geolocation</h4>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Checkbox.Group
          options={environmentOpts}
          value={Array.from(environmentData.set)}
          onChange={(vals) => handleCheckboxChange('environment', vals)}
        />
        <Select
          style={{ width: 120 }}
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
          style={{ width: 180 }}
          placeholder="Add custom environment"
          value={customInput.environment}
          onChange={(e) =>
            setCustomInput({ ...customInput, environment: e.target.value })
          }
          onPressEnter={() => handleAddBlockCustom('environment')}
        />
        <Button
          style={{ marginLeft: 5 }}
          onClick={() => handleAddBlockCustom('environment')}
        >
          Add
        </Button>
      </div>
      <div style={{ marginLeft: 24, marginTop: 5 }}>
        {[...environmentData.set]
          .filter((v) => !environmentPresets.some((p) => p.value === v))
          .map((val) => (
            <div key={val} style={{ display: 'flex', alignItems: 'center' }}>
              <Typography style={{ marginRight: 4 }}>{val}</Typography>
              <Button
                size="small"
                onClick={() => removeBlockCustom('environment', val)}
              >
                <CloseOutlined />
              </Button>
            </div>
          ))}
      </div>

      {/* ========== Scale ========== */}
      <h4 style={{ marginTop: 20 }}>Project Scale</h4>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Checkbox.Group
          options={scaleOpts}
          value={Array.from(scaleData.set)}
          onChange={(vals) => handleCheckboxChange('scale', vals)}
        />
        <Select
          style={{ width: 120 }}
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
          style={{ width: 180 }}
          placeholder="Add custom scale"
          value={customInput.scale}
          onChange={(e) =>
            setCustomInput({ ...customInput, scale: e.target.value })
          }
          onPressEnter={() => handleAddBlockCustom('scale')}
        />
        <Button
          style={{ marginLeft: 5 }}
          onClick={() => handleAddBlockCustom('scale')}
        >
          Add
        </Button>
      </div>
      <div style={{ marginLeft: 24, marginTop: 5 }}>
        {[...scaleData.set]
          .filter((v) => !scalePresets.some((p) => p.value === v))
          .map((val) => (
            <div key={val} style={{ display: 'flex', alignItems: 'center' }}>
              <Typography style={{ marginRight: 4 }}>{val}</Typography>
              <Button
                size="small"
                onClick={() => removeBlockCustom('scale', val)}
              >
                <CloseOutlined />
              </Button>
            </div>
          ))}
      </div>

      {/* ========== Other Data ========== */}
      <h4 style={{ marginTop: 20 }}>Other Info (Key -- multiple Values)</h4>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        <Input
          style={{ width: 160 }}
          placeholder="Add new field name"
          value={otherFieldNameInput}
          onChange={(e) => setOtherFieldNameInput(e.target.value)}
        />
        <Button onClick={handleAddOtherFieldName}>Add Field</Button>
      </div>

      {/* fieldName list => user pick current */}
      {Object.keys(otherData).length > 0 && (
        <Select
          style={{ width: 180 }}
          placeholder="Select a field"
          value={currentFieldName || undefined}
          onChange={(val) => setCurrentFieldName(val)}
        >
          {Object.keys(otherData).map((fn) => (
            <Select.Option key={fn} value={fn}>
              {fn}
            </Select.Option>
          ))}
        </Select>
      )}

      {/* add fieldValue => to the chosen field */}
      <div
        style={{ marginTop: 8, display: 'flex', gap: 4, alignItems: 'center' }}
      >
        <Input
          style={{ width: 160 }}
          placeholder="field value"
          value={otherFieldValueInput}
          onChange={(e) => setOtherFieldValueInput(e.target.value)}
          onPressEnter={handleAddOtherFieldValue}
        />
        <Button onClick={handleAddOtherFieldValue}>Add Value</Button>
      </div>

      {/* show all fieldName => each with multiple values */}
      <div style={{ marginTop: 12 }}>
        {Object.keys(otherData).length === 0 ? (
          <Typography type="secondary">No other info yet.</Typography>
        ) : (
          Object.entries(otherData).map(([fn, valSet]) => (
            <div key={fn} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Typography strong>{fn}</Typography>
                <Button
                  size="small"
                  onClick={() => removeOtherFieldName(fn)}
                  icon={<CloseOutlined />}
                />
              </div>
              {[...valSet].map((v) => (
                <div
                  key={v}
                  style={{ marginLeft: 24, display: 'flex', gap: 4 }}
                >
                  <Typography>- {v}</Typography>
                  <Button
                    size="small"
                    onClick={() => removeOtherFieldValue(fn, v)}
                    icon={<CloseOutlined />}
                  />
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* ========== Additional (if you want to keep it) ========== */}
      <h4 style={{ marginTop: 20 }}>Additional Text</h4>
      <TextArea
        rows={3}
        placeholder="e.g. budget limited, time sensitive, etc."
        style={{ width: '100%' }}
        value={additional}
        onChange={(e) => setAdditional(e.target.value)}
      />
    </div>
  );

  // =========== function for "Add Field" ===========
  function handleAddOtherFieldName() {
    const fn = otherFieldNameInput.trim();
    if (!fn) return;
    // check if exist
    if (otherData[fn]) {
      // duplicate => skip
      setCurrentFieldName(fn);
      return;
    }
    // create empty set
    setOtherData((prev) => ({
      ...prev,
      [fn]: new Set(),
    }));
    setCurrentFieldName(fn);
    setOtherFieldNameInput('');
  }

  // =========== function for "Add Value" in current field ===========
  function handleAddOtherFieldValue() {
    if (!currentFieldName) {
      message.warn('Please select a field name first or create a new one');
      return;
    }
    const val = otherFieldValueInput.trim();
    if (!val) return;
    setOtherData((prev) => {
      const oldSet = prev[currentFieldName] || new Set();
      if (oldSet.has(val)) {
        // duplicate => skip
        return prev;
      }
      const newSet = new Set(oldSet);
      newSet.add(val);
      return {
        ...prev,
        [currentFieldName]: newSet,
      };
    });
    setOtherFieldValueInput('');
  }
};

export default DependencySelector;
