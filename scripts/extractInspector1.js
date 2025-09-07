#!/usr/bin/env node

/**
 * Script to extract inspector1 inspections from test data store
 * Run with: node scripts/extractInspector1.js
 */

// Import the extraction functions
const path = require('path');
const fs = require('fs');

// Read the test data store directly
const testDataStorePath = path.join(__dirname, '../src/config/testdatastore');
const testDataStore = JSON.parse(fs.readFileSync(testDataStorePath, 'utf8'));

/**
 * Extract all inspections assigned to inspector1
 * Inspector1 has ID: QbWrL3Il7gL and appears with various names
 */
function extractInspector1Inspections() {
  const inspector1Id = 'QbWrL3Il7gL';
  const inspector1Names = [
    'Inspector 1 OP',
    'inspector1',
    'Reviewer3', 
    'inspector6'
  ];

  console.log('🔍 Extracting inspections for inspector1...');
  console.log('📋 Inspector1 ID:', inspector1Id);
  console.log('📋 Inspector1 Names:', inspector1Names);

  const inspector1Inspections = [];

  // Process each inspection in the test data store
  testDataStore.forEach((inspection, index) => {
    console.log(`\n📊 Processing inspection ${index + 1}/${testDataStore.length}: ${inspection.facilityName}`);
    
    // Check if inspector1 is assigned to this inspection
    const inspector1Assignments = inspection.assignments?.filter(assignment => {
      const matchesId = assignment.inspectorId === inspector1Id;
      const matchesName = inspector1Names.some(name => 
        assignment.inspectorName?.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(assignment.inspectorName?.toLowerCase() || '')
      );
      
      if (matchesId || matchesName) {
        console.log(`✅ Found inspector1 assignment:`, {
          id: assignment.inspectorId,
          name: assignment.inspectorName,
          role: assignment.role,
          confirmed: assignment.confirmed
        });
      }
      
      return matchesId || matchesName;
    }) || [];

    // Check if inspector1 is the lead inspector
    const isLeadInspector = inspection.leadInspector?.id === inspector1Id ||
      inspector1Names.some(name => 
        inspection.leadInspector?.name?.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(inspection.leadInspector?.name?.toLowerCase() || '')
      );

    if (isLeadInspector) {
      console.log(`👑 Inspector1 is lead inspector for: ${inspection.facilityName}`);
    }

    // If inspector1 has assignments or is lead inspector, include this inspection
    if (inspector1Assignments.length > 0 || isLeadInspector) {
      const inspectionData = {
        // Basic inspection info
        id: inspection.id,
        facilityId: inspection.facilityId,
        facilityName: inspection.facilityName,
        facilityType: inspection.facilityType,
        inspectionID: inspection.inspectionID,
        inspectionType: inspection.inspectionType,
        
        // Dates and status
        startDate: inspection.startDate,
        endDate: inspection.endDate,
        status: inspection.status,
        createdAt: inspection.createdAt,
        updatedAt: inspection.updatedAt,
        
        // Approval info
        approvedAt: inspection.approvedAt,
        approvedBy: inspection.approvedBy,
        directorApproval: inspection.directorApproval,
        directorComments: inspection.directorComments,
        finalApproverApproved: inspection.finalApproverApproved,
        inspectorAdminApproved: inspection.inspectorAdminApproved,
        
        // Inspector1 specific data
        inspector1Assignments: inspector1Assignments,
        isLeadInspector: isLeadInspector,
        leadInspector: inspection.leadInspector,
        
        // All assignments for context
        allAssignments: inspection.assignments,
        
        // Additional fields that might be relevant
        trackedEntityInstance: inspection.trackedEntityInstance,
        finalApproverApprovedAt: inspection.finalApproverApprovedAt,
        finalApproverApprovedBy: inspection.finalApproverApprovedBy,
        inspectorAdminApprovedAt: inspection.inspectorAdminApprovedAt,
        inspectorAdminApprovedBy: inspection.inspectorAdminApprovedBy
      };

      inspector1Inspections.push(inspectionData);
      
      console.log(`📝 Added inspection: ${inspection.facilityName} (${inspector1Assignments.length} assignments, lead: ${isLeadInspector})`);
    }
  });

  console.log(`\n✅ Extraction complete! Found ${inspector1Inspections.length} inspections for inspector1`);
  
  return inspector1Inspections;
}

/**
 * Get summary statistics for inspector1's inspections
 */
function getInspector1Summary(inspections) {
  const summary = {
    totalInspections: inspections.length,
    byStatus: {},
    byInspectionType: {},
    byFacilityType: {},
    asLeadInspector: 0,
    asStandardInspector: 0,
    confirmedAssignments: 0,
    pendingAssignments: 0,
    approvedInspections: 0,
    scheduledInspections: 0
  };

  inspections.forEach(inspection => {
    // Count by status
    const status = inspection.status || 'Unknown';
    summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;
    
    // Count by inspection type
    const inspType = inspection.inspectionType || 'Unknown';
    summary.byInspectionType[inspType] = (summary.byInspectionType[inspType] || 0) + 1;
    
    // Count by facility type
    const facType = inspection.facilityType || 'Unknown';
    summary.byFacilityType[facType] = (summary.byFacilityType[facType] || 0) + 1;
    
    // Count lead vs standard inspector roles
    if (inspection.isLeadInspector) {
      summary.asLeadInspector++;
    }
    
    // Count role types from assignments
    inspection.inspector1Assignments.forEach(assignment => {
      if (assignment.role === 'lead' || assignment.role?.includes('LEAD')) {
        summary.asLeadInspector++;
      } else if (assignment.role?.includes('STANDARD')) {
        summary.asStandardInspector++;
      }
      
      // Count confirmation status
      if (assignment.confirmed === 'confirmed' || assignment.confirmed === 'approved') {
        summary.confirmedAssignments++;
      } else {
        summary.pendingAssignments++;
      }
    });
    
    // Count approval status
    if (inspection.status === 'scheduled' || inspection.approvedBy) {
      summary.approvedInspections++;
    }
    
    if (inspection.status === 'scheduled') {
      summary.scheduledInspections++;
    }
  });

  return summary;
}

// Main execution
function main() {
  console.log('🎯 INSPECTOR1 INSPECTION DATA EXTRACTION');
  console.log('=' .repeat(60));
  
  const inspections = extractInspector1Inspections();
  const summary = getInspector1Summary(inspections);
  
  console.log('\n📊 SUMMARY:');
  console.log(JSON.stringify(summary, null, 2));
  
  console.log('\n📄 FACILITIES ASSIGNED TO INSPECTOR1:');
  inspections.forEach((inspection, index) => {
    console.log(`${index + 1}. ${inspection.facilityName} (${inspection.facilityType || 'Unknown Type'})`);
    console.log(`   - Status: ${inspection.status || 'Unknown'}`);
    console.log(`   - Type: ${inspection.inspectionType || 'Unknown'}`);
    console.log(`   - Dates: ${inspection.startDate} to ${inspection.endDate}`);
    console.log(`   - Lead Inspector: ${inspection.isLeadInspector ? 'YES' : 'NO'}`);
    console.log(`   - Assignments: ${inspection.inspector1Assignments.length}`);
    inspection.inspector1Assignments.forEach(assignment => {
      console.log(`     * Role: ${assignment.role || 'Standard'}, Status: ${assignment.confirmed || 'Pending'}`);
    });
    console.log('');
  });
  
  // Write results to file
  const outputPath = path.join(__dirname, '../inspector1_inspections.json');
  fs.writeFileSync(outputPath, JSON.stringify({ inspections, summary }, null, 2));
  console.log(`📁 Results saved to: ${outputPath}`);
  
  return { inspections, summary };
}

// Run the extraction
if (require.main === module) {
  main();
}

module.exports = {
  extractInspector1Inspections,
  getInspector1Summary,
  main
};
