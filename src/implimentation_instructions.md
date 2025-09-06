### Pre‑Inspection Form UI Brief (for AI Agent)

— Goal: Replicate the pre‑inspection form’s look and feel (stepper, elevated cards, selectable service tiles, sectioned review, clean inputs/buttons) in another app without framework dependencies.

— Deliverables: 1) A CSS file to define the look, 2) Markup pattern to wrap any form step or review page, 3) Acceptance criteria to verify parity.

---

## 1) Create CSS file: preinspection-look.css

Copy this exactly:

```css
:root {
    --pi-primary: #1976d2;
    --pi-primary-strong: #0d47a1;
    --pi-primary-light: #42a5f5;
    --pi-bg: #ffffff;
    --pi-surface: #ffffff;
    --pi-muted: #6b7280;
    --pi-border: #e5e7eb;
    --pi-shadow: 0 4px 20px rgba(0,0,0,0.1);
    --pi-radius: 12px;
    --pi-space-1: 8px;
    --pi-space-2: 12px;
    --pi-space-3: 16px;
    --pi-space-4: 24px;
    --pi-space-5: 32px;
}

/* Page */
.pi-page {
    background: var(--pi-bg);
    min-height: 100vh;
}

/* Header */
.pi-header {
    padding: var(--pi-space-4) var(--pi-space-3) 0;
}
.pi-title-lg { margin: 0 0 var(--pi-space-1); font-size: 1.75rem; font-weight: 700; }
.pi-title-sm { margin: 0; color: var(--pi-muted); }

/* Stepper container (horizontal, scrollable on small screens) */
.pi-stepper {
    overflow-x: auto;
    padding: 0 0 var(--pi-space-2);
    margin: 0 0 var(--pi-space-3);
}
.pi-stepper::-webkit-scrollbar { height: 6px; }
.pi-stepper::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 3px; }

.pi-steps {
    display: flex;
    gap: var(--pi-space-3);
    align-items: center;
    min-width: max-content;
}
.pi-step {
    display: inline-flex;
    align-items: center;
    gap: var(--pi-space-1);
}
.pi-step-dot {
    width: 32px; height: 32px; border-radius: 50%;
    display: grid; place-items: center;
    background: #e0e0e0; color: #555;
    font-weight: 700;
}
.pi-step.active .pi-step-dot { background: #2e7d32; color: #fff; }
.pi-step-label { font-weight: 600; color: #333; }

/* Main content card per step (StepCard equivalent) */
.pi-card {
    background: var(--pi-surface);
    border-radius: calc(var(--pi-radius) + 4px);
    box-shadow: var(--pi-shadow);
    padding: var(--pi-space-5);
    margin-top: var(--pi-space-4);
}

/* Services selection tiles (ServiceCard equivalent) */
.pi-service-grid {
    display: grid;
    gap: var(--pi-space-3);
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}
.pi-service-card {
    border: 2px solid var(--pi-border);
    border-radius: calc(var(--pi-radius) + 4px);
    background: var(--pi-surface);
    padding: var(--pi-space-4);
    height: 100%;
    transition: all .2s ease;
    cursor: pointer;
    position: relative;
}
.pi-service-card:hover {
    border-color: var(--pi-primary);
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.pi-service-card.selected {
    border-color: var(--pi-primary-light);
    background: #e3f2fd;
}

/* Section + questions (Review view style) */
.pi-section {
    margin: var(--pi-space-4) 0 var(--pi-space-3);
}
.pi-section-title {
    font-size: 1.1rem;
    font-weight: 700;
    padding-bottom: var(--pi-space-2);
    border-bottom: 1px solid var(--pi-border);
    margin-bottom: var(--pi-space-2);
}
.pi-question-card {
    background: var(--pi-surface);
    border-radius: var(--pi-radius);
    padding: var(--pi-space-4);
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    margin-bottom: var(--pi-space-3);
}
.pi-question-head {
    font-weight: 600;
    padding-bottom: var(--pi-space-2);
    border-bottom: 1px solid var(--pi-border);
    margin-bottom: var(--pi-space-2);
}
.pi-answer { color: #111; }

/* Inputs + helpers */
.pi-field {
    display: block; width: 100%;
    padding: 12px 14px;
    border: 1px solid #d0d7de; border-radius: 8px;
    background: #fff; font-size: .95rem; outline: none;
    transition: border-color .15s ease, box-shadow .15s ease;
    box-sizing: border-box;
    margin-bottom: var(--pi-space-2);
}
.pi-field:focus { border-color: var(--pi-primary); box-shadow: 0 0 0 3px rgba(25,118,210,.15); }
.pi-helper { font-size: .8rem; color: #dc3545; margin: 4px 0 var(--pi-space-2); }

/* Actions row */
.pi-actions {
    display: flex; justify-content: space-between; gap: var(--pi-space-2);
    margin-top: var(--pi-space-4);
}
.pi-btn {
    display: inline-flex; align-items: center; justify-content: center;
    height: 44px; padding: 0 16px; border-radius: 8px; border: 0;
    cursor: pointer; font-weight: 600; transition: filter .15s ease, opacity .15s ease;
}
.pi-btn-primary { background: var(--pi-primary); color: #fff; }
.pi-btn-primary:hover { filter: brightness(.95); }
.pi-btn-outline { background: #fff; color: #374151; border: 1px solid #d0d7de; }
.pi-btn-outline:hover { background: #f8fafc; }

/* Utility */
.pi-muted { color: var(--pi-muted); }
@media (max-width: 768px) {
    .pi-card { padding: var(--pi-space-4); }
}
```

---

## 2) Use this generic markup structure (wizard + sections)

Embed this where you want the pre‑inspection UI to appear:

```html
<link rel="stylesheet" href="/path/to/preinspection-look.css" />

<div class="pi-page">
  <div class="pi-header">
    <h1 class="pi-title-sm">Pre-Inspection Form</h1>
    <h2 class="pi-title-lg">Facility Name</h2>
    <p class="pi-muted">Collaborating to speed the inspection process</p>
  </div>

  <div class="pi-stepper">
    <div class="pi-steps">
      <div class="pi-step active">
        <div class="pi-step-dot">1</div>
        <div class="pi-step-label">Introduction</div>
      </div>
      <div class="pi-step">
        <div class="pi-step-dot">2</div>
        <div class="pi-step-label">Payment</div>
      </div>
      <div class="pi-step">
        <div class="pi-step-dot">3</div>
        <div class="pi-step-label">Statutory</div>
      </div>
      <div class="pi-step">
        <div class="pi-step-dot">4</div>
        <div class="pi-step-label">Pre‑Inspection</div>
      </div>
      <div class="pi-step">
        <div class="pi-step-dot">5</div>
        <div class="pi-step-label">Summary</div>
      </div>
      <div class="pi-step">
        <div class="pi-step-dot">6</div>
        <div class="pi-step-label">Confirm</div>
      </div>
    </div>
  </div>

  <div class="pi-card">
    <!-- Services selection grid (optional) -->
    <div class="pi-service-grid">
      <div class="pi-service-card selected">
        <div class="pi-question-head">Core Medical Services</div>
        <p class="pi-muted">Description or quick notes.</p>
      </div>
      <div class="pi-service-card">
        <div class="pi-question-head">Support Services</div>
        <p class="pi-muted">Description or quick notes.</p>
      </div>
    </div>

    <!-- Example fields -->
    <input class="pi-field" type="text" placeholder="Inspection Source" />
    <div class="pi-helper" style="display:none;">Error text</div>

    <div class="pi-actions">
      <button class="pi-btn pi-btn-outline">Back</button>
      <button class="pi-btn pi-btn-primary">Next</button>
    </div>
  </div>

  <!-- Sectioned review (questions/answers) -->
  <div class="pi-section">
    <div class="pi-section-title">General Information</div>

    <div class="pi-question-card">
      <div class="pi-question-head">Facility Address</div>
      <div class="pi-answer">123 Main St, Gaborone</div>
    </div>

    <div class="pi-question-card">
      <div class="pi-question-head">Services Offered</div>
      <div class="pi-answer">Core, Support</div>
    </div>
  </div>
</div>
```

---

## 3) Visual and behavioral keys to match

- Stepper above the main card, horizontally scrollable on small screens; active step uses a filled green dot and bold label.
- Each step’s content sits inside a soft, elevated card with 32px padding, 12px radius, and shadow `0 4px 20px rgba(0,0,0,0.1)`.
- Service tiles are selectable: default light border; on hover, blue border and subtle shadow; when selected, pale blue background `#e3f2fd` with a stronger blue border.
- Section titles use a bottom border; each question lives in a small elevated card with its own title rule and answer block.
- Inputs mimic an outlined style with a blue focus ring; helper text below fields is red for errors.
- Use a primary blue button for the main action and an outline style for secondary actions.

---

## 4) Acceptance criteria

- Centered content with a scrollable horizontal stepper on mobile.
- Elevated step card with spacing that matches the described paddings and radius.
- Service selection grid behaves with hover and selected states as specified.
- Sectioned review rendering with question cards and clear answer text.
- Blue focus ring inputs and distinct error helper styling.
- Primary/secondary button contrast and responsive layout preserved.

---

## 5) Original component styling intent (reference)

These fragments summarize the source component’s styling approach:

```116:179:src/components/Facility/PreInspection/index.jsx
const StepCard = styled(Card)(({ theme }) => ({
    marginTop: theme.spacing(3),
    padding: theme.spacing(4),
    borderRadius: theme.shape.borderRadius * 2,
    boxShadow: theme.shadows[3],
    background: theme.palette.background.paper,
    overflow: 'visible'
}));

const StepperContainer = styled(Box)(({ theme }) => ({
    overflowX: 'auto',
    paddingBottom: theme.spacing(1),
    marginBottom: theme.spacing(3),
    '&::-webkit-scrollbar': { height: 6 },
    '&::-webkit-scrollbar-thumb': { backgroundColor: theme.palette.action.disabledBackground, borderRadius: 3 }
}));

const ServiceCard = styled(Card)(({ theme, selected }) => ({
    cursor: 'pointer',
    border: '2px solid',
    borderColor: selected ? '#42a5f5' : theme.palette.grey[200],
    borderRadius: theme.shape.borderRadius * 2,
    transition: 'all 0.2s ease',
    height: '100%',
    position: 'relative',
    backgroundColor: selected ? '#e3f2fd' : theme.palette.background.paper,
    '&:hover': { borderColor: selected ? '#0d47a1' : theme.palette.primary.light, boxShadow: theme.shadows[2] }
}));
```

Instruction: Implement the CSS and markup above. Verify the page against the acceptance criteria and adjust spacing or colors minimally to match the specified tokens.


