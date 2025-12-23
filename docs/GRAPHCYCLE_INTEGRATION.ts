/**
 * GraphCycle Integration Example
 * 
 * This file shows how to integrate FusionForms with the GraphCycle application.
 * Add these functions to your GraphCycle codebase.
 */

// Configuration - should be set in admin settings
const FUSIONFORMS_BASE_URL = 'http://dev-codex.idoxgroup.local/fusionforms';

/**
 * Open a form in FusionForms editor
 * 
 * @param formSource - Can be:
 *   - string: URL or file path to form
 *   - object: FormSchema object
 * @param options - Optional configuration
 */
export function openInFusionForms(
  formSource: string | object,
  options?: {
    newWindow?: boolean;
    windowFeatures?: string;
  }
) {
  const { newWindow = true, windowFeatures = 'width=1400,height=900' } = options || {};
  
  let targetUrl: string;
  
  if (typeof formSource === 'string') {
    // Handle URL or path
    if (formSource.startsWith('http://') || formSource.startsWith('https://')) {
      // Remote URL
      targetUrl = `${FUSIONFORMS_BASE_URL}?formUrl=${encodeURIComponent(formSource)}`;
    } else {
      // Local path
      targetUrl = `${FUSIONFORMS_BASE_URL}?form=${encodeURIComponent(formSource)}`;
    }
  } else if (typeof formSource === 'object') {
    // Schema object - use localStorage for reliability with large forms
    const storageKey = 'fusionforms_import';
    localStorage.setItem(storageKey, JSON.stringify(formSource));
    targetUrl = `${FUSIONFORMS_BASE_URL}?import=local`;
    
    // Clean up localStorage after 10 seconds
    setTimeout(() => {
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {
        console.error('Failed to clean up localStorage:', e);
      }
    }, 10000);
  } else {
    throw new Error('Invalid formSource type. Expected string or object.');
  }
  
  // Open in new window/tab or same window
  if (newWindow) {
    window.open(targetUrl, '_blank', windowFeatures);
  } else {
    window.location.href = targetUrl;
  }
}

/**
 * Alternative: Use base64 encoding for small forms (URL-based)
 * Useful when localStorage is not available or cross-origin
 */
export function openInFusionFormsBase64(formSchema: object) {
  try {
    const json = JSON.stringify(formSchema);
    const base64 = btoa(json);
    const targetUrl = `${FUSIONFORMS_BASE_URL}?formData=${encodeURIComponent(base64)}`;
    
    // Check URL length (browser limit ~2000 chars)
    if (targetUrl.length > 2000) {
      console.warn('URL too long for base64 method. Consider using localStorage method instead.');
      return openInFusionForms(formSchema); // Fallback to localStorage
    }
    
    window.open(targetUrl, '_blank');
  } catch (error) {
    console.error('Failed to encode form for base64 method:', error);
    throw error;
  }
}

/**
 * Example: Add button to GraphCycle UI
 */
export function addEditFormButton(containerId: string, formData: object | string) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }
  
  const button = document.createElement('button');
  button.textContent = '✏️ Edit in FusionForms';
  button.className = 'btn btn-primary'; // Use your app's button styles
  button.onclick = () => openInFusionForms(formData);
  
  container.appendChild(button);
}

/**
 * Example usage in GraphCycle components:
 */

// Example 1: Open form from URL
function example1() {
  openInFusionForms('http://api.server.local/forms/design.html');
}

// Example 2: Open form from local path
function example2() {
  openInFusionForms('samples/design_CRE.html');
}

// Example 3: Open form from schema object
function example3() {
  const formSchema = {
    id: 'form_123',
    name: 'Application Form',
    formClass: 'FusionDocument',
    actionCode: 'CRE',
    version: 1,
    sections: [
      {
        id: 'section_1',
        title: 'Applicant Information',
        layout: 'table',
        rows: [
          {
            id: 'row_1',
            columns: [
              {
                id: 'col_1',
                span: 1,
                fields: [
                  {
                    id: 'field_1',
                    type: 'text',
                    name: 'applicantName',
                    label: 'Applicant Name',
                    bindingProperty: 'Applicant',
                    validations: [
                      { type: 'required', message: 'Name is required' }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  };
  
  openInFusionForms(formSchema);
}

// Example 4: React component integration
/*
import React from 'react';

export function FormEditorButton({ formData }) {
  const handleEdit = () => {
    openInFusionForms(formData);
  };
  
  return (
    <button onClick={handleEdit} className="btn btn-primary">
      Edit in FusionForms
    </button>
  );
}
*/

// Example 5: Error handling
async function example5WithErrorHandling(formUrl: string) {
  try {
    // Validate form exists before opening
    const response = await fetch(formUrl, { method: 'HEAD' });
    if (!response.ok) {
      alert('Form not found or inaccessible');
      return;
    }
    
    openInFusionForms(formUrl);
  } catch (error) {
    console.error('Error opening form:', error);
    alert('Failed to open form editor');
  }
}

// Example 6: Batch processing - open multiple forms
function example6BatchOpen(formUrls: string[]) {
  formUrls.forEach((url, index) => {
    // Stagger opening to avoid popup blockers
    setTimeout(() => {
      openInFusionForms(url, {
        newWindow: true,
        windowFeatures: `width=1200,height=800,left=${100 + index * 50},top=${100 + index * 50}`
      });
    }, index * 500);
  });
}
