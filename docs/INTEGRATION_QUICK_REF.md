# Quick Reference: FusionForms External Integration

## URL Patterns

```bash
# Load from URL
http://dev-codex.idoxgroup.local/fusionforms?formUrl=<url>

# Load from local path
http://dev-codex.idoxgroup.local/fusionforms?form=<path>

# Load from base64 data
http://dev-codex.idoxgroup.local/fusionforms?formData=<base64>

# Load from localStorage
http://dev-codex.idoxgroup.local/fusionforms?import=local
```

## JavaScript Integration (GraphCycle)

### Method 1: localStorage (Recommended for large forms)

```javascript
const schema = { /* your form schema */ };
localStorage.setItem('fusionforms_import', JSON.stringify(schema));
window.open('http://dev-codex.idoxgroup.local/fusionforms?import=local');

// Cleanup after 10 seconds
setTimeout(() => localStorage.removeItem('fusionforms_import'), 10000);
```

### Method 2: URL Parameter (For remote files)

```javascript
const formUrl = 'http://server/api/forms/123';
window.open(`http://dev-codex.idoxgroup.local/fusionforms?formUrl=${encodeURIComponent(formUrl)}`);
```

### Method 3: Base64 (For small forms)

```javascript
const schema = { /* small form schema */ };
const base64 = btoa(JSON.stringify(schema));
window.open(`http://dev-codex.idoxgroup.local/fusionforms?formData=${encodeURIComponent(base64)}`);
```

## Form Schema Structure (Minimal)

```json
{
  "id": "unique_id",
  "name": "Form Name",
  "formClass": "FusionDocument",
  "actionCode": "CRE",
  "version": 1,
  "sections": []
}
```

## Testing

Visit `/integration-test.html` on the FusionForms server:
```
http://dev-codex.idoxgroup.local/fusionforms/integration-test.html
```

## Error Handling

FusionForms will:
- Show yellow alert if form fails to load
- Fall back to empty default form
- Log errors to browser console
- Continue functioning normally

## File Locations

- Integration API Docs: `INTEGRATION_API.md`
- Form Loader Utility: `src/utils/formLoader.ts`
- GraphCycle Example: `docs/GRAPHCYCLE_INTEGRATION.ts`
- Test Page: `public/integration-test.html`
