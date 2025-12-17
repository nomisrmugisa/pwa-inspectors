# Service Departments: CSV vs DHIS2 Mapping Analysis

> **Generated on:** 2025-12-17  
> **Purpose:** Identify which service departments from the CSV are properly mapped to DHIS2 sections

---

## Overview

The app uses **CSV-generated sections** (from `checklist for facilities2.0.csv`) which must match **DHIS2 programStageSections** for the form fields to display correctly.

---

## Reference DHIS2 Sections (from sections.txt)

These are the known DHIS2 section names from previous configuration:

| # | DHIS2 Section Name |
|:-:|:-------------------|
| 1 | ORGANISATION AND MANAGEMENT |
| 2 | SERVICES PROVIDED |
| 3 | PERSONNEL |
| 4 | FACILITY-ENVIONMENT |
| 5 | FACILITY-RECEPTION/WAITING AREA |
| 6 | FACILITY- SCREENING ROOM |
| 7 | FACILITY- CONSULTATION/TREATMENT ROOM |
| 8 | FACILITY-PROCEDURE ROOM |
| 9 | SLUICE ROOM |
| 10 | BLEEDING ROOM |
| 11 | TOILET FACILITIES |
| 12 | PHARMACY/DISPENSARY |
| 13 | SAFETY AND WASTE MANAGEMENT |
| 14 | SUPPLIES |
| 15 | TENS |
| 16 | HIV SCREENING |

---

## Current CSV Sections (from generation_report.json)

Generated from `checklist for facilities2.0.csv` on 2025-12-17:

| # | CSV Section Name |
|:-:|:-----------------|
| 1 | ORGANISATION AND MANAGEMENT |
| 2 | SERVICES PROVIDED |
| 3 | PERSONNEL |
| 4 | FACILITY-ENVIRONMENT |
| 5 | FACILITY-RECEPTION/WAITING AREA |
| 6 | FACILITY-SCREENING ROOM |
| 7 | FACILITY-CONSULTATION/ TREATMENT ROOM |
| 8 | FACILITY-PROCEDURE ROOM |
| 9 | SLUICE ROOM |
| 10 | BLEEDING ROOM |
| 11 | TOILET FACILITIES |
| 12 | PHARMACY/DISPENSARY |
| 13 | SAFETY AND WASTE MANAGEMENT |
| 14 | SUPPLIES |
| 15 | CUSTOMER SATISFACTION |
| 16 | SPECIMEN RECEPTION ROOM |
| 17 | LABORATORY TESTING AREAS CHEMISTRY |
| 18 | LABORATORY TESTING AREAS HAEMATOLOGY |
| 19 | MICROBIOLOGY |
| 20 | HIV SCREENING |

---

## 🔍 MAPPING ANALYSIS

### ✅ EXACT MATCHES (Will work correctly)

| CSV Section | DHIS2 Section | Status |
|:------------|:--------------|:------:|
| ORGANISATION AND MANAGEMENT | ORGANISATION AND MANAGEMENT | ✅ EXACT |
| SERVICES PROVIDED | SERVICES PROVIDED | ✅ EXACT |
| PERSONNEL | PERSONNEL | ✅ EXACT |
| FACILITY-PROCEDURE ROOM | FACILITY-PROCEDURE ROOM | ✅ EXACT |
| SLUICE ROOM | SLUICE ROOM | ✅ EXACT |
| BLEEDING ROOM | BLEEDING ROOM | ✅ EXACT |
| TOILET FACILITIES | TOILET FACILITIES | ✅ EXACT |
| PHARMACY/DISPENSARY | PHARMACY/DISPENSARY | ✅ EXACT |
| SAFETY AND WASTE MANAGEMENT | SAFETY AND WASTE MANAGEMENT | ✅ EXACT |
| SUPPLIES | SUPPLIES | ✅ EXACT |
| HIV SCREENING | HIV SCREENING | ✅ EXACT |
| FACILITY-RECEPTION/WAITING AREA | FACILITY-RECEPTION/WAITING AREA | ✅ EXACT |

---

### ⚠️ POTENTIAL MISMATCHES (May need verification)

| CSV Section | DHIS2 Section | Issue |
|:------------|:--------------|:------|
| FACILITY-**ENVIRONMENT** | FACILITY-**ENVIONMENT** | Typo in DHIS2 (missing 'R') |
| FACILITY-**SCREENING ROOM** | FACILITY**- SCREENING ROOM** | Extra space after dash in DHIS2 |
| FACILITY-**CONSULTATION/ TREATMENT ROOM** | FACILITY**- CONSULTATION/TREATMENT ROOM** | Extra space + spacing difference after / |

---

### ❌ NEW IN CSV (May need to be added to DHIS2)

| # | CSV Section | Notes |
|:-:|:------------|:------|
| 1 | **CUSTOMER SATISFACTION** | New section, replaces TENS? |
| 2 | **SPECIMEN RECEPTION ROOM** | Laboratory-specific |
| 3 | **LABORATORY TESTING AREAS CHEMISTRY** | Laboratory-specific |
| 4 | **LABORATORY TESTING AREAS HAEMATOLOGY** | Laboratory-specific |
| 5 | **MICROBIOLOGY** | Laboratory-specific |

---

### ❌ IN DHIS2 BUT NOT IN CSV

| # | DHIS2 Section | Notes |
|:-:|:--------------|:------|
| 1 | **TENS** | Removed from CSV, replaced by CUSTOMER SATISFACTION? |

---

## 🛠️ RECOMMENDED ACTIONS

### Option 1: Update DHIS2 to Match CSV (Recommended)

Update the following DHIS2 programStageSection names to match the CSV exactly:

1. **Rename in DHIS2:**
   - `FACILITY-ENVIONMENT` → `FACILITY-ENVIRONMENT` (fix typo)
   - `FACILITY- SCREENING ROOM` → `FACILITY-SCREENING ROOM` (remove extra space)
   - `FACILITY- CONSULTATION/TREATMENT ROOM` → `FACILITY-CONSULTATION/ TREATMENT ROOM` (adjust spacing)

2. **Add new sections to DHIS2:**
   - `CUSTOMER SATISFACTION`
   - `SPECIMEN RECEPTION ROOM`
   - `LABORATORY TESTING AREAS CHEMISTRY`
   - `LABORATORY TESTING AREAS HAEMATOLOGY`
   - `MICROBIOLOGY`

3. **Consider removing from DHIS2:**
   - `TENS` (if no longer needed)

---

### Option 2: Update CSV to Match DHIS2

Update the CSV file to match existing DHIS2 section names exactly:

1. `FACILITY-ENVIRONMENT` → `FACILITY-ENVIONMENT`
2. `FACILITY-SCREENING ROOM` → `FACILITY- SCREENING ROOM`
3. `FACILITY-CONSULTATION/ TREATMENT ROOM` → `FACILITY- CONSULTATION/TREATMENT ROOM`

**Then regenerate filters:**
```bash
python src/config/generateFilters.py
```

---

## How to Verify Current DHIS2 Sections

### Method 1: Browser Console

1. Open the app in browser (http://localhost:3000)
2. Log in with your credentials
3. Open browser console (F12 → Console)
4. Run the comparison script:
   ```javascript
   // Copy content from compare_dhis2_sections.js and paste here
   ```

### Method 2: Direct API Call

```bash
curl -u username:password "https://qimsdev.5am.co.bw/qims/api/programStages/Eupjm3J0dt2?fields=programStageSections[id,displayName,sortOrder]"
```

### Method 3: DHIS2 Maintenance App

1. Log in to DHIS2 at https://qimsdev.5am.co.bw/qims
2. Go to Maintenance → Programs
3. Open the Inspections program
4. Click on the program stage (Eupjm3J0dt2)
5. View "Program Stage Sections"

---

## Summary

| Category | Count |
|:---------|:-----:|
| Total CSV Sections | 20 |
| Known DHIS2 Sections | 16 |
| Exact Matches | 12 |
| Potential Mismatches | 3 |
| New in CSV | 5 |
| In DHIS2 only | 1 |

**Action Required:** Verify the actual DHIS2 sections and update either DHIS2 or CSV to ensure exact name matching.

---

*This document was generated based on available configuration files. For accurate results, please run the live comparison script.*
