# GraphCycle Forms Integration Guide

## Overview

This document explains how GraphCycle integrates with FusionForms to open and edit form templates.

## Integration Flow

### 1. GraphCycle Side

When a user wants to edit a form in GraphCycle:

```typescript
// GraphCycle constructs the form filename
const lifecycleClassName = 'FusionDocument'; // or 'VendorDocument', etc.
const dialogType = 'CRE'; // CRE, AMD, DF, etc.
const formFilename = `${lifecycleClassName}_${dialogType}.html`;

// Open FusionForms with the form parameter
const fusionFormsUrl = `http://dev-codex.idoxgroup.local/fusionforms?form=forms/${formFilename}`;
window.open(fusionFormsUrl, '_blank');
```

### 2. FusionForms Side

FusionForms will:
1. Parse the URL parameter `?form=forms/FusionDocument_CRE.html`
2. Load the file from `public/forms/FusionDocument_CRE.html`
3. Parse the HTML into an editable schema
4. Display the form in the builder

## Form Storage Location

**All form templates must be stored in:**
```
public/forms/
```

This directory is:
- ✅ Publicly accessible via HTTP
- ✅ Version controlled with the FusionForms app
- ✅ Easy to deploy and maintain

## File Naming Convention

Forms **must** follow this exact pattern:
```
{ClassName}_{ActionCode}.html
```

### Examples:

| Class | Action Code | Filename |
|-------|-------------|----------|
| FusionDocument | CRE | `FusionDocument_CRE.html` |
| FusionDocument | AMD | `FusionDocument_AMD.html` |
| FusionDocument | DF | `FusionDocument_DF.html` |
| VendorDocument | CRE | `VendorDocument_CRE.html` |
| VendorDocument | QRY | `VendorDocument_QRY.html` |

## Complete Integration Example

### GraphCycle Code

```typescript
// File: graphcycle/src/services/FormEditorService.ts

interface FormEditorConfig {
  fusionFormsBaseUrl: string;
  formsPath: string;
}

class FormEditorService {
  private config: FormEditorConfig = {
    fusionFormsBaseUrl: 'http://dev-codex.idoxgroup.local/fusionforms',
    formsPath: 'forms'
  };

  /**
   * Open a form in FusionForms editor
   */
  openFormEditor(lifecycleClassName: string, dialogType: string): void {
    const formFilename = `${lifecycleClassName}_${dialogType}.html`;
    const formPath = `${this.config.formsPath}/${formFilename}`;
    const url = `${this.config.fusionFormsBaseUrl}?form=${encodeURIComponent(formPath)}`;
    
    window.open(url, '_blank', 'width=1400,height=900');
  }

  /**
   * Example: Open creation form for FusionDocument
   */
  openFusionDocumentCreationForm(): void {
    this.openFormEditor('FusionDocument', 'CRE');
  }

  /**
   * Example: Open amendment form for VendorDocument
   */
  openVendorDocumentAmendmentForm(): void {
    this.openFormEditor('VendorDocument', 'AMD');
  }
}

export const formEditorService = new FormEditorService();
```

### Usage in GraphCycle UI

```typescript
// Example: Add edit button to GraphCycle dialog
function addEditFormButton(className: string, actionCode: string) {
  const button = document.createElement('button');
  button.textContent = '✏️ Edit Form';
  button.className = 'btn btn-primary';
  button.onclick = () => {
    formEditorService.openFormEditor(className, actionCode);
  };
  
  document.getElementById('toolbar').appendChild(button);
}

// Usage
addEditFormButton('FusionDocument', 'CRE');
```

## Deployment Workflow

### 1. Adding New Forms

To add a new form template:

```bash
# Navigate to FusionForms project
cd /home/IDOXGROUP.LOCAL/chris.brighouse/envs/fusionforms

# Create the form file
cat > public/forms/FusionDocument_CRE.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>FusionDocument Creation Form</title>
</head>
<body>
  <form>
    <!-- Your form HTML here -->
  </form>
</body>
</html>
EOF

# Deploy to production
./deploy.sh
```

### 2. Form Verification

After creating a form, verify it loads correctly:

```bash
# Development
http://dev-codex.idoxgroup.local:5174/fusionforms?form=forms/FusionDocument_CRE.html

# Production
https://dev-codex.idoxgroup.local:8444?form=forms/FusionDocument_CRE.html
```

## Error Handling

### Form Not Found

If GraphCycle tries to open a form that doesn't exist:

```typescript
// FusionForms will display an error alert:
// "Failed to fetch form: 404 Not Found"
```

**Solution:** Ensure the form file exists in `public/forms/` with the correct filename.

### Invalid HTML

If the form HTML is malformed:

```typescript
// FusionForms will attempt to parse it anyway
// but may produce unexpected results
```

**Solution:** Validate HTML structure before deploying forms.

## Best Practices

### 1. Form Template Management

✅ **DO:**
- Store all form templates in `public/forms/`
- Use consistent naming: `{ClassName}_{ActionCode}.html`
- Version control form templates with FusionForms
- Test forms after deployment

❌ **DON'T:**
- Store forms in random locations
- Use inconsistent naming conventions
- Forget to deploy after creating new forms

### 2. Integration Code

✅ **DO:**
- Centralize form opening logic in a service class
- Use configuration for FusionForms URL
- Encode URL parameters properly
- Handle window.open failures

❌ **DON'T:**
- Hard-code URLs throughout GraphCycle
- Skip error handling
- Use wrong parameter names

### 3. Form Design

✅ **DO:**
- Include proper form class metadata
- Use semantic HTML structure
- Include field labels and names
- Test in FusionForms before deployment

❌ **DON'T:**
- Use inline styles (prefer CSS)
- Forget accessibility attributes
- Use deprecated HTML elements

## Troubleshooting

### Issue: Form doesn't load

**Check:**
1. File exists: `public/forms/FusionDocument_CRE.html`
2. Filename matches exactly (case-sensitive)
3. URL is correctly formed: `?form=forms/FusionDocument_CRE.html`
4. FusionForms dev server is running

### Issue: Form loads but looks wrong

**Check:**
1. HTML structure is valid
2. Form has proper `<form>` wrapper
3. Fields have `name` attributes
4. Class name matches EDMS class

### Issue: Can't save changes

**Note:** FusionForms currently exports edited forms as HTML files. GraphCycle would need to implement a callback or listener to receive the updated form data.

## Future Enhancements

Potential improvements to the integration:

1. **Callback Support**: Allow GraphCycle to receive updated form HTML
2. **Direct Save**: FusionForms could POST changes back to GraphCycle
3. **Form Validation**: Pre-validate forms before loading
4. **Template Library**: Shared form template repository

## Summary

**GraphCycle Integration Checklist:**

- [ ] Store form templates in `public/forms/`
- [ ] Use naming convention: `{ClassName}_{ActionCode}.html`
- [ ] Construct URL: `?form=forms/{filename}`
- [ ] Open FusionForms in new window
- [ ] Handle errors gracefully
- [ ] Test integration flow
- [ ] Document custom forms

**Example URL:**
```
http://dev-codex.idoxgroup.local/fusionforms?form=forms/FusionDocument_CRE.html
```
