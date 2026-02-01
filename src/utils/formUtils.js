
/**
 * Detect subsection headers: strictly exactly two trailing dashes "--" (with optional surrounding spaces)
 */
export const isSectionHeaderName = (name) => {
    if (!name || typeof name !== 'string') return false;
    return /\s*--\s*$/.test(name) && !/\s*---+\s*$/.test(name);
};

/**
 * Strip exactly two trailing dashes for display
 */
export const normalizeSectionHeaderName = (name) => {
    if (!name || typeof name !== 'string') return '';
    return name.replace(/\s*--\s*$/, '').trim();
};

/**
 * Detect if a string is all uppercase letters (ignoring numbers/punctuation)
 */
export const isAllCaps = (name) => {
    if (!name || typeof name !== 'string') return false;
    const clean = name.trim();
    if (clean.length <= 3) return false;
    // Must have letters, and none of them can be lowercase
    return /[A-Z]/.test(clean) && !/[a-z]/.test(clean);
};

/**
 * Detect number-prefixed all-caps labels (e.g., "18.15.1 GENERAL DOES THE THEATRE...")
 */
export const isNumberPrefixedAllCapsLabel = (name) => {
    if (!name || typeof name !== 'string') return false;
    // Match: starts with digits, possibly followed by dots/digits (like 18.15.1),
    // then space, then ALL CAPS text (letters, spaces, punctuation but NO lowercase)
    const match = name.match(/^[\d.]+\s+(.+)$/);
    if (!match) return false;
    const textAfterNumber = match[1];
    // Check if the text after the number prefix is all uppercase (no lowercase letters)
    // Allow numbers, spaces, and punctuation
    return textAfterNumber.length > 3 &&
        textAfterNumber === textAfterNumber.toUpperCase() &&
        /[A-Z]/.test(textAfterNumber) &&  // Must have at least one letter
        !/[a-z]/.test(textAfterNumber);    // No lowercase letters
};

/**
 * Calculate completion percentage for a list of data elements
 */
export const calculateProgress = (dataElements, formData) => {
    if (!dataElements || dataElements.length === 0) return 0;

    // Filter out headers/labels as they are not input fields
    const inputElements = dataElements.filter(psde => {
        const name = psde?.dataElement?.displayName || '';
        if (!name) return false;
        return !isSectionHeaderName(name) && !isNumberPrefixedAllCapsLabel(name) && !isAllCaps(name);
    });

    if (inputElements.length === 0) return 0;

    const filledCount = inputElements.reduce((acc, psde) => {
        if (!psde?.dataElement?.id) return acc;
        const fieldName = `dataElement_${psde.dataElement.id}`;
        const value = formData[fieldName];
        return acc + (value && value !== '' ? 1 : 0);
    }, 0);

    return Math.round((filledCount / inputElements.length) * 100);
};

/**
 * Return answered and total counts for a list of data elements.
 */
export const getProgressCounts = (dataElements, formData) => {
    if (!dataElements || dataElements.length === 0) return { answered: 0, total: 0 };
    const inputElements = dataElements.filter(psde => {
        const name = psde?.dataElement?.displayName || '';
        if (!name) return false;
        return !isSectionHeaderName(name) && !isNumberPrefixedAllCapsLabel(name) && !isAllCaps(name);
    });
    const total = inputElements.length;
    const answered = inputElements.reduce((acc, psde) => {
        if (!psde?.dataElement?.id) return acc;
        const fieldName = `dataElement_${psde.dataElement.id}`;
        const value = formData[fieldName];
        return acc + (value && value !== '' ? 1 : 0);
    }, 0);
    return { answered, total };
};
