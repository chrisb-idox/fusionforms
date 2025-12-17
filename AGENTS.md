## FusionForms Form Builder MVP - Progress Notes

Context for future sessions about the FusionForms Form Builder MVP (renamed from webforms) built with React, Vite, Mantine, dnd-kit, and react-hook-form.

### Current state
- Project scaffolded via Vite React TS. Mantine provider added globally (`src/main.tsx`), and base styling adjusted (`src/index.css`, `src/App.css`).
- Schema types in `src/types/formSchema.ts` with helper `createId`; now store table layout metadata, HTML attributes, original ids/names, nested tables, static cell HTML, and class bindings (`bindingClass`).
- Central state via `FormBuilderProvider` (`src/context/FormBuilderContext.tsx`) using a reducer: schema state, selection state, add/update/remove helpers, reorder rows/fields, plus helpers to add table sections and nested tables. Nested tables/columns now get recursive updates for add/remove/reorder so imported samples remain editable.
- Main page `src/pages/FormBuilderPage.tsx` wires Mantine `AppShell`, preview modal (90% width, reset default values on schema change), and initial schema. Accepts imported schemas from samples.
- Builder UI components in `src/components/builder/`:
  - `BuilderHeader`: form name, action code selector, Samples link, Save to localStorage, Preview, and Export HTML (pretty-printed, keeps bindings/attrs) buttons.
  - `BuilderBody`: palette left, properties right, canvas center with sticky side panels.
  - `PalettePanel`: add fields (draggable), rows, sections, and table sections; palette items draggable into columns.
  - `CanvasPanel`: renders table and stack sections; click to select; dnd-kit reorder rows/fields; add/remove actions; droppable columns accept palette items; nested tables supported with sortable/droppable table cells; static cell HTML preserved. Shows class name in blue brackets `[ClassName]` when field has class binding.
  - `PropertiesPanel`: edits form/section/field properties with EDMS binding support; **NEW: Class/Property selector with visual property browser** - select class (FusionDocument/VendorDocument), view all available properties in scrollable list, click to bind. Field lookup works inside nested tables for imported samples.
- Form renderer (`src/components/renderer/FormRenderer.tsx`) mirrors table layouts and nested tables; shows bindings inside fields; uses react-hook-form; used in preview modal. Sample viewer can load samples into the builder via HTML parsing.
  - **Renderer Improvements**: Respects original HTML attributes (e.g., `cols` for textarea width). Maps HTML `size` attribute to CSS `width` (using `ch` units) to ensure correct field width without affecting font size.
- **Export Fidelity**: Exported HTML now preserves content outside tables (e.g., hidden divs), suppresses duplicate labels for imported fields, and filters duplicate attributes.
- **UI/UX**: Added application logo to the header (resizable).
- **Build Optimization**: Configured `manualChunks` in `vite.config.ts` to split vendor libraries, resolving large chunk warnings.
- **Class Selector**: New feature similar to GraphCycle - `data/propertiesLibrary.xml` defines classes and properties, `src/utils/propertiesLibrary.ts` parses XML, PropertiesPanel shows cascading class/property selectors with visual property browser (41 properties each for FusionDocument and VendorDocument classes). See `docs/CLASS_SELECTOR.md` for details.

### Outstanding / risks
- Node version warning: current Node 18.19.1 while Vite 7 expects >=20.19. Upgrade Node to avoid engine warnings.
- Palette drag-to-canvas implemented but could be expanded (e.g., drop position within column).
- No persistence beyond optional localStorage save (manual); save filename uses action code suffix; HTML export available but not auto-saved.
- Validation rules beyond basic wiring not exposed in UI.

### How to run
- **Development**: Install deps (already installed). Start dev server: `npm run dev`.
- **Production (VM)**: Deployed on Ubuntu VM, accessible at:
  - HTTPS: https://dev-codex.idoxgroup.local:8444
  - HTTP: http://dev-codex.idoxgroup.local:8081 (redirects to HTTPS)
- **Deployment**: Use `./deploy.sh` to build and deploy updates. See [DEPLOYMENT.md](DEPLOYMENT.md) for details.
- Build works (`npm run build`) but emits Node version warning noted above.
