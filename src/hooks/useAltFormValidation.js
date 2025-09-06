import { useMemo } from 'react';

export function useAltFormValidation(sections = [], formData = {}) {
  const { fieldErrors, sectionErrors } = useMemo(() => {
    const fieldErrorsAcc = {};
    const sectionErrorsAcc = {};

    sections.forEach((section, sIdx) => {
      let count = 0;
      const psdes = section?.programStageDataElements || [];
      psdes.forEach((psde) => {
        const de = psde?.dataElement;
        if (!de) return;
        const key = `de_${de.id}`;
        const isRequired = psde?.compulsory === true || de?.mandatory === true || false;
        const val = formData[key];
        if (isRequired) {
          const empty = val === undefined || val === null || val === '';
          if (empty) {
            fieldErrorsAcc[key] = 'Required';
            count += 1;
          }
        }
      });
      sectionErrorsAcc[sIdx] = count;
    });

    return { fieldErrors: fieldErrorsAcc, sectionErrors: sectionErrorsAcc };
  }, [sections, formData]);

  return { fieldErrors, sectionErrors };
}
