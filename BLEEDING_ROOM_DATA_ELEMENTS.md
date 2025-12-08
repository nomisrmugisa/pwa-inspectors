# BLEEDING ROOM - Data Elements for Obstetrics & Gynaecology

The following 22 data elements are configured for the BLEEDING ROOM section in Obstetrics & Gynaecology facilities.

**These exact names must exist as Data Elements in DHIS2** for them to appear in your inspection form.

## List of Data Elements (from obstetricsandgynaecology.js):

1. Does the bleeding room have space? Elaborate.
2. Does the room have wheelchair accessibility?
3. · 2 chairs
4. · Needles and syringes (different sizes)
5. · Vacutainers of different colours
6. · Tourniquet
7. · Plaster
8. · Cotton swab
9. · Disinfectant
10. · Sharps container
11. · Clinical waste bin with lid
12. · Domestic waste bin with lid
13. · Hand wash basin with running hot and cold water
14. . Hand wash soap
15. · Appropriate hand drying facilities
16. · Disposable gloves
17. · Cooler bo
18. · Ice packs
19. Specimen racks

## Currently Showing in App (4 out of 22):

Based on your screenshot, only these 4 are currently showing:
- Does the bleeding room have space? Elaborate.
- Does the room have wheelchair accessibility?
- . Hand wash soap (note: starts with "." not "·")
- Specimen racks

## Action Required:

To see all 22 data elements in your form, you need to:

1. Go to DHIS2 Maintenance → Programs → [Your Inspection Program]
2. Navigate to Program Stages → Inspections
3. Add the missing 18 data elements with **EXACT names** as listed above
4. **Important**: Pay attention to special characters:
   - Some start with "·" (bullet point / middle dot)
   - Some start with "." (period)
   - Exact spelling and capitalization must match

## Notes:

- Item #17 "· Cooler bo" appears to be incomplete (possibly "Cooler box")
- Item #14 starts with "." instead of "·" (different character)
- All items starting with "·" must have that exact bullet character in DHIS2

## Alternative: Update CSV to Match Existing DHIS2 Names

If you prefer to keep your existing DHIS2 data elements, you can instead:
1. Export your DHIS2 data element names
2. Update checklist-final.csv to use those exact names
3. Re-run: `python src/config/generateFilters.py`
