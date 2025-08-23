# CSV-Based Dynamic Form System for DHIS2

## Overview

This system provides a **CSV-driven configuration approach** for generating dynamic inspection forms in DHIS2. It automatically parses CSV checklist files and generates forms with **automatic comment fields** for each Data Element, ensuring comprehensive data capture during facility inspections.

## 🎯 Key Features

- ✅ **CSV-Driven Configuration**: Forms are generated based on CSV checklist structure
- ✅ **Automatic Comment Fields**: Every question automatically includes a comment field
- ✅ **Facility Type-Specific Forms**: Different forms for different facility types
- ✅ **Dynamic Form Generation**: Forms adapt to CSV structure changes
- ✅ **DHIS2 Integration Ready**: Designed to work with DHIS2 Data Elements
- ✅ **Offline Capable**: Works without internet connection
- ✅ **Responsive Design**: Mobile-friendly interface

## 🏗️ Architecture

### 1. CSV Configuration Parser (`src/utils/csvConfigParser.js`)
- **CSVConfigParser**: Parses CSV files and extracts facility types, sections, and questions
- **DHIS2DataElementMapper**: Maps CSV questions to DHIS2 Data Elements

### 2. Dynamic Form Renderer (`src/components/DynamicFormRenderer.jsx`)
- Renders forms based on CSV configuration
- Automatically includes comment fields for each Data Element
- Supports different field types (boolean, text, long text)

### 3. CSV Configuration Hook (`src/hooks/useCSVConfig.js`)
- Manages CSV configuration loading and parsing
- Provides validation and statistics
- Handles file uploads and URL fetching

### 4. Demo Page (`src/pages/CSVDemoPage.jsx`)
- Showcases the system functionality
- Allows testing with different facility types
- Provides configuration validation

## 📋 CSV Format Requirements

The CSV file must follow this structure:

```csv
,1,2,3,4,5,6,7,8,9,10,11
,Gynae Clinics,laboratory,Psychology clinic,Eye Clinics,physiotheraphy,dental clinic,ENT clinic,Rehabilitation Centre,Potrait clinic,Radiology,clinic
SECTION A-ORGANISATION AND MANAGEMENT,,,,,,,,,,,
Does the clinic have an organisational structure,?,?,?,?,?,?,?,?,?,?,?
Is the director a medically trained person?,?,?,?,?,?,?,?,?,?,?,?
```

### CSV Structure Rules:
1. **Row 1**: Column headers (facility types)
2. **Row 2**: Facility type names
3. **Subsequent rows**: 
   - First column: Question text or section name
   - Other columns: Response indicators (?, Y, N, etc.)
   - Section names must start with "SECTION"

## 🚀 Usage

### 1. Access the Demo
Navigate to `/csv-demo` in your application to see the system in action.

### 2. Select Facility Type
Choose the type of facility you're inspecting from the dropdown menu.

### 3. Fill Out the Form
- Each question automatically includes a comment field
- Use radio buttons for Yes/No questions
- Add detailed observations in comment fields

### 4. Submit Data
Form data is captured and ready for submission to DHIS2.

## 🔧 Configuration

### Mapping CSV to DHIS2 Data Elements

The system automatically creates mappings between CSV questions and DHIS2 Data Elements:

```javascript
// Example mapping structure
{
  "SECTION A-ORGANISATION AND MANAGEMENT": {
    sectionName: "SECTION A-ORGANISATION AND MANAGEMENT",
    dataElements: [
      {
        csvQuestion: "Does the clinic have an organisational structure?",
        dhis2DataElement: {
          id: "de_SECTION_A_ORGANISATION_AND_MANAGEMENT_0",
          displayName: "Does the clinic have an organisational structure?",
          valueType: "BOOLEAN",
          compulsory: false
        },
        commentField: {
          id: "comment_de_SECTION_A_ORGANISATION_AND_MANAGEMENT_0",
          displayName: "Comment for: Does the clinic have an organisational structure?",
          valueType: "LONG_TEXT",
          compulsory: false
        }
      }
    ]
  }
}
```

### Customizing Field Types

You can customize the field types by modifying the `createDefaultMapping` method in `DHIS2DataElementMapper`:

```javascript
createDefaultMapping() {
  // Customize value types based on question content
  const getValueType = (questionText) => {
    if (questionText.toLowerCase().includes('does') || questionText.toLowerCase().includes('is')) {
      return 'BOOLEAN';
    }
    if (questionText.toLowerCase().includes('how many') || questionText.toLowerCase().includes('count')) {
      return 'INTEGER';
    }
    return 'TEXT';
  };
  
  // Apply custom logic...
}
```

## 🔌 Integration with DHIS2

### 1. Data Element Mapping
The system can map existing DHIS2 Data Elements to CSV questions:

```javascript
const mappedElements = mapper.mapDHIS2DataElements(dhis2DataElements);
```

### 2. Form Submission
Form data is structured for DHIS2 submission:

```javascript
{
  "de_SECTION_A_ORGANISATION_AND_MANAGEMENT_0": "true",
  "comment_de_SECTION_A_ORGANISATION_AND_MANAGEMENT_0": "Organizational chart is displayed in reception area",
  "de_SECTION_A_ORGANISATION_AND_MANAGEMENT_1": "false",
  "comment_de_SECTION_A_ORGANISATION_AND_MANAGEMENT_1": "Director is not medically trained - has business background"
}
```

### 3. Offline Storage
Data is stored locally and synced when online:

```javascript
// Store form data locally
localStorage.setItem('inspection_data', JSON.stringify(formData));

// Sync with DHIS2 when online
if (isOnline) {
  await submitToDHIS2(formData);
}
```

## 📱 Mobile Optimization

The system is designed for mobile use during facility inspections:

- **Touch-friendly interface**: Large buttons and form fields
- **Responsive design**: Adapts to different screen sizes
- **Offline capability**: Works without internet connection
- **Data persistence**: Saves progress locally

## 🧪 Testing

### 1. Configuration Validation
Use the "Validate Configuration" button to check CSV structure:

```javascript
const validation = validateConfig();
if (validation.isValid) {
  console.log('Configuration is valid!');
} else {
  console.log('Errors:', validation.errors);
}
```

### 2. Statistics
View configuration statistics:

```javascript
const stats = getConfigStats();
console.log(`Facility Types: ${stats.facilityTypes}`);
console.log(`Sections: ${stats.sections}`);
console.log(`Total Questions: ${stats.totalQuestions}`);
```

## 🚨 Error Handling

The system includes comprehensive error handling:

- **CSV Parsing Errors**: Invalid CSV structure detection
- **Configuration Errors**: Missing sections or questions
- **Validation Errors**: Form field validation
- **Network Errors**: Offline/online state management

## 🔄 Future Enhancements

### Planned Features:
1. **Advanced CSV Parsing**: Support for more complex CSV structures
2. **Conditional Logic**: Show/hide questions based on previous answers
3. **Multi-language Support**: Internationalization for different regions
4. **Template System**: Pre-built CSV templates for common facility types
5. **Data Export**: Multiple export formats (PDF, Excel, CSV)
6. **Audit Trail**: Track changes and modifications

### Customization Options:
1. **Field Validation Rules**: Custom validation for specific questions
2. **Dynamic Options**: Dropdown options based on CSV data
3. **Conditional Sections**: Show sections based on facility type
4. **Custom Field Types**: Support for dates, numbers, and complex inputs

## 📚 API Reference

### CSVConfigParser Methods:
- `parseCSV()`: Parse CSV content
- `getConfigForFacilityType(facilityType)`: Get config for specific facility
- `getAvailableFacilityTypes()`: List all facility types
- `getSectionNames()`: List all section names
- `exportConfig()`: Export configuration as JSON

### DHIS2DataElementMapper Methods:
- `createDefaultMapping()`: Create default CSV-to-DE mapping
- `mapDHIS2DataElements(dhis2DataElements)`: Map DHIS2 DEs to CSV
- `getFormConfig(facilityType)`: Get form configuration

### useCSVConfig Hook:
- `loadCSVContent(source)`: Load CSV from file, string, or URL
- `getFormConfig(facilityType)`: Get form configuration
- `validateConfig()`: Validate CSV configuration
- `getConfigStats()`: Get configuration statistics

## 🤝 Contributing

To contribute to this system:

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests if applicable**
5. **Submit a pull request**

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

1. **Check the documentation** in this README
2. **Review the demo page** at `/csv-demo`
3. **Examine the code examples** in the source files
4. **Create an issue** for bugs or feature requests

---

**Note**: This system is designed to work with DHIS2 but can be adapted for other health information systems. The CSV-based approach makes it easy to modify forms without changing code.


