# FusionForms Integration API

Guide for integrating FusionForms with external applications (e.g., graphcycle).

## Base URL

```
http://dev-codex.idoxgroup.local/fusionforms
```

## Integration Methods

FusionForms supports multiple methods for loading forms from external applications:

### Method 1: URL Parameter (Recommended)

Load a form from a remote URL or API endpoint.

**URL Format:**
```
http://dev-codex.idoxgroup.local/fusionforms?formUrl=<encoded-url>
```

**Example:**
```javascript
const formFileUrl = 'http://server.local/api/forms/myform.html';
const targetUrl = `http://dev-codex.idoxgroup.local/fusionforms?formUrl=${encodeURIComponent(formFileUrl)}`;
window.open(targetUrl, '_blank');
```

**Supported Formats:**
- JSON schema files (`.json`)
- HTML form files (`.html`, `.xml`)

**Pros:**
- Works with remote files
- No size limitations
- Cross-application compatible

---

### Method 2: File Path Parameter

Load a form from a local path (relative to FusionForms public folder).

**URL Format:**
```
http://dev-codex.idoxgroup.local/fusionforms?form=<path>
```

**Example:**
```javascript
// Load from public/samples folder
window.open('http://dev-codex.idoxgroup.local/fusionforms?form=samples/design.html', '_blank');

// Load from absolute URL
window.open('http://dev-codex.idoxgroup.local/fusionforms?form=/forms/myform.json', '_blank');
```

**Pros:**
- Simple syntax
- Works with local files
- Good for development

---

### Method 3: Inline Base64 Data

Embed form data directly in the URL using base64 encoding.

**URL Format:**
```
http://dev-codex.idoxgroup.local/fusionforms?formData=<base64-encoded-json>
```

**Example:**
```javascript
// From your application (e.g., graphcycle)
const formSchema = {
  id: 'form123',
  name: 'My Form',
  formClass: 'FusionDocument',
  actionCode: 'CRE',
  version: 1,
  sections: [/* ... */]
};

const base64Data = btoa(JSON.stringify(formSchema));
const targetUrl = `http://dev-codex.idoxgroup.local/fusionforms?formData=${encodeURIComponent(base64Data)}`;
window.open(targetUrl, '_blank');
```

**Pros:**
- Self-contained
- No external dependencies
- Works offline

**Cons:**
- URL length limits (~2000 characters)
- Best for smaller forms

---

### Method 4: localStorage Bridge

Use localStorage to pass large forms between same-origin applications.

**URL Format:**
```
http://dev-codex.idoxgroup.local/fusionforms?import=local
```

**Example:**
```javascript
// In your application (e.g., graphcycle)
const formSchema = {
  id: 'form123',
  name: 'My Form',
  formClass: 'FusionDocument',
  actionCode: 'CRE',
  version: 1,
  sections: [/* ... */]
};

// Write to localStorage
localStorage.setItem('fusionforms_import', JSON.stringify(formSchema));

// Launch FusionForms
window.open('http://dev-codex.idoxgroup.local/fusionforms?import=local', '_blank');

// Optional: Clean up after a delay
setTimeout(() => {
  localStorage.removeItem('fusionforms_import');
}, 5000);
```

**Custom Key:**
```javascript
localStorage.setItem('my_custom_key', JSON.stringify(formSchema));
window.open('http://dev-codex.idoxgroup.local/fusionforms?import=my_custom_key', '_blank');
```

**Pros:**
- No URL length limits
- Handles large forms
- Fast and reliable

**Cons:**
- Requires same origin (domain and protocol)
- Temporary storage only

---

## Form Schema Format

FusionForms accepts two formats:

### 1. JSON Schema (Native Format)

```json
{
  "id": "form_abc123",
  "name": "Example Form",
  "description": "Optional description",
  "formClass": "FusionDocument",
  "actionCode": "CRE",
  "version": 1,
  "sections": [
    {
      "id": "section_1",
      "title": "Section Title",
      "layout": "table",
      "rows": [
        {
          "id": "row_1",
          "columns": [
            {
              "id": "col_1",
              "span": 1,
              "fields": [
                {
                  "id": "field_1",
                  "type": "text",
                  "name": "fullName",
                  "label": "Full Name",
                  "bindingProperty": "Applicant",
                  "placeholder": "Enter name",
                  "validations": [
                    { "type": "required", "message": "Name is required" }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### 2. HTML Format (Legacy Forms)

FusionForms can import legacy HTML forms and convert them to editable schemas:

```html
<html>
  <body>
    <form>
      <table>
        <tr>
          <td>
            <label for="name">Full Name</label>
            <input type="text" id="name" name="name" value="${Applicant}" />
          </td>
        </tr>
      </table>
    </form>
  </body>
</html>
```

---

## Error Handling

If a form fails to load, FusionForms will:
1. Display a warning notification with the error message
2. Load the default empty form
3. Allow the user to continue working

Common errors:
- **Network error**: URL not accessible
- **Parse error**: Invalid JSON or malformed HTML
- **Not found**: File doesn't exist at specified path
- **CORS error**: Remote URL blocks cross-origin requests

---

## Complete Integration Example (GraphCycle)

### Setting Up GraphCycle

```javascript
// Configuration (add to admin settings)
const FUSIONFORMS_BASE_URL = 'http://dev-codex.idoxgroup.local/fusionforms';

// Function to open a form in FusionForms
function openInFusionForms(formSource) {
  let targetUrl;
  
  if (typeof formSource === 'string') {
    // URL or path
    if (formSource.startsWith('http://') || formSource.startsWith('https://')) {
      targetUrl = `${FUSIONFORMS_BASE_URL}?formUrl=${encodeURIComponent(formSource)}`;
    } else {
      targetUrl = `${FUSIONFORMS_BASE_URL}?form=${encodeURIComponent(formSource)}`;
    }
  } else if (typeof formSource === 'object') {
    // Schema object - use localStorage for reliability
    localStorage.setItem('fusionforms_import', JSON.stringify(formSource));
    targetUrl = `${FUSIONFORMS_BASE_URL}?import=local`;
    
    // Clean up after 10 seconds
    setTimeout(() => {
      localStorage.removeItem('fusionforms_import');
    }, 10000);
  }
  
  // Open in new tab/window
  window.open(targetUrl, '_blank');
}

// Usage examples:

// 1. Open from URL
openInFusionForms('http://api.server.local/forms/123');

// 2. Open from local path
openInFusionForms('samples/design.html');

// 3. Open from schema object
openInFusionForms({
  id: 'form_xyz',
  name: 'Generated Form',
  formClass: 'VendorDocument',
  actionCode: 'AMD',
  version: 1,
  sections: [/* ... */]
});
```

### Adding to GraphCycle UI

```javascript
// Add a button/link in your GraphCycle UI
<button onClick={() => openInFusionForms(currentFormData)}>
  Edit in FusionForms
</button>
```

---

## Testing the Integration

You can test each method directly in your browser:

1. **URL Method:**
   ```
   http://dev-codex.idoxgroup.local/fusionforms?formUrl=http://dev-codex.idoxgroup.local/fusionforms/samples/design.html
   ```

2. **Path Method:**
   ```
   http://dev-codex.idoxgroup.local/fusionforms?form=samples/design.html
   ```

3. **localStorage Method:**
   ```javascript
   // In browser console:
   localStorage.setItem('fusionforms_import', JSON.stringify({
     id: 'test',
     name: 'Test Form',
     formClass: 'FusionDocument',
     actionCode: 'CRE',
     version: 1,
     sections: []
   }));
   // Then navigate to:
   ```
   ```
   http://dev-codex.idoxgroup.local/fusionforms?import=local
   ```

4. **Base64 Method:**
   ```javascript
   // In browser console:
   const data = btoa(JSON.stringify({id:'test',name:'Test',formClass:'FusionDocument',actionCode:'CRE',version:1,sections:[]}));
   console.log(`http://dev-codex.idoxgroup.local/fusionforms?formData=${data}`);
   // Copy and navigate to the logged URL
   ```

---

## Security Considerations

- **Same-Origin**: localStorage method requires same domain/protocol
- **CORS**: Remote URLs must allow cross-origin requests
- **URL Length**: Base64 method limited by browser URL length (~2000 chars)
- **Validation**: FusionForms validates all imported schemas
- **Sanitization**: HTML content is parsed and sanitized

---

## Support

For issues or questions about integration, check:
- Form load errors appear as yellow alerts in FusionForms
- Browser console shows detailed error messages
- Network tab shows failed fetch requests
