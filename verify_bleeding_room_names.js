/**
 * Verification script for BLEEDING ROOM dataElement names
 * This checks if your DHIS2 dataElements exactly match the expected names from CSV
 */

const expectedBleedingRoomNames = [
    "Does the bleeding room have space? Elaborate.",
    "Does the room have wheelchair accessibility?",
    "2 chairs",
    "Needles and syringes (different sizes)",
    "Vacutainers of different colours",
    "Tourniquet",
    "Plaster",
    "Cotton swab",
    "Disinfectant",
    "Sharps container",
    "Clinical waste bin with lid",
    "Domestic waste bin with lid",
    "Hand wash basin with running hot and cold water",
    "Hand wash soap",
    "Appropriate hand drying facilities",
    "Disposable gloves",
    "Cooler bo",  // ⚠️ Likely truncated - should be "Cooler box"
    "Ice packs",
    "Specimen racks"
];

console.log("📋 Expected BLEEDING ROOM DataElement Names:");
console.log("=".repeat(80));

expectedBleedingRoomNames.forEach((name, index) => {
    console.log(`${(index + 1).toString().padStart(2, '0')}. "${name}"`);
});

console.log("\n" + "=".repeat(80));
console.log(`\n✅ Total: ${expectedBleedingRoomNames.length} dataElements`);

console.log("\n⚠️  WARNING:");
console.log("   Item #17 appears truncated: 'Cooler bo'");
console.log("   This should likely be 'Cooler box'");
console.log("   Please verify and update checklist-final.csv if needed");

console.log("\n💡 To verify your DHIS2 dataElements:");
console.log("   1. Export your program's dataElements from DHIS2");
console.log("   2. Filter for BLEEDING ROOM section");
console.log("   3. Compare 'name' or 'displayName' fields with this list");
console.log("   4. Ensure EXACT character-for-character match");

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = expectedBleedingRoomNames;
}
