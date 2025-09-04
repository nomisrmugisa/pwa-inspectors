import React from 'react';
import { List, ListItemButton, ListItemText, ListItemIcon, Badge } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

export function SectionRail({ sections = [], currentIndex = 0, onSelect = () => {}, getSectionStatus = () => ({ completed: false, errors: 0 }) }) {
  return (
    <div style={{ position: 'sticky', top: 0 }}>
      <List dense>
        {sections.map((section, index) => {
          const { completed, errors } = getSectionStatus(section, index) || { completed: false, errors: 0 };
          return (
            <ListItemButton
              key={section.id || index}
              selected={index === currentIndex}
              onClick={() => onSelect(index)}
            >
              <ListItemIcon>
                <Badge color={errors > 0 ? 'error' : 'default'} badgeContent={errors || null} overlap="circular">
                  {completed ? (
                    <CheckCircleIcon color="success" fontSize="small" />
                  ) : (
                    <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
                  )}
                </Badge>
              </ListItemIcon>
              <ListItemText
                primary={section.displayName || section.name}
                primaryTypographyProps={{ noWrap: true }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </div>
  );
}


