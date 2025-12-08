# BLEEDING ROOM - DHIS2 Data Element Names (EXACT MATCH REQUIRED)

**Updated:** 2025-12-04  
**Source:** checklist-final.csv

The following **19 data elements** are configured for the BLEEDING ROOM section.  
These apply to 8 facility types: Obstetrics & Gynaecology, laboratory, Eye, ENT, Rehabilitation, General Practice, Paediatric, and Nursing Home.

---

## ⚠️ CRITICAL: EXACT NAME MATCHING REQUIRED

Your DHIS2 dataElements **must have these EXACT names** (character-for-character) for the filtering to work:

---

## List of Data Elements:

1. `Does the bleeding room have space? Elaborate.`
2. `Does the room have wheelchair accessibility?`
3. `2 chairs`
4. `Needles and syringes (different sizes)`
5. `Vacutainers of different colours`
6. `Tourniquet`
7. `Plaster`
8. `Cotton swab`
9. `Disinfectant`
10. `Sharps container`
11. `Clinical waste bin with lid`
12. `Domestic waste bin with lid`
13. `Hand wash basin with running hot and cold water`
14. `Hand wash soap`
15. `Appropriate hand drying facilities`
16. `Disposable gloves`
17. `Cooler bo` ⚠️ **TRUNCATED - Likely should be "Cooler box"**
18. `Ice packs`
19. `Specimen racks`

---

## 🔴 DISCREPANCY FOUND!

### Old Configuration (22 items with special characters):
Your previous `BLEEDING_ROOM_DATA_ELEMENTS.md` listed 22 items with bullet points (·) and periods (.) prefixes.

### New Configuration (19 items, no special prefixes):
The current `checklist-final.csv` has 19 items **WITHOUT** the special character prefixes.

### Examples of Changes:
| Old Name | New Name |
|----------|----------|
| `· 2 chairs` | `2 chairs` |
| `· Needles and syringes (different sizes)` | `Needles and syringes (different sizes)` |
| `. Hand wash soap` | `Hand wash soap` |

---

## 🛠️ Action Required:

### Option 1: Update DHIS2 to Match New CSV (Recommended)
1. Go to DHIS2 → Maintenance → Programs → Your Inspection Program
2. Update all BLEEDING ROOM dataElement names to match the list above
3. Remove the `·` and `.` prefixes from dataElement names
4. Ensure EXACT character match

### Option 2: Update CSV to Match Existing DHIS2
1. Export your current DHIS2 dataElement names
2. Update `checklist-final.csv` with those exact names
3. Run: `python src/config/generateFilters.py`

---

## 📋 Verification Checklist:

- [ ] All 19 dataElements exist in DHIS2 program
- [ ] Names match EXACTLY (no extra spaces, punctuation, etc.)
- [ ] Item #17 "Cooler bo" is corrected to proper name
- [ ] No special prefixes (·, .) in DHIS2 names
- [ ] Configuration regenerated: `python src/config/generateFilters.py`
- [ ] App tested with updated configuration

---

## 💡 Quick Test:

After updating, test with one of these facility types:
- Obstetrics & Gynaecology
- laboratory
- Eye (Opthalmology /Optometry)
- Ear, Nose & Throat

All 19 BLEEDING ROOM items should appear in the form.

---

## 🔍 Debugging Tips:

If items don't show:
1. Check browser console for filtering logs
2. Verify dataElement names in DHIS2 (exact match)
3. Confirm facility type selection matches one of the 8 listed above
4. Check `sectionVisibilityConfig.js` is properly loaded
5. Verify the section is selected in the department list
