## FusionForms Form Builder MVP - Progress Notes

Context for future sessions about the FusionForms Form Builder MVP (renamed from webforms) built with React, Vite, Mantine, dnd-kit, and react-hook-form.

### Versioning
- Version stored in `package.json` (e.g., "0.1.2")
- Displayed in Settings > About screen
- **To increment version before GitHub push:**
  - Patch (0.1.2 → 0.1.3): `npm run version:patch`
  - Minor (0.1.2 → 0.2.0): `npm run version:minor`
  - Major (0.1.2 → 1.0.0): `npm run version:major`
- Version automatically used in Settings modal via `import packageJson from '../../../package.json'`

### Current state
- Project scaffolded via Vite React TS with `base: '/fusionforms/'` in vite.config. Mantine provider added globally (`src/main.tsx`), and base styling adjusted (`src/index.css`, `src/App.css`).
- Schema types in `src/types/formSchema.ts` with helper `createId`; now store table layout metadata, HTML attributes, original ids/names, nested tables, static cell HTML, and **form-level class binding** (`formClass` field). Field-level `bindingClass` removed.
- Central state via `FormBuilderProvider` (`src/context/FormBuilderContext.tsx`) using a reducer: schema state, selection state, add/update/remove helpers, reorder rows/fields, plus helpers to add table sections and nested tables. Nested tables/columns now get recursive updates for add/remove/reorder so imported samples remain editable.
- Main page `src/pages/FormBuilderPage.tsx` wires Mantine `AppShell`, preview modal (90% width, reset default values on schema change), and initial schema with default `formClass: 'FusionDocument'`. **Supports external app integration** via URL parameters (formUrl, form, formData, import) and localStorage bridge. Shows loading spinner during form loading, full-screen error page for missing forms with helpful instructions. Auto-sets action code and form name from filename when loading forms (e.g., `FusionDocument_CRE.html` → action code: CRE, name: "FusionDocument CRE Form"). See `INTEGRATION_API.md` for details.
- Form loading utility (`src/utils/formLoader.ts`) handles multiple integration methods: remote URLs, file paths, base64 data, and localStorage. **Forms Library support**: checks localStorage first for forms saved via Export > Forms Library, then falls back to server files in `public/forms/`. Validates HTML content contains form elements to reject 404 error pages. Detects Vite redirects and index.html responses. Provides user-friendly error messages for missing forms with creation instructions.
- Builder UI components in `src/components/builder/`:
  - `BuilderHeader`: **Read-only form name and class badge with Edit button** opens FormEditor modal; **Action code dropdown with None option** displays codes as "CODE - Label" format sorted alphabetically, dynamically loads from localStorage; **Export HTML menu** with two options: Download (local file) and Forms Library (saves to localStorage for GraphCycle integration); Samples link, Save to localStorage, Preview buttons. Implements binding cleanup when form class changes. Export filename uses action code suffix or just class name if None selected.
  - `FormEditor`: **Full-screen modal** for editing form name and class; displays property table for selected class (41 properties each for FusionDocument/VendorDocument); OK/Cancel buttons.
  - `BuilderBody`: palette left, properties right, canvas center with sticky side panels.
  - `PalettePanel`: add fields (draggable), rows, sections, and table sections; palette items draggable into columns.
  - `CanvasPanel`: renders table and stack sections; click to select; dnd-kit reorder rows/fields; add/remove actions; droppable columns accept palette items; nested tables supported with sortable/droppable table cells; static cell HTML preserved. Removed field-level class badge display.
  - `PropertiesPanel`: edits form/section/field properties with EDMS binding support; **Simplified property binding** - uses form-level class, shows available properties from form's class only, removed legacy EDMS binding section. Property modal shows form's class badge and filtered properties.
- Form renderer (`src/components/renderer/FormRenderer.tsx`) mirrors table layouts and nested tables; shows bindings inside fields; uses react-hook-form; used in preview modal. Sample viewer can load samples into the builder via HTML parsing.
  - **Renderer Improvements**: Respects original HTML attributes (e.g., `cols` for textarea width). Maps HTML `size` attribute to CSS `width` (using `ch` units) to ensure correct field width without affecting font size.
- **Settings Modal** (`src/components/settings/SettingsModal.tsx`): Full-screen modal with sidebar navigation. **About section** shows version and copyright. **Action Codes section** (`ActionCodesSettings.tsx`) allows users to manage action codes (add/remove/edit/reset), with validation (uppercase, no spaces/special chars, max 10 chars, unique), sorted alphabetically. Users can edit label and description without changing code value. Codes stored in localStorage with fallback to defaults from `data/actionCodesLibrary.xml`. Includes built-in "None" option for no filename suffix. Custom event dispatched on changes to update BuilderHeader dropdown in real-time. **Integration section** shows all four external integration methods with tabbed interface, code examples, testing links, and error handling docs.
- **Export Fidelity**: Exported HTML now preserves content outside tables (e.g., hidden divs), suppresses duplicate labels for imported fields, and filters duplicate attributes.
- **UI/UX**: Added application logo to the header (resizable).
- **Build Optimization**: Configured `manualChunks` in `vite.config.ts` to split vendor libraries, resolving large chunk warnings.
- **Class Selector**: Form-level class selection implemented - each form is tied to one class (FusionDocument or VendorDocument). Properties defined in `data/propertiesLibrary.xml`, parsed by `src/utils/propertiesLibrary.ts`. FormEditor component shows cascading form details with property browser (41 properties per class). Default class auto-selected on new forms. Invalid bindings auto-cleaned when class changes.
- **Action Code Management**: Dynamic action code system with customization. Default codes defined in `data/actionCodesLibrary.xml`, loaded via `src/utils/actionCodesLibrary.ts`. Users can add/remove/edit custom codes through Settings > Action Codes. Codes must be uppercase, alphanumeric only, max 10 chars, and unique. Custom codes persisted in localStorage. Built-in "None" option for forms without action code suffix. Action code type changed from enum to string to support custom values. Dropdown displays as "CODE - Label" format for clarity.
- **Forms Library**: localStorage-based form storage system for GraphCycle integration. Users save forms via Export HTML > Forms Library menu option. Forms stored in localStorage under `fusionforms_library` key with metadata (filename, className, actionCode, savedAt, formName). When GraphCycle requests `?form=forms/ClassName_ActionCode.html`, loader checks Forms Library first, then falls back to `public/forms/` directory. Eliminates need for server file deployment during development. One-click save with automatic filename generation based on class and action code.
- **External Integration API**: Four methods to launch FusionForms from external apps (e.g., GraphCycle):
  1. URL parameter: `?formUrl=<url>` - Load from remote URL
  2. File path: `?form=<path>` - Load from local/relative path  
  3. localStorage: `?import=local` - Load from localStorage bridge
  4. Base64 data: `?formData=<base64>` - Embed data in URLs in `docs/INTEGRATION_QUICK_REF.md` and `docs/GRAPHCYCLE_FORMS_QUICK_REF.md`
  - Integration methods documented in Settings > Integration with code examples and testing links
  - **GraphCycle Forms Integration**: GraphCycle constructs filename `{ClassName}_{ActionCode}.html` and opens `?form=forms/FusionDocument_CRE.html`. FusionForms checks Forms Library (localStorage) first, then `public/forms/` directory as fallback. Auto-sets action code dropdown and form name from filename. Shows user-friendly error for missing forms with instructions to save via Forms Library. No server deployment needed during development. See `docs/GRAPHCYCLE_FORMS_INTEGRATION.md` for complete guide. Sample form in `public/forms/FusionDocument_CRE.html`
  - **GraphCycle Forms Integration**: Forms stored in `public/forms/` directory using naming convention `{ClassName}_{ActionCode}.html`. GraphCycle opens forms via `?form=forms/FusionDocument_CRE.html`. See `docs/GRAPHCYCLE_FORMS_INTEGRATION.md` for complete guide.

### Outstanding / risks
- Node version warning: current Node 18.19.1 while Vite 7 expects >=20.19. Upgrade Node to avoid engine warnings.
- Palette drag-to-canvas implemented but could be expanded (e.g., drop position within column).
- No persistence beyond optional localStorage save (manual); save filename uses action code suffix; HTML export available but not auto-saved.
- Validation rules beyond basic wiring not exposed in UI.
- External integration assumes CORS is properly configured for cross-origin form URLs.

### How to run
- **Development**: Install deps (already installed). Start dev server: `npm run dev` (runs on dev-codex.idoxgroup.local:5174 with host: '0.0.0.0' and allowedHosts configured for network access).
- **Production (VM)**: Deployed on Ubuntu VM, accessible at:
  - HTTPS: https://dev-codex.idoxgroup.local:8444
  - HTTP: http://dev-codex.idoxgroup.local:8081 (redirects to HTTPS)
- **Deployment**: Use `./deploy.sh` to build and deploy updates. See [DEPLOYMENT.md](DEPLOYMENT.md) for details.
- **Integration Testing**: Visit `/integration-test.html` to test all external integration methods.
- **Configuration**: Base path set to `/fusionforms/` in both `vite.config.ts` and `BrowserRouter` for correct asset loading.
- Build works (`npm run build`) but emits Node version warning noted above.
