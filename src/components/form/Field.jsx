import React from 'react';
import { TextField, MenuItem, Switch, FormControlLabel } from '@mui/material';

function renderByType({ valueType, value, onChange, label, options = [], readOnly = false, error = null, helperText = '' }) {
  switch (valueType) {
    case 'BOOLEAN':
    case 'TRUE_ONLY': {
      const checked = value === true || value === 'true' || value === 'Yes';
      return (
        <FormControlLabel
          control={<Switch checked={!!checked} onChange={(e) => onChange(e.target.checked)} disabled={readOnly} />}
          label={label}
        />
      );
    }
    case 'NUMBER':
    case 'INTEGER':
    case 'INTEGER_POSITIVE':
    case 'INTEGER_ZERO_OR_POSITIVE':
    case 'INTEGER_NEGATIVE': {
      return (
        <TextField
          fullWidth
          type="number"
          label={label}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          disabled={readOnly}
          error={!!error}
          helperText={error || helperText}
          size="small"
        />
      );
    }
    case 'DATE': {
      return (
        <TextField
          fullWidth
          type="date"
          label={label}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          error={!!error}
          helperText={error || helperText}
          size="small"
          InputLabelProps={{ shrink: true }}
        />
      );
    }
    default: {
      if (options && options.length > 0) {
        return (
          <TextField
            select
            fullWidth
            label={label}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
            error={!!error}
            helperText={error || helperText}
            size="small"
          >
            {options.map((opt) => (
              <MenuItem key={opt.code || opt.id || opt} value={opt.code || opt.id || opt}>
                {opt.name || opt.displayName || String(opt)}
              </MenuItem>
            ))}
          </TextField>
        );
      }
      return (
        <TextField
          fullWidth
          label={label}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          error={!!error}
          helperText={error || helperText}
          size="small"
        />
      );
    }
  }
}

export function Field({ psde, value, onChange, error, readOnly = false }) {
  const label = psde?.dataElement?.displayFormName || psde?.dataElement?.displayName || 'Field';
  const valueType = psde?.dataElement?.valueType || 'TEXT';
  const options = psde?.dataElement?.optionSet?.options || [];
  return renderByType({ valueType, value, onChange, label, options, readOnly, error });
}
