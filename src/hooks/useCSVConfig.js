import { useState, useEffect, useCallback } from 'react';
import { CSVConfigParser, DHIS2DataElementMapper } from '../utils/csvConfigParser';
import { apiService } from './useAPI';

/**
 * Custom Hook for Managing CSV Configuration with DHIS2 Data Elements
 * Handles loading, parsing, and managing CSV-based form configurations
 * that map to actual DHIS2 Data Elements (including comment pairs)
 */
export function useCSVConfig() {
  const [csvContent, setCsvContent] = useState(null);
  const [csvConfig, setCsvConfig] = useState(null);
  const [mapper, setMapper] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // DHIS2 integration using your existing API service
  const [dhis2DataElements, setDhis2DataElements] = useState([]);
  const [dhis2Loading, setDhis2Loading] = useState(false);
  const [dhis2Error, setDhis2Error] = useState(null);

  // Monitor csvConfig state changes for debugging
  useEffect(() => {
    console.log('🔄 useCSVConfig: csvConfig state changed:', {
      hasConfig: !!csvConfig,
      configType: csvConfig ? csvConfig.constructor.name : 'null',
      facilityTypes: csvConfig?.facilityTypes?.length || 0,
      sections: csvConfig?.sections?.length || 0,
      totalQuestions: csvConfig?.totalQuestions || 0
    });
    
    if (csvConfig) {
      console.log('✅ useCSVConfig: csvConfig details:', {
        facilityTypes: csvConfig.facilityTypes,
        sections: csvConfig.sections,
        totalQuestions: csvConfig.totalQuestions
      });
    }
  }, [csvConfig]);

  /**
   * Load CSV content from a file or string
   */
  const loadCSVContent = useCallback(async (source) => {
    console.log('🔄 useCSVConfig: Starting CSV content load...');
    console.log('📄 useCSVConfig: Source type:', typeof source);
    console.log('📄 useCSVConfig: Source length:', source?.length);
    
    setLoading(true);
    setError(null);
    
    try {
      let content;
      
      if (typeof source === 'string') {
        console.log('📝 useCSVConfig: Processing string source...');
        content = source;
      } else if (source instanceof File) {
        console.log('📁 useCSVConfig: Processing file source...');
        content = await source.text();
      } else if (typeof source === 'object' && source.url) {
        console.log('🌐 useCSVConfig: Processing URL source...');
        const response = await fetch(source.url);
        content = await response.text();
      } else {
        throw new Error('Invalid source type. Expected string, File, or object with URL.');
      }
      
      console.log('📄 useCSVConfig: Content processed, length:', content?.length);
      
      if (!content || content.trim().length === 0) {
        throw new Error('Empty or invalid CSV content.');
      }
      
      console.log('🔍 useCSVConfig: Creating CSVConfigParser...');
      const parser = new CSVConfigParser(content);
      console.log('✅ useCSVConfig: CSVConfigParser created successfully');
      
      console.log('📊 useCSVConfig: Parser config:', {
        facilityTypes: parser.getAvailableFacilityTypes(),
        sections: parser.config.sections?.length,
        totalQuestions: parser.config.totalQuestions
      });
      
      console.log('🔄 useCSVConfig: Updating csvConfig state...');
      setCsvConfig(parser.config);
      console.log('✅ useCSVConfig: csvConfig state updated');
      
      // Initialize the mapper
      console.log('🔗 useCSVConfig: Creating DHIS2DataElementMapper...');
      const newMapper = new DHIS2DataElementMapper(parser.config);
      setMapper(newMapper);
      console.log('✅ useCSVConfig: DHIS2DataElementMapper created successfully');
      
      setLoading(false);
      console.log('✅ useCSVConfig: Loading completed');
      
    } catch (error) {
      console.error('❌ useCSVConfig: Error loading CSV content:', error);
      setError(error.message);
      setLoading(false);
      setCsvConfig(null);
    }
  }, []);

  /**
   * Load real DHIS2 Data Elements from the specific program stage
   */
  const loadDHIS2Data = useCallback(async () => {
    try {
      setDhis2Loading(true);
      setDhis2Error(null);
      
      console.log('🔄 Loading DHIS2 Data Elements from program stage...');
      
      // Get the complete data collection configuration which includes program stage Data Elements
      const config = await apiService.getDataCollectionConfiguration();
      
      // Extract all Data Elements from the program stage
      const elements = config.programStage.allDataElements || [];
      setDhis2DataElements(elements);
      
      console.log('✅ DHIS2 Program Stage Data Elements loaded successfully:', {
        totalElements: elements.length,
        programName: config.program.displayName,
        stageName: config.programStage.displayName,
        sectionsCount: config.programStage.sections.length,
        sampleElements: elements.slice(0, 3).map(de => ({
          id: de.id,
          displayName: de.displayName,
          valueType: de.valueType
        }))
      });
      
    } catch (error) {
      console.error('❌ Failed to load DHIS2 Program Stage Data Elements:', error);
      setDhis2Error(error.message);
      
      // Don't throw error - allow fallback to mock data
      console.log('🔄 DHIS2 data loading failed, will use mock data as fallback');
    } finally {
      setDhis2Loading(false);
    }
  }, []);

  /**
   * Refresh DHIS2 data (useful for testing)
   */
  const refreshDHIS2Data = useCallback(async () => {
    console.log('🔄 Refreshing DHIS2 Data Elements...');
    await loadDHIS2Data();
  }, [loadDHIS2Data]);

  /**
   * Get form configuration for a specific facility type with DHIS2 Data Elements
   */
  const getFormConfig = useCallback((facilityType, dhis2DataElements) => {
    if (!mapper || !facilityType || !dhis2DataElements?.length) {
      return null;
    }
    
    try {
      return mapper.getFormConfig(facilityType, dhis2DataElements);
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [mapper]);

  /**
   * Validate mapping between CSV configuration and DHIS2 Data Elements
   */
  const validateMapping = useCallback((dhis2DataElements) => {
    if (!mapper || !dhis2DataElements?.length) {
      return {
        isValid: false,
        errors: ['No mapper or DHIS2 Data Elements provided'],
        warnings: [],
        mapping: {}
      };
    }
    
    try {
      return mapper.validateMapping(dhis2DataElements);
    } catch (err) {
      setError(err.message);
      return {
        isValid: false,
        errors: [err.message],
        warnings: [],
        mapping: {}
      };
    }
  }, [mapper]);

  /**
   * Map DHIS2 Data Elements to CSV configuration
   */
  const mapDHIS2DataElements = useCallback((dhis2DataElements) => {
    if (!mapper || !dhis2DataElements?.length) {
      return {};
    }
    
    try {
      return mapper.mapDHIS2DataElements(dhis2DataElements);
    } catch (err) {
      setError(err.message);
      return {};
    }
  }, [mapper]);

  /**
   * Get available facility types
   */
  const getAvailableFacilityTypes = useCallback(() => {
    if (!csvConfig) {
      return [];
    }
    
    return csvConfig.getAvailableFacilityTypes();
  }, [csvConfig]);

  /**
   * Get section names
   */
  const getSectionNames = useCallback(() => {
    if (!csvConfig) {
      return [];
    }
    
    return csvConfig.getSectionNames();
  }, [csvConfig]);

  /**
   * Get questions for a specific section
   */
  const getQuestionsForSection = useCallback((sectionName) => {
    if (!csvConfig) {
      return [];
    }
    
    return csvConfig.getQuestionsForSection(sectionName);
  }, [csvConfig]);

  /**
   * Export current configuration as JSON
   */
  const exportConfig = useCallback(() => {
    if (!csvConfig) {
      return null;
    }
    
    return csvConfig.exportConfig();
  }, [csvConfig]);

  /**
   * Validate CSV configuration structure
   */
  const validateConfig = useCallback(() => {
    if (!csvConfig) {
      return { isValid: false, errors: ['No CSV configuration loaded'] };
    }
    
    const errors = [];
    
    // Check if facility types exist
    if (!csvConfig.facilityTypes || csvConfig.facilityTypes.length === 0) {
      errors.push('No facility types found in CSV');
    }
    
    // Check if sections exist
    if (!csvConfig.sections || csvConfig.sections.length === 0) {
      errors.push('No sections found in CSV');
    }
    
    // Check if questions exist in sections
    if (csvConfig.sections) {
      csvConfig.sections.forEach((section, sectionIndex) => {
        if (!section.questions || section.questions.length === 0) {
          errors.push(`Section "${section.name}" has no questions`);
        }
        
        if (section.questions) {
          section.questions.forEach((question, questionIndex) => {
            if (!question.text || question.text.trim() === '') {
              errors.push(`Empty question text in section "${section.name}" at position ${questionIndex + 1}`);
            }
          });
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, [csvConfig]);

  /**
   * Get configuration statistics
   */
  const getConfigStats = useCallback(() => {
    if (!csvConfig) {
      return null;
    }
    
    return {
      facilityTypes: csvConfig.facilityTypes?.length || 0,
      sections: csvConfig.sections?.length || 0,
      totalQuestions: csvConfig.totalQuestions || 0,
      averageQuestionsPerSection: csvConfig.sections && csvConfig.totalQuestions ? 
        csvConfig.totalQuestions / csvConfig.sections.length : 0
    };
  }, [csvConfig]);

  /**
   * Get mapping statistics when DHIS2 Data Elements are provided
   */
  const getMappingStats = useCallback((dhis2DataElements) => {
    if (!mapper || !dhis2DataElements?.length || !csvConfig) {
      return null;
    }
    
    try {
      const mapping = mapper.mapDHIS2DataElements(dhis2DataElements);
      const totalMapped = Object.values(mapping).reduce((sum, section) => 
        sum + (section.dataElements?.length || 0), 0
      );
      
      return {
        totalDHIS2Elements: dhis2DataElements.length,
        totalMappedPairs: totalMapped,
        mappingCoverage: csvConfig.totalQuestions ? totalMapped / csvConfig.totalQuestions : 0,
        sectionsWithMapping: Object.keys(mapping).length,
        totalSections: csvConfig.sections?.length || 0
      };
    } catch (err) {
      console.error('Error getting mapping stats:', err);
      return null;
    }
  }, [mapper, csvConfig]);

  return {
    // State
    csvContent,
    csvConfig,
    mapper,
    loading,
    error,
    
    // DHIS2 State
    dhis2DataElements,
    dhis2Loading,
    dhis2Error,
    
    // Actions
    loadCSVContent,
    loadDHIS2Data,
    refreshDHIS2Data,
    getFormConfig,
    validateMapping,
    mapDHIS2DataElements,
    getAvailableFacilityTypes,
    getSectionNames,
    getQuestionsForSection,
    exportConfig,
    validateConfig,
    getConfigStats,
    getMappingStats,
    
    // Utilities
    isConfigured: !!csvConfig && !!mapper,
    hasError: !!error,
    hasDHIS2Data: dhis2DataElements.length > 0
  };
}

/**
 * Helper function to read file as text
 */
async function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      resolve(event.target.result);
    };
    
    reader.onerror = (event) => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Helper function to fetch CSV from URL
 */
async function fetchCSVFromURL(url) {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.text();
  } catch (error) {
    throw new Error(`Failed to fetch CSV from URL: ${error.message}`);
  }
}
