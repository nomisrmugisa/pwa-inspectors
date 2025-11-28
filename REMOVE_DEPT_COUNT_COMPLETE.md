# Removed Department Count Display

## ✅ Status: COMPLETED

The department count text (e.g., "5/6 departments") has been removed from the Facility Service Departments section in `FormPage.jsx`.

## 📝 Changes

- Removed the conditional rendering block that displayed `{departmentStats.available}/{departmentStats.total} departments`.
- The "Specialization: [Name]" text remains, as requested (only the count was circled for removal).

## 🔍 Verification

The code block:
```javascript
{departmentStats && (
  <span style={{ ... }}>
    {departmentStats.available}/{departmentStats.total} departments
  </span>
)}
```
...has been completely removed.
