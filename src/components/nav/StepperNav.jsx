import React from 'react';
import { Box, Button } from '@mui/material';

export function StepperNav({ current = 0, total = 1, onPrev = () => {}, onNext = () => {} }) {
  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} sx={{ mt: 2 }}>
      <Button variant="outlined" onClick={onPrev} disabled={current <= 0}>
        Previous
      </Button>
      <Box sx={{ color: 'text.secondary' }}>
        Section {current + 1} of {total}
      </Box>
      <Button variant="contained" onClick={onNext} disabled={current >= total - 1}>
        Next
      </Button>
    </Box>
  );
}


