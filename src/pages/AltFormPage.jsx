import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { Grid, Paper, Box, Typography, Divider } from '@mui/material';
import { SectionRail } from '../components/layout/SectionRail';
import { StepperNav } from '../components/nav/StepperNav';
import { Field } from '../components/form/Field';

export function AltFormPage() {
  const { configuration } = useApp();

  const sections = useMemo(() => configuration?.sections || [], [configuration]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [formData, setFormData] = useState({});

  // Simple localStorage autosave/restore for testing
  useEffect(() => {
    const saved = localStorage.getItem('altform-draft');
    if (saved) {
      try { setFormData(JSON.parse(saved)); } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('altform-draft', JSON.stringify(formData));
  }, [formData]);

  const getSectionStatus = useCallback((section) => {
    const p = section.programStageDataElements || [];
    let filled = 0;
    p.forEach((psde) => {
      const key = `de_${psde.dataElement.id}`;
      if (formData[key] !== undefined && formData[key] !== '') filled += 1;
    });
    return { completed: p.length > 0 && filled === p.length, errors: 0 };
  }, [formData]);

  const current = sections[currentIndex] || { programStageDataElements: [] };
  const fields = current.programStageDataElements || [];

  const handleChange = (psdeId, val) => {
    setFormData((prev) => ({ ...prev, [`de_${psdeId}`]: val }));
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Alternative Form UI
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Paper variant="outlined" sx={{ p: 1 }}>
            <SectionRail
              sections={sections}
              currentIndex={currentIndex}
              onSelect={setCurrentIndex}
              getSectionStatus={getSectionStatus}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={9}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {current.displayName || current.name || 'Section'}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {fields.map((psde) => (
                <Grid item xs={12} md={6} key={psde.dataElement.id}>
                  <Field
                    psde={psde}
                    value={formData[`de_${psde.dataElement.id}`]}
                    onChange={(v) => handleChange(psde.dataElement.id, v)}
                  />
                </Grid>
              ))}
            </Grid>
            <StepperNav
              current={currentIndex}
              total={sections.length}
              onPrev={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              onNext={() => setCurrentIndex((i) => Math.min(sections.length - 1, i + 1))}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}


