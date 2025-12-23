# GraphCycle Integration - Quick Reference

## Form Storage

**Location:** `public/forms/`

**Naming:** `{ClassName}_{ActionCode}.html`

## Integration Code

```typescript
// GraphCycle opens a form in FusionForms
const className = 'FusionDocument';
const actionCode = 'CRE';
const filename = `${className}_${actionCode}.html`;

const url = `http://dev-codex.idoxgroup.local/fusionforms?form=forms/${filename}`;
window.open(url, '_blank');
```

## Examples

| Form | URL |
|------|-----|
| FusionDocument Creation | `?form=forms/FusionDocument_CRE.html` |
| FusionDocument Amendment | `?form=forms/FusionDocument_AMD.html` |
| VendorDocument Creation | `?form=forms/VendorDocument_CRE.html` |

## Adding New Forms

1. Create HTML file: `public/forms/ClassName_ActionCode.html`
2. Deploy: `./deploy.sh`
3. Test: `http://dev-codex.idoxgroup.local/fusionforms?form=forms/ClassName_ActionCode.html`

## Full Documentation

See: `docs/GRAPHCYCLE_FORMS_INTEGRATION.md`
