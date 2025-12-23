# Form Templates Directory

This directory stores HTML form templates that can be loaded by FusionForms.

## Purpose

When external applications (like GraphCycle) need to open a form in FusionForms, they can:
1. Construct the form filename (e.g., `FusionDocument_CRE.html`)
2. Open FusionForms with the form parameter: `?form=forms/FusionDocument_CRE.html`

## Naming Convention

Forms should follow this pattern:
```
{ClassName}_{ActionCode}.html
```

Examples:
- `FusionDocument_CRE.html` - Creation form for FusionDocument class
- `FusionDocument_AMD.html` - Amendment form for FusionDocument class
- `VendorDocument_CRE.html` - Creation form for VendorDocument class

## Integration Example

```javascript
// In GraphCycle application
const lifecycleClassName = 'FusionDocument';
const dialogType = 'CRE';
const formFilename = `${lifecycleClassName}_${dialogType}.html`;

// Open in FusionForms
const fusionFormsUrl = `http://dev-codex.idoxgroup.local/fusionforms?form=forms/${formFilename}`;
window.open(fusionFormsUrl, '_blank');
```

## Directory Structure

```
public/forms/
├── README.md (this file)
├── FusionDocument_CRE.html
├── FusionDocument_AMD.html
├── FusionDocument_DF.html
├── VendorDocument_CRE.html
└── ... (other form templates)
```

## Note

- Forms in this directory are publicly accessible
- Forms should be valid HTML with proper structure
- FusionForms will parse the HTML and create an editable schema
