import React from 'react';
import { Alert, List, ListItem, ListItemText } from '@mui/material';

export function ErrorSummary({ sections = [], sectionErrors = {}, currentIndex = 0 }) {
  const total = Object.values(sectionErrors).reduce((a, b) => a + (b || 0), 0);
  if (total === 0) return null;

  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      {total} validation {total === 1 ? 'issue' : 'issues'} across sections
      <List dense>
        {sections.map((s, i) => {
          const count = sectionErrors[i] || 0;
          if (!count) return null;
          return (
            <ListItem key={s.id || i} sx={{ py: 0 }}>
              <ListItemText primary={`${s.displayName || s.name}: ${count}`} />
            </ListItem>
          );
        })}
      </List>
    </Alert>
  );
}


