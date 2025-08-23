/**
 * CSV Configuration Parser for DHIS2 Form Generation
 * Parses the facilities checklist CSV and creates a configuration mapping
 * for dynamically rendering forms based on facility type and sections
 * 
 * The CSV acts as a configuration template, while actual Data Elements
 * (including comment pairs) come from DHIS2
 */

export class CSVConfigParser {
  constructor(csvContent) {
    this.csvContent = csvContent;
    this.config = this.parseCSV();
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 CSVConfigParser initialized:', {
        totalQuestions: this.config.totalQuestions,
        sections: this.config.sections.length,
        facilityTypes: this.config.facilityTypes.length
      });
    }
  }

  /**
   * Parse CSV content and extract configuration structure
   */
  parseCSV() {
    console.log('🔍 CSVConfigParser: Starting CSV parsing...');
    console.log('📄 CSVConfigParser: CSV content length:', this.csvContent?.length);
    console.log('📄 CSVConfigParser: CSV content type:', typeof this.csvContent);
    
    if (!this.csvContent || typeof this.csvContent !== 'string') {
      console.error('❌ CSVConfigParser: Invalid CSV content provided');
      throw new Error('Invalid CSV content. Expected a non-empty string.');
    }
    
    const lines = this.csvContent.trim().split('\n');
    console.log('📊 CSVConfigParser: Parsed lines:', lines.length);
    console.log('📊 CSVConfigParser: First few lines:', lines.slice(0, 3));
    console.log('📊 CSVConfigParser: Line 0 (headers):', lines[0]);
    console.log('📊 CSVConfigParser: Line 1 (facility types):', lines[1]);
    console.log('📊 CSVConfigParser: Line 2 (first section):', lines[2]);
    console.log('📊 CSVConfigParser: Line 3 (first question):', lines[3]);
    
    if (lines.length < 2) {
      console.error('❌ CSVConfigParser: CSV must have at least 2 lines (headers + data)');
      throw new Error('CSV must have at least 2 lines (headers + data)');
    }
    
    const headers = lines[0].split(',');
    console.log('📊 CSVConfigParser: Headers parsed:', headers.length);
    console.log('📊 CSVConfigParser: Headers:', headers);
    
    const facilityTypes = lines[1].split(',').map(type => type.trim()).filter(Boolean);
    console.log('🏥 CSVConfigParser: Facility types parsed:', facilityTypes.length);
    console.log('🏥 CSVConfigParser: Facility types:', facilityTypes);
    
    if (facilityTypes.length === 0) {
      console.error('❌ CSVConfigParser: No facility types found in CSV');
      throw new Error('No facility types found in CSV. Please check the CSV format.');
    }
    
    const sections = [];
    let totalQuestions = 0;
    
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = line.split(',');
      const firstColumn = columns[0].trim();
      
      // Enhanced section detection
      if (firstColumn.startsWith('SECTION')) {
        console.log('📋 CSVConfigParser: Found main section:', firstColumn);
        sections.push({
          name: firstColumn,
          type: 'main',
          questions: []
        });
      } else if (firstColumn && firstColumn.endsWith('?') && firstColumn.length > 20) {
        // Detect sub-sections (questions that end with ? and are longer than typical questions)
        console.log('📋 CSVConfigParser: Found sub-section:', firstColumn);
        sections.push({
          name: firstColumn,
          type: 'subsection',
          questions: []
        });
      } else if (firstColumn && sections.length > 0) {
        // This is a regular question - add it to the current section
        const currentSection = sections[sections.length - 1];
        if (currentSection && currentSection.questions) {
          console.log('📝 CSVConfigParser: Adding question to section:', firstColumn);
          currentSection.questions.push({
            text: firstColumn,
            facilityTypes: columns.slice(1).map(col => col.trim())
          });
          totalQuestions++;
        }
      } else {
        console.log('⚠️ CSVConfigParser: Skipping line (no section context):', firstColumn);
      }
    }
    
    if (sections.length === 0) {
      console.error('❌ CSVConfigParser: No sections found in CSV');
      throw new Error('No sections found in CSV. Please check the CSV format.');
    }
    
    console.log('📋 CSVConfigParser: Sections parsed:', sections.length);
    console.log('📋 CSVConfigParser: Section details:');
    sections.forEach((section, index) => {
      console.log(`  ${index + 1}. ${section.type.toUpperCase()}: "${section.name}" (${section.questions.length} questions)`);
    });
    console.log('❓ CSVConfigParser: Total questions:', totalQuestions);
    
    const config = {
      facilityTypes,
      sections,
      totalQuestions,
      // Add methods for backward compatibility
      getAvailableFacilityTypes: () => facilityTypes,
      getSectionNames: () => sections.map(section => section.name),
      getQuestionsForSection: (sectionName) => {
        const section = sections.find(s => s.name === sectionName);
        return section ? section.questions : [];
      }
    };
    
    console.log('✅ CSVConfigParser: Parsing completed successfully');
    console.log('📊 CSVConfigParser: Final config:', config);
    
    return config;
  }

  /**
   * Get configuration for a specific facility type
   */
  getConfigForFacilityType(facilityType) {
    const facilityIndex = this.config.facilityTypes.findIndex(type => 
      type.toLowerCase() === facilityType.toLowerCase()
    );
    
    if (facilityIndex === -1) {
      throw new Error(`Facility type "${facilityType}" not found in configuration`);
    }
    
    const result = {
      facilityType,
      sections: this.config.sections.map(section => ({
        name: section.name,
        questions: section.questions.map(question => ({
          text: question.text,
          response: question.responses[facilityIndex]?.response || '?'
        }))
      }))
    };
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`🏥 Facility config for "${facilityType}":`, {
        sections: result.sections.length,
        totalQuestions: result.sections.reduce((sum, s) => sum + s.questions.length, 0)
      });
    }
    
    return result;
  }

  /**
   * Get all available facility types
   */
  getAvailableFacilityTypes() {
    return this.config.facilityTypes;
  }

  /**
   * Get section names
   */
  getSectionNames() {
    return this.config.sections.map(section => section.name);
  }

  /**
   * Get questions for a specific section
   */
  getQuestionsForSection(sectionName) {
    const section = this.config.sections.find(s => s.name === sectionName);
    return section ? section.questions : [];
  }

  /**
   * Export configuration as JSON
   */
  exportConfig() {
    return JSON.stringify(this.config, null, 2);
  }
}

/**
 * DHIS2 Data Element Mapper
 * Maps CSV configuration to actual DHIS2 Data Elements
 * Expects DHIS2 to provide main Data Elements with comment pairs
 */
export class DHIS2DataElementMapper {
  constructor(csvConfig) {
    this.csvConfig = csvConfig;
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('🔗 DHIS2DataElementMapper initialized with CSV config:', {
        sections: csvConfig.sections.length,
        totalQuestions: csvConfig.totalQuestions
      });
    }
  }

  /**
   * Map DHIS2 Data Elements to CSV configuration
   * This method pairs main Data Elements with their comment Data Elements
   */
  mapDHIS2DataElements(dhis2DataElements) {
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Starting DHIS2 Data Element mapping...', {
        totalDHIS2Elements: dhis2DataElements.length
      });
    }
    
    const mappedElements = {};
    
    // Group Data Elements by their base name (removing comment suffixes)
    const groupedElements = this.groupDataElements(dhis2DataElements);
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('📦 Grouped DHIS2 Elements:', {
        totalGroups: Object.keys(groupedElements).length,
        groupsWithComments: Object.values(groupedElements).filter(g => g.commentElement).length,
        groupsWithoutComments: Object.values(groupedElements).filter(g => !g.commentElement).length
      });
    }
    
    // Map CSV questions to DHIS2 Data Element pairs
    this.csvConfig.sections.forEach(section => {
      mappedElements[section.name] = {
        sectionName: section.name,
        dataElements: section.questions.map((question, index) => {
          // Find matching DHIS2 Data Element by display name similarity
          const matchingElement = this.findMatchingDataElement(question.text, groupedElements);
          
          if (matchingElement) {
            return {
              csvQuestion: question.text,
              mainDataElement: matchingElement.mainElement,
              commentDataElement: matchingElement.commentElement,
              // Generate a unique ID for the pair
              pairId: `pair_${section.name.replace(/[^a-zA-Z0-9]/g, '_')}_${index}`
            };
          }
          
          return null;
        }).filter(Boolean) // Remove null entries
      };
    });
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      const totalMapped = Object.values(mappedElements).reduce((sum, section) => 
        sum + (section.dataElements?.length || 0), 0
      );
      console.log('✅ Mapping complete:', {
        totalMapped,
        totalCSVQuestions: this.csvConfig.totalQuestions,
        mappingCoverage: `${((totalMapped / this.csvConfig.totalQuestions) * 100).toFixed(1)}%`
      });
    }
    
    return mappedElements;
  }

  /**
   * Group DHIS2 Data Elements into main + comment pairs
   */
  groupDataElements(dhis2DataElements) {
    const grouped = {};
    
    dhis2DataElements.forEach(de => {
      const displayName = de.displayName || '';
      
      // Check if this is a comment Data Element
      if (this.isCommentDataElement(displayName)) {
        // Find the main Data Element this comment belongs to
        const mainElementName = this.extractMainElementName(displayName);
        if (mainElementName) {
          if (!grouped[mainElementName]) {
            grouped[mainElementName] = {};
          }
          grouped[mainElementName].commentElement = de;
          
          // Debug logging
          if (process.env.NODE_ENV === 'development') {
            console.log(`💬 Comment element mapped: "${displayName}" → "${mainElementName}"`);
          }
        }
      } else {
        // This is a main Data Element
        if (!grouped[displayName]) {
          grouped[displayName] = {};
        }
        grouped[displayName].mainElement = de;
      }
    });
    
    return grouped;
  }

  /**
   * Check if a Data Element is a comment field
   */
  isCommentDataElement(displayName) {
    const commentPatterns = [
      /comment/i,
      /notes/i,
      /observations/i,
      /additional/i,
      /remarks/i,
      /explanation/i
    ];
    
    return commentPatterns.some(pattern => pattern.test(displayName));
  }

  /**
   * Extract the main element name from a comment Data Element
   */
  extractMainElementName(commentDisplayName) {
    // Common patterns for comment fields
    const patterns = [
      /comment\s+(?:for|on|about)?\s*:?\s*(.+)/i,
      /notes?\s+(?:for|on|about)?\s*:?\s*(.+)/i,
      /observations?\s+(?:for|on|about)?\s*:?\s*(.+)/i,
      /additional\s+(?:notes?|comments?)\s+(?:for|on|about)?\s*:?\s*(.+)/i
    ];
    
    for (const pattern of patterns) {
      const match = commentDisplayName.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    // If no pattern matches, try to extract by removing common comment prefixes
    return commentDisplayName
      .replace(/^(comment|notes?|observations?|additional\s+notes?)\s*:?\s*/i, '')
      .trim();
  }

  /**
   * Find matching DHIS2 Data Element for a CSV question
   */
  findMatchingDataElement(csvQuestion, groupedElements) {
    const normalizedQuestion = this.normalizeText(csvQuestion);
    
    // Try exact matches first
    for (const [elementName, group] of Object.entries(groupedElements)) {
      if (this.normalizeText(elementName) === normalizedQuestion) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🎯 Exact match found: "${csvQuestion}" ↔ "${elementName}"`);
        }
        return group;
      }
    }
    
    // Try partial matches
    for (const [elementName, group] of Object.entries(groupedElements)) {
      const normalizedElementName = this.normalizeText(elementName);
      
      // Check if CSV question contains the element name or vice versa
      if (normalizedQuestion.includes(normalizedElementName) || 
          normalizedElementName.includes(normalizedQuestion)) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 Partial match found: "${csvQuestion}" ↔ "${elementName}"`);
        }
        return group;
      }
    }
    
    // Try fuzzy matching for similar questions
    for (const [elementName, group] of Object.entries(groupedElements)) {
      const normalizedElementName = this.normalizeText(elementName);
      const similarity = this.calculateSimilarity(normalizedQuestion, normalizedElementName);
      
      if (similarity > 0.7) { // 70% similarity threshold
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 Fuzzy match found: "${csvQuestion}" ↔ "${elementName}" (${(similarity * 100).toFixed(1)}% similarity)`);
        }
        return group;
      }
    }
    
    // Debug logging for unmatched questions
    if (process.env.NODE_ENV === 'development') {
      console.log(`❌ No match found for: "${csvQuestion}"`);
    }
    
    return null;
  }

  /**
   * Normalize text for comparison
   */
  normalizeText(text) {
    return text.toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculate text similarity using simple algorithm
   */
  calculateSimilarity(text1, text2) {
    const words1 = text1.split(' ');
    const words2 = text2.split(' ');
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]);
    
    return commonWords.length / totalWords.size;
  }

  /**
   * Get form configuration for a specific facility type
   */
  getFormConfig(facilityType, dhis2DataElements) {
    const facilityConfig = this.csvConfig.getConfigForFacilityType(facilityType);
    const mappedElements = this.mapDHIS2DataElements(dhis2DataElements);
    
    const result = {
      facilityType,
      sections: facilityConfig.sections.map(section => ({
        name: section.name,
        dataElements: mappedElements[section.name]?.dataElements || []
      }))
    };
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      const totalFormElements = result.sections.reduce((sum, section) => 
        sum + (section.dataElements?.length || 0), 0
      );
      console.log(`📝 Form config generated for "${facilityType}":`, {
        sections: result.sections.length,
        totalFormElements,
        sectionsWithElements: result.sections.filter(s => s.dataElements.length > 0).length
      });
    }
    
    return result;
  }

  /**
   * Validate that all CSV questions have corresponding DHIS2 Data Elements
   */
  validateMapping(dhis2DataElements) {
    const mappedElements = this.mapDHIS2DataElements(dhis2DataElements);
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      mapping: mappedElements
    };
    
    // Check each section
    this.csvConfig.sections.forEach(section => {
      const mappedSection = mappedElements[section.name];
      
      if (!mappedSection) {
        validation.errors.push(`Section "${section.name}" has no mapped Data Elements`);
        validation.isValid = false;
        return;
      }
      
      // Check each question
      section.questions.forEach((question, index) => {
        const mappedElement = mappedSection.dataElements[index];
        
        if (!mappedElement) {
          validation.errors.push(`Question "${question.text}" in section "${section.name}" has no mapped Data Element`);
          validation.isValid = false;
        } else if (!mappedElement.commentDataElement) {
          validation.warnings.push(`Question "${question.text}" in section "${section.name}" has no comment Data Element`);
        }
      });
    });
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Mapping validation result:', {
        isValid: validation.isValid,
        errors: validation.errors.length,
        warnings: validation.warnings.length
      });
      
      if (validation.errors.length > 0) {
        console.error('❌ Mapping errors:', validation.errors);
      }
      if (validation.warnings.length > 0) {
        console.warn('⚠️ Mapping warnings:', validation.warnings);
      }
    }
    
    return validation;
  }
}
