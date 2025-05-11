// frontend/src/components/DependencySelector.js
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Stack,
  Button,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Snackbar,
  Alert,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// ---------- Presets ----------
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

// ---------- Small helpers ----------
const blockToOutput = (b) => ({ values: Array.from(b.set), type: b.type });
const convertOtherDataToOutput = (obj) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, Array.from(v)]));

// ---------- Reusable checkbox group (MUI) ----------
const CheckGroup = ({ options, value, onChange }) => {
  const toggle = (v) => {
    const next = value.includes(v)
      ? value.filter((x) => x !== v)
      : [...value, v];
    onChange(next);
  };
  return (
    <FormGroup row>
      {options.map(({ label, value: v }) => (
        <FormControlLabel
          key={v}
          control={
            <Checkbox
              checked={value.includes(v)}
              onChange={() => toggle(v)}
              size="small"
            />
          }
          label={<Typography variant="body2">{label}</Typography>}
          sx={{ mr: 1 }}
        />
      ))}
    </FormGroup>
  );
};

const DependencySelector = ({ value, onChange }) => {
  // ---------- local state blocks ----------
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
  const [otherData, setOtherData] = useState({});
  const [additional, setAdditional] = useState('');

  // ui helpers
  const [customInput, setCustomInput] = useState({
    climateRisk: '',
    regulation: '',
    projectType: '',
    environment: '',
    scale: '',
  });
  const [otherFieldNameInput, setOtherFieldNameInput] = useState('');
  const [currentFieldName, setCurrentFieldName] = useState('');
  const [otherFieldValueInput, setOtherFieldValueInput] = useState('');

  // snackbar (replaces message.warn)
  const [snack, setSnack] = useState({ open: false, text: '' });
  const openSnack = (text) => setSnack({ open: true, text });
  const closeSnack = () => setSnack({ open: false, text: '' });

  // ---------- sync incoming value ----------
  useEffect(() => {
    const incoming = value || {};
    if (incoming.climateRisks)
      setClimateRisksData({
        set: new Set(incoming.climateRisks.values || []),
        type: incoming.climateRisks.type || 'dependency',
      });
    if (incoming.regulations)
      setRegulationsData({
        set: new Set(incoming.regulations.values || []),
        type: incoming.regulations.type || 'dependency',
      });
    if (incoming.projectTypes)
      setProjectTypesData({
        set: new Set(incoming.projectTypes.values || []),
        type: incoming.projectTypes.type || 'dependency',
      });
    if (incoming.environment)
      setEnvironmentData({
        set: new Set(incoming.environment.values || []),
        type: incoming.environment.type || 'dependency',
      });
    if (incoming.scale)
      setScaleData({
        set: new Set(incoming.scale.values || []),
        type: incoming.scale.type || 'dependency',
      });

    if (incoming.otherData) {
      const od = {};
      Object.entries(incoming.otherData).forEach(
        ([k, arr]) => (od[k] = new Set(arr))
      );
      setOtherData(od);
    } else setOtherData({});

    setAdditional(incoming.additional || '');
  }, [value]);

  // ---------- push upwards ----------
  const prevRef = useRef();
  useEffect(() => {
    const out = {
      climateRisks: blockToOutput(climateRisksData),
      regulations: blockToOutput(regulationsData),
      projectTypes: blockToOutput(projectTypesData),
      environment: blockToOutput(environmentData),
      scale: blockToOutput(scaleData),
      otherData: convertOtherDataToOutput(otherData),
      additional,
    };
    if (JSON.stringify(prevRef.current) !== JSON.stringify(out)) {
      prevRef.current = out;
      onChange?.(out);
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

  // ---------- small mutators ----------
  const addValueToSet = (block, val) => ({
    ...block,
    set: new Set(block.set).add(val),
  });
  const removeValueFromSet = (block, val) => {
    const next = new Set(block.set);
    next.delete(val);
    return { ...block, set: next };
  };

  const handleCheckboxChange = (key, vals) => {
    const map = {
      climateRisks: setClimateRisksData,
      regulations: setRegulationsData,
      projectTypes: setProjectTypesData,
      environment: setEnvironmentData,
      scale: setScaleData,
    };
    map[key]?.((prev) => ({ ...prev, set: new Set(vals) }));
  };

  const handleTypeChange = (key, newType) => {
    const map = {
      climateRisks: setClimateRisksData,
      regulations: setRegulationsData,
      projectTypes: setProjectTypesData,
      environment: setEnvironmentData,
      scale: setScaleData,
    };
    map[key]?.((prev) => ({ ...prev, type: newType }));
  };

  const handleAddBlockCustom = (fieldKey) => {
    const val = customInput[fieldKey]?.trim();
    if (!val) return;
    const setter = {
      climateRisk: setClimateRisksData,
      regulation: setRegulationsData,
      projectType: setProjectTypesData,
      environment: setEnvironmentData,
      scale: setScaleData,
    }[fieldKey];
    setter?.((prev) => addValueToSet(prev, val));
    setCustomInput((c) => ({ ...c, [fieldKey]: '' }));
  };

  const removeBlockCustom = (fieldKey, val) => {
    const setter = {
      climateRisk: setClimateRisksData,
      regulation: setRegulationsData,
      projectType: setProjectTypesData,
      environment: setEnvironmentData,
      scale: setScaleData,
    }[fieldKey];
    setter?.((prev) => removeValueFromSet(prev, val));
  };

  // ---------- otherData helpers ----------
  const handleAddOtherFieldName = () => {
    const fn = otherFieldNameInput.trim();
    if (!fn) return;
    if (otherData[fn]) {
      setCurrentFieldName(fn);
      return;
    }
    setOtherData((p) => ({ ...p, [fn]: new Set() }));
    setCurrentFieldName(fn);
    setOtherFieldNameInput('');
  };

  const handleAddOtherFieldValue = () => {
    if (!currentFieldName) {
      openSnack('Please select a field name first or create a new one');
      return;
    }
    const val = otherFieldValueInput.trim();
    if (!val) return;
    setOtherData((p) => {
      const old = p[currentFieldName] || new Set();
      if (old.has(val)) return p;
      const next = new Set(old).add(val);
      return { ...p, [currentFieldName]: next };
    });
    setOtherFieldValueInput('');
  };

  const removeOtherFieldValue = (fn, val) =>
    setOtherData((p) => {
      const old = p[fn];
      if (!old) return p;
      const next = new Set(old);
      next.delete(val);
      return { ...p, [fn]: next };
    });

  const removeOtherFieldName = (fn) => {
    setOtherData((p) => {
      const tmp = { ...p };
      delete tmp[fn];
      return tmp;
    });
    if (currentFieldName === fn) setCurrentFieldName('');
  };

  // ---------- build option arrays ----------
  const build = (presets, set) => {
    const presetVals = new Set(presets.map((p) => p.value));
    const arr = [...presets];
    set.forEach((v) => !presetVals.has(v) && arr.push({ label: v, value: v }));
    return arr;
  };
  const climateRiskOpts = build(climateRiskPresets, climateRisksData.set);
  const regulationsOpts = build(regulatoryPresets, regulationsData.set);
  const projectTypeOpts = build(projectTypePresets, projectTypesData.set);
  const environmentOpts = build(environmentPresets, environmentData.set);
  const scaleOpts = build(scalePresets, scaleData.set);

  // ---------- UI ----------
  const renderCustomList = (data, presets, fieldKey) => (
    <Box ml={3} mt={0.5}>
      {[...data.set]
        .filter((v) => !presets.some((p) => p.value === v))
        .map((val) => (
          <Stack key={val} direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="body2">{val}</Typography>
            <IconButton
              size="small"
              onClick={() => removeBlockCustom(fieldKey, val)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        ))}
    </Box>
  );

  const TypeSelect = ({ value, onChange }) => (
    <Select
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{ width: 120 }}
    >
      <MenuItem value="dependency">dep</MenuItem>
      <MenuItem value="reference">ref</MenuItem>
      <MenuItem value="strategy">str</MenuItem>
    </Select>
  );

  return (
    <Box mb={2}>
      {/* ===== Climate Risks ===== */}
      <Typography variant="h6" gutterBottom>
        Climate Hazard(s)
      </Typography>
      <Stack direction="row" alignItems="center" spacing={1}>
        <CheckGroup
          options={climateRiskOpts}
          value={Array.from(climateRisksData.set)}
          onChange={(vals) => handleCheckboxChange('climateRisks', vals)}
        />
        {/* <TypeSelect
          value={climateRisksData.type}
          onChange={(val) => handleTypeChange('climateRisks', val)}
        /> */}
      </Stack>
      <Stack direction="row" spacing={1} mt={0.5}>
        <TextField
          size="small"
          sx={{ width: 180 }}
          placeholder="Add custom hazard"
          value={customInput.climateRisk}
          onChange={(e) =>
            setCustomInput((c) => ({ ...c, climateRisk: e.target.value }))
          }
          onKeyDown={(e) =>
            e.key === 'Enter' && handleAddBlockCustom('climateRisk')
          }
        />
        <Button onClick={() => handleAddBlockCustom('climateRisk')}>Add</Button>
      </Stack>
      {renderCustomList(climateRisksData, climateRiskPresets, 'climateRisk')}

      {/* ===== Regulations ===== */}
      <Typography variant="h6" mt={3} gutterBottom>
        Code/Regulatory Requirement
      </Typography>
      <Stack direction="row" alignItems="center" spacing={1}>
        <CheckGroup
          options={regulationsOpts}
          value={Array.from(regulationsData.set)}
          onChange={(vals) => handleCheckboxChange('regulations', vals)}
        />
        {/* <TypeSelect
          value={regulationsData.type}
          onChange={(val) => handleTypeChange('regulations', val)}
        /> */}
      </Stack>
      <Stack direction="row" spacing={1} mt={0.5}>
        <TextField
          size="small"
          sx={{ width: 180 }}
          placeholder="Add custom regulation"
          value={customInput.regulation}
          onChange={(e) =>
            setCustomInput((c) => ({ ...c, regulation: e.target.value }))
          }
          onKeyDown={(e) =>
            e.key === 'Enter' && handleAddBlockCustom('regulation')
          }
        />
        <Button onClick={() => handleAddBlockCustom('regulation')}>Add</Button>
      </Stack>
      {renderCustomList(regulationsData, regulatoryPresets, 'regulation')}

      {/* ===== Project Types ===== */}
      <Typography variant="h6" mt={3} gutterBottom>
        Project Type
      </Typography>
      <Stack direction="row" alignItems="center" spacing={1}>
        <CheckGroup
          options={projectTypeOpts}
          value={Array.from(projectTypesData.set)}
          onChange={(vals) => handleCheckboxChange('projectTypes', vals)}
        />
        {/* <TypeSelect
          value={projectTypesData.type}
          onChange={(val) => handleTypeChange('projectTypes', val)}
        /> */}
      </Stack>
      <Stack direction="row" spacing={1} mt={0.5}>
        <TextField
          size="small"
          sx={{ width: 180 }}
          placeholder="Add custom projectType"
          value={customInput.projectType}
          onChange={(e) =>
            setCustomInput((c) => ({ ...c, projectType: e.target.value }))
          }
          onKeyDown={(e) =>
            e.key === 'Enter' && handleAddBlockCustom('projectType')
          }
        />
        <Button onClick={() => handleAddBlockCustom('projectType')}>Add</Button>
      </Stack>
      {renderCustomList(projectTypesData, projectTypePresets, 'projectType')}

      {/* ===== Environment ===== */}
      <Typography variant="h6" mt={3} gutterBottom>
        Project Geolocation
      </Typography>
      <Stack direction="row" alignItems="center" spacing={1}>
        <CheckGroup
          options={environmentOpts}
          value={Array.from(environmentData.set)}
          onChange={(vals) => handleCheckboxChange('environment', vals)}
        />
        {/* <TypeSelect
          value={environmentData.type}
          onChange={(val) => handleTypeChange('environment', val)}
        /> */}
      </Stack>
      <Stack direction="row" spacing={1} mt={0.5}>
        <TextField
          size="small"
          sx={{ width: 180 }}
          placeholder="Add custom environment"
          value={customInput.environment}
          onChange={(e) =>
            setCustomInput((c) => ({ ...c, environment: e.target.value }))
          }
          onKeyDown={(e) =>
            e.key === 'Enter' && handleAddBlockCustom('environment')
          }
        />
        <Button onClick={() => handleAddBlockCustom('environment')}>Add</Button>
      </Stack>
      {renderCustomList(environmentData, environmentPresets, 'environment')}

      {/* ===== Scale ===== */}
      <Typography variant="h6" mt={3} gutterBottom>
        Project Scale
      </Typography>
      <Stack direction="row" alignItems="center" spacing={1}>
        <CheckGroup
          options={scaleOpts}
          value={Array.from(scaleData.set)}
          onChange={(vals) => handleCheckboxChange('scale', vals)}
        />
        {/* <TypeSelect
          value={scaleData.type}
          onChange={(val) => handleTypeChange('scale', val)}
        /> */}
      </Stack>
      <Stack direction="row" spacing={1} mt={0.5}>
        <TextField
          size="small"
          sx={{ width: 180 }}
          placeholder="Add custom scale"
          value={customInput.scale}
          onChange={(e) =>
            setCustomInput((c) => ({ ...c, scale: e.target.value }))
          }
          onKeyDown={(e) => e.key === 'Enter' && handleAddBlockCustom('scale')}
        />
        <Button onClick={() => handleAddBlockCustom('scale')}>Add</Button>
      </Stack>
      {renderCustomList(scaleData, scalePresets, 'scale')}

      {/* ===== Other Info ===== */}
      <Typography variant="h6" mt={3}>
        Other Info (Key — multiple Values)
      </Typography>
      <Stack direction="row" spacing={1} mb={1}>
        <TextField
          size="small"
          sx={{ width: 160 }}
          placeholder="Add new field name"
          value={otherFieldNameInput}
          onChange={(e) => setOtherFieldNameInput(e.target.value)}
        />
        <Button onClick={handleAddOtherFieldName}>Add Field</Button>
      </Stack>

      {Object.keys(otherData).length > 0 && (
        <Select
          size="small"
          sx={{ width: 180 }}
          displayEmpty
          value={currentFieldName || ''}
          onChange={(e) => setCurrentFieldName(e.target.value)}
        >
          <MenuItem value="" disabled>
            Select a field
          </MenuItem>
          {Object.keys(otherData).map((fn) => (
            <MenuItem key={fn} value={fn}>
              {fn}
            </MenuItem>
          ))}
        </Select>
      )}

      <Stack direction="row" spacing={1} mt={1}>
        <TextField
          size="small"
          sx={{ width: 160 }}
          placeholder="field value"
          value={otherFieldValueInput}
          onChange={(e) => setOtherFieldValueInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddOtherFieldValue()}
        />
        <Button onClick={handleAddOtherFieldValue}>Add Value</Button>
      </Stack>

      <Box mt={1.5}>
        {Object.keys(otherData).length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No other info yet.
          </Typography>
        ) : (
          Object.entries(otherData).map(([fn, valSet]) => (
            <Box key={fn} mb={1}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography variant="subtitle2">{fn}</Typography>
                <IconButton
                  size="small"
                  onClick={() => removeOtherFieldName(fn)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>
              {[...valSet].map((v) => (
                <Stack
                  key={v}
                  direction="row"
                  alignItems="center"
                  spacing={0.5}
                  ml={3}
                >
                  <Typography variant="body2">- {v}</Typography>
                  <IconButton
                    size="small"
                    onClick={() => removeOtherFieldValue(fn, v)}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Box>
          ))
        )}
      </Box>

      {/* ===== Additional ===== */}
      <Typography variant="h6" mt={3}>
        Additional Text
      </Typography>
      <TextField
        multiline
        rows={3}
        placeholder="e.g. budget limited, time sensitive, etc."
        fullWidth
        value={additional}
        onChange={(e) => setAdditional(e.target.value)}
      />

      {/* snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={closeSnack} severity="warning" sx={{ width: '100%' }}>
          {snack.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DependencySelector;
