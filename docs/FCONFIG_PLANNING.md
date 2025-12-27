
# FConfig Complete Planning Session - 26 December 2025

**IMPORTANT: Move this file to ~/envs/fconfig/ when you start that project**

---

## Quick Reference

**Project Goal:** Merge GraphCycle + FusionForms into unified "FConfig" application

**Key Decisions:**
1. State Management: Zustand (with Immer)
2. Tech Stack: React 19 + Vite 7 + TypeScript + Mantine
3. Deployment: Parallel with existing apps
4. Timeline: 7-8 weeks

**Next Action:** Open GraphCycle and complete analysis checklist below

---

## SECTION 1: PROJECT OVERVIEW

### Project Status
- **Created:** 26 December 2025
- **Status:** Planning & Analysis Phase
- **Goal:** Merge GraphCycle (lifecycle) and FusionForms (forms) into unified app

### Architecture Goals
- Dual-view navigation (Lifecycle/Forms toggle buttons)
- Unified header (app name, class badge, action code, toggles, settings)
- Combined Settings screen
- Shared state across views
- State persistence when switching views

### Resources
- FusionForms: ~/envs/fusionforms (analyzed ✓)
- GraphCycle: ~/envs/graphcycle (needs analysis)
- FConfig: ~/envs/fconfig (new project)
- Target: http://dev-codex.idoxgroup.local/fconfig/

---

## SECTION 2: GRAPHCYCLE ANALYSIS CHECKLIST

**Status:** ⚠️ INCOMPLETE - Complete this first!

### Instructions
1. Open: `code ~/envs/graphcycle`
2. Fill in the blanks below
3. Update timeline based on findings

### Checklist

#### Package.json
- [ ] React version: _______________
- [ ] TypeScript: Yes/No _______________
- [ ] Build tool: _______________
- [ ] UI Library: _______________
- [ ] State management: _______________

#### State Management
- [ ] Pattern: Redux/Context/Other _______________
- [ ] Store location: _______________
- [ ] Number of slices: _______________

#### Routing
- [ ] Library: _______________
- [ ] Routes count: _______________
- [ ] Base path: _______________

#### Settings Screen
- [ ] File path: _______________
- [ ] Sections: _______________

#### Components
- [ ] Total count: _______________
- [ ] Main pages: _______________
- [ ] Header component: _______________

#### Integration
- [ ] FusionForms launch code: Yes/No
- [ ] Location: _______________

### Compatibility Matrix

| Aspect | FusionForms | GraphCycle | Compatible? |
|--------|-------------|------------|-------------|
| React | 19.2.0 | ___ | ☐ Yes ☐ No |
| TypeScript | ✓ 5.9.3 | ___ | ☐ Yes ☐ No |
| Build | Vite 7.2.4 | ___ | ☐ Yes ☐ No |
| UI Library | Mantine 8.3.9 | ___ | ☐ Yes ☐ No |
| State | Context API | ___ | ☐ Yes ☐ No |

### Migration Complexity
**Overall:** ☐ Easy ☐ Medium ☐ Hard

**Estimate:**
- Dependency upgrades: ___ days
- State migration: ___ days
- Component refactor: ___ days
- Integration: ___ days
- Testing: ___ days
- **TOTAL: ___ weeks**

---

## SECTION 3: IMPLEMENTATION TIMELINE

### Week 1: GraphCycle Analysis
1. Complete analysis checklist above
2. Document all components and routes
3. Assess migration complexity

### Week 2: Initialize FConfig
```bash
cd ~/envs/fconfig
npm create vite@latest . -- --template react-ts
npm install zustand immer
npm install react-router-dom
npm install @mantine/core @mantine/hooks @mantine/form
npm install @tabler/icons-react
```

### Weeks 2-3: Zustand Migration
1. Migrate FusionForms Context → Zustand
2. Migrate GraphCycle state → Zustand
3. Create shared stores

### Weeks 4-5: Integration
1. Unified routing
2. Unified layout with dual-view toggles
3. Combined settings
4. Internal navigation

### Week 6: Testing
### Week 7: Deployment to /fconfig/
### Week 8+: User transition

---

## SECTION 4: ZUSTAND MIGRATION GUIDE

### Why Zustand?
- Less boilerplate than Redux
- Better performance than Context API
- Built-in DevTools
- Easy persistence
- Perfect for medium apps

### Installation
```bash
npm install zustand immer
```

### Store Structure

#### App Store (Shared State)
```typescript
// stores/appStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AppState {
  currentView: 'lifecycle' | 'forms';
  selectedClass: 'FusionDocument' | 'VendorDocument' | null;
  actionCode: string | null;
  settingsOpen: boolean;
  
  switchView: (view: 'lifecycle' | 'forms') => void;
  setSelectedClass: (className: string) => void;
  setActionCode: (code: string | null) => void;
  openSettings: () => void;
  closeSettings: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        currentView: 'lifecycle',
        selectedClass: null,
        actionCode: null,
        settingsOpen: false,
        
        switchView: (view) => set({ currentView: view }),
        setSelectedClass: (className) => set({ selectedClass: className }),
        setActionCode: (code) => set({ actionCode: code }),
        openSettings: () => set({ settingsOpen: true }),
        closeSettings: () => set({ settingsOpen: false }),
      }),
      { name: 'fconfig-app' }
    ),
    { name: 'AppStore' }
  )
);
```

#### Form Builder Store
```typescript
// stores/formBuilderStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface FormBuilderState {
  schema: FormSchema;
  selection: Selection | null;
  
  setSchema: (schema: FormSchema) => void;
  updateField: (id: string, data: Partial<FieldSchema>) => void;
  addSection: () => void;
  // ... 26 actions total
}

export const useFormBuilderStore = create<FormBuilderState>()(
  devtools(
    immer((set) => ({
      schema: createDefaultSchema(),
      selection: null,
      
      setSchema: (schema) => set({ schema }),
      
      updateField: (id, data) => set((state) => {
        const field = findFieldById(state.schema, id);
        if (field) Object.assign(field, data);
      }),
      
      // ... implement other actions
    })),
    { name: 'FormBuilderStore' }
  )
);
```

### Migration Pattern

**Before (Context):**
```typescript
const { schema, updateField } = useFormBuilder();
```

**After (Zustand):**
```typescript
const schema = useFormBuilderStore((state) => state.schema);
const updateField = useFormBuilderStore((state) => state.updateField);
```

---

## SECTION 5: ARCHITECTURE

### Folder Structure
```
fconfig/
├── src/
│   ├── features/
│   │   ├── forms/          # From FusionForms
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── utils/
│   │   └── lifecycle/      # From GraphCycle
│   │       ├── components/
│   │       ├── pages/
│   │       └── utils/
│   ├── shared/
│   │   ├── layout/         # AppShell, Header
│   │   └── settings/       # Unified settings
│   ├── stores/
│   │   ├── appStore.ts
│   │   ├── formBuilderStore.ts
│   │   ├── lifecycleStore.ts
│   │   └── settingsStore.ts
│   └── App.tsx
```

### Routing
```typescript
<BrowserRouter basename="/fconfig">
  <Routes>
    <Route path="/" element={<Navigate to="/lifecycle" />} />
    <Route path="/lifecycle/*" element={<LifecycleRoutes />} />
    <Route path="/forms/*" element={<FormsRoutes />} />
  </Routes>
</BrowserRouter>
```

### Header Layout
```
[Logo] FConfig | [FusionDocument] [CRE] | [📊 Lifecycle] [📝 Forms] ⚙️
```

---

## SECTION 6: FUSIONFORMS ANALYSIS SUMMARY

**Complete analysis available in chat session**

### Tech Stack
- React 19.2.0
- TypeScript 5.9.3
- Vite 7.2.4
- Mantine 8.3.9
- React Router 7.9.6

### State Management
- Pattern: Context API + useReducer
- Location: FormBuilderContext.tsx
- 26 actions for form manipulation

### Components (14 total)
- FormBuilderPage
- BuilderHeader, BuilderBody
- PalettePanel, CanvasPanel, PropertiesPanel
- FormEditor, FormRenderer
- SettingsModal, ActionCodesSettings

### Integration
4 URL parameter methods:
1. `?form=forms/ClassName_ActionCode.html`
2. `?formUrl=<remote-url>`
3. `?formData=<base64>`
4. `?import=local`

---

## SECTION 7: INTEGRATION APPROACH

### Current (GraphCycle → FusionForms)
```typescript
// window.open - separate windows
const url = `/fusionforms?form=forms/FusionDocument_CRE.html`;
window.open(url, '_blank');
```

### Proposed (FConfig Internal)
```typescript
// Internal navigation - same app
const { setFormToLoad, switchView } = useAppStore();
const navigate = useNavigate();

setFormToLoad({ className: 'FusionDocument', actionCode: 'CRE' });
switchView('forms');
navigate('/forms');
```

### Benefits
- No popup windows
- Shared state (class, action code)
- Bidirectional navigation
- Context preservation
- Better UX

---

## SECTION 8: SUCCESS CRITERIA

- [ ] GraphCycle analyzed
- [ ] FConfig project initialized
- [ ] Zustand migration complete
- [ ] Unified interface working
- [ ] All features functional
- [ ] View switching smooth
- [ ] Shared state syncs
- [ ] Performance good
- [ ] No critical bugs
- [ ] Users migrated

---

## SECTION 9: NEXT IMMEDIATE STEPS

1. **Move this file:**
   ```bash
   mv ~/envs/fusionforms/docs/FCONFIG_PLANNING_SESSION.md ~/envs/fconfig/
   ```

2. **Open GraphCycle:**
   ```bash
   code ~/envs/graphcycle
   ```

3. **Complete Section 2 analysis checklist**

4. **Initialize fconfig project (Week 2)**

---

## APPENDIX: Key Files from FusionForms

### FormBuilderContext.tsx Structure
- State: `{ schema: FormSchema, selection: Selection }`
- 26 actions: setSchema, updateForm, addSection, removeField, etc.
- Uses useReducer pattern
- 450 lines of code

### Settings Implementation
- SettingsModal.tsx - Full-screen modal with sidebar
- 3 sections: About, Action Codes, Integration
- localStorage persistence
- Custom event for cross-window sync

### Export/Import
- formLoader.ts - Handles 4 integration methods
- sampleParser.ts - HTML → Schema conversion
- schemaExporter.ts - Schema → HTML export

---

**END OF PLANNING SESSION DOCUMENT**

This file contains everything from the 26 Dec 2025 planning session.
When you return to work on FConfig, start by reading this file.
ENDOFFILE

echo ""
echo "✅ Created: ~/envs/fusionforms/docs/FCONFIG_PLANNING_SESSION.md"
echo ""
echo "This file contains EVERYTHING from today's planning session."
echo "When you start the fconfig project, move it there:"
echo ""
echo "  mv ~/envs/fusionforms/docs/FCONFIG_PLANNING_SESSION.md ~/envs/fconfig/"
echo ""
```

**Just paste this ONE block into your terminal.** It creates a single comprehensive file with everything we discussed. You won't lose any work!**Just paste this ONE block into your terminal.** It creates a single comprehensive file with everything we discussed. You won't lose any work!