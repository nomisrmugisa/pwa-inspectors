# Explanation: Why "Customer Satisfaction" was visible but not selectable

## 🔍 The Root Cause

You asked: *"if it was set to true why was CUSTOMER SATISFACTION not part of the checkable items?"*

The answer lies in two separate configuration files that work together:

1.  **The Checkbox List (`facilityServiceDepartments.js`):**
    *   This file defines **only** the optional departments that can be toggled.
    *   It lists: `HIV SCREENING`, `ORGANISATION AND MANAGEMENT`, `PERSONNEL`, `SERVICES PROVIDED`, `SUPPLIES`, `TENS`.
    *   **It does NOT list "CUSTOMER SATISFACTION".**
    *   *Result:* You never saw a checkbox for it.

2.  **The Visibility Rules (`sectionVisibilityConfig.js`):**
    *   This file defines the **default visibility** for every section.
    *   It had `'CUSTOMER SATISFACTION': true` for every facility type.
    *   *Result:* The system treated it like a "Core" section (like "Inspection Type") that must always be shown, regardless of your selections.

## 🛠️ The Fix

By changing the visibility rule to `'CUSTOMER SATISFACTION': false`, I have aligned the behavior with your expectation:

*   It is **not** a core section anymore (hidden by default).
*   It is **not** in the checkbox list (so it won't be turned on by selection).
*   **Outcome:** It will completely disappear, ensuring that **only what you select** (e.g., TENS, Supplies) appears in the progress bar.

## 📝 Future Note
If you ever *do* want "Customer Satisfaction" to be an option you can select, we would need to add it to the `ALL_FACILITY_DEPARTMENTS` list in `src/config/facilityServiceDepartments.js`.
