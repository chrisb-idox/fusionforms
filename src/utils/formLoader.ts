import type { FormSchema } from '../types/formSchema';
import { parseSampleHtmlToSchema } from './sampleParser';

export type FormLoadSource = 
  | { type: 'url'; url: string }
  | { type: 'data'; base64Data: string }
  | { type: 'localStorage'; key: string }
  | { type: 'path'; path: string };

export interface FormLoadResult {
  success: boolean;
  schema?: FormSchema;
  error?: string;
  filename?: string;
}

/**
 * Loads a form from various sources (URL, base64 data, localStorage, file path)
 */
export const loadFormFromSource = async (source: FormLoadSource): Promise<FormLoadResult> => {
  try {
    switch (source.type) {
      case 'url':
        return await loadFromUrl(source.url);
      
      case 'data':
        return loadFromBase64(source.base64Data);
      
      case 'localStorage':
        return loadFromLocalStorage(source.key);
      
      case 'path':
        return await loadFromPath(source.path);
      
      default:
        return { success: false, error: 'Unknown source type' };
    }
  } catch (error) {
    console.error('Error loading form:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error loading form' 
    };
  }
};

/**
 * Load form from a URL
 */
const loadFromUrl = async (url: string): Promise<FormLoadResult> => {
  try {
    const response = await fetch(url);
    
    // Check if request failed (404, 500, etc.)
    if (!response.ok) {
      return { success: false, error: `Failed to fetch form: ${response.status} ${response.statusText}` };
    }
    
    // Check if we got redirected (Vite returns index.html for unknown routes)
    if (response.url && response.url !== url && !response.url.endsWith(url)) {
      return { success: false, error: `File not found (redirected to ${response.url})` };
    }
    
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    
    // Additional check: if we requested an .html file from forms/ but got back something that looks like Vite's index
    if (url.includes('forms/') && text.includes('id="root"') && text.includes('type="module"')) {
      return { success: false, error: `File not found (received app index instead of form file)` };
    }
    
    return parseFormContent(text, contentType, url);
  } catch (error) {
    return { 
      success: false, 
      error: `Network error loading form: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

/**
 * Load form from a file path (treats it as a URL relative to the app)
 */
const loadFromPath = async (path: string): Promise<FormLoadResult> => {
  // Check if path is for a form in the Forms Library (localStorage)
  if (path.startsWith('forms/')) {
    const filename = path.substring(6); // Remove 'forms/' prefix
    const libraryKey = 'fusionforms_library';
    
    // First, try to load from Forms Library
    try {
      const library = JSON.parse(localStorage.getItem(libraryKey) || '{}');
      
      if (library[filename]) {
        console.log(`Loading "${filename}" from Forms Library`);
        const { html } = library[filename];
        const result = parseFormContent(html, 'text/html', filename);
        if (result.success) {
          return { ...result, filename };
        }
      }
    } catch (error) {
      console.warn('Failed to load from Forms Library:', error);
    }
    
    // Not in library, try to load from server
    console.log(`"${filename}" not in Forms Library, trying server...`);
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const baseUrl = window.location.origin + import.meta.env.BASE_URL;
    const fullUrl = baseUrl.endsWith('/') 
      ? `${baseUrl}${normalizedPath.substring(1)}`
      : `${baseUrl}${normalizedPath}`;
    
    const result = await loadFromUrl(fullUrl);
    
    // If server load failed, return friendly error
    if (!result.success) {
      console.log(`"${filename}" not found on server either`);
      return {
        success: false,
        error: `Form "${filename}" not found in Forms Library or server.\n\nTo create this form:\n1. Build your form in FusionForms\n2. Click Export HTML > Forms Library\n3. The form will be saved and available for GraphCycle`
      };
    }
    
    // Server load succeeded
    return { ...result, filename };
  }
  
  // If path is absolute URL, use it directly
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return loadFromUrl(path);
  }
  
  // Otherwise, try to load from the public folder or as a relative path
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = window.location.origin + import.meta.env.BASE_URL;
  const fullUrl = baseUrl.endsWith('/') 
    ? `${baseUrl}${normalizedPath.substring(1)}`
    : `${baseUrl}${normalizedPath}`;
  
  return loadFromUrl(fullUrl);
};

/**
 * Load form from base64-encoded data
 */
const loadFromBase64 = (base64Data: string): FormLoadResult => {
  try {
    const decoded = atob(base64Data);
    return parseFormContent(decoded, 'application/json', 'base64 data');
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to decode base64 data: ${error instanceof Error ? error.message : 'Invalid base64'}` 
    };
  }
};

/**
 * Load form from localStorage
 */
const loadFromLocalStorage = (key: string): FormLoadResult => {
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      return { success: false, error: `No data found in localStorage for key: ${key}` };
    }
    
    return parseFormContent(data, 'application/json', 'localStorage');
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to load from localStorage: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

/**
 * Parse form content based on type (JSON schema or HTML form)
 */
const parseFormContent = (content: string, contentType: string, source: string): FormLoadResult => {
  try {
    // Try JSON first
    if (contentType.includes('json') || content.trim().startsWith('{')) {
      const schema = JSON.parse(content) as FormSchema;
      
      // Validate it's a valid schema
      if (!schema.id || !schema.name || !Array.isArray(schema.sections)) {
        return { 
          success: false, 
          error: 'Invalid form schema: missing required fields (id, name, sections)' 
        };
      }
      
      return { success: true, schema };
    }
    
    // Try HTML parsing
    if (contentType.includes('html') || content.trim().startsWith('<') || content.includes('<html')) {
      // Validate it's actually a form HTML, not an error page
      const hasFormElements = content.includes('<form') || content.includes('<input') || content.includes('<textarea') || content.includes('<select');
      
      if (!hasFormElements) {
        return {
          success: false,
          error: 'HTML content does not contain form elements'
        };
      }
      
      const schema = parseSampleHtmlToSchema(content, source);
      return { success: true, schema };
    }
    
    // Try parsing as HTML anyway (legacy forms might not have proper content-type)
    if (content.includes('<form') || content.includes('<input') || content.includes('<table')) {
      const schema = parseSampleHtmlToSchema(content, source);
      return { success: true, schema };
    }
    
    return { 
      success: false, 
      error: 'Unrecognized form format. Expected JSON schema or HTML form.' 
    };
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to parse form: ${error instanceof Error ? error.message : 'Parse error'}` 
    };
  }
};

/**
 * Parse URL parameters to determine form load source
 */
export const getFormSourceFromUrl = (): FormLoadSource | null => {
  const params = new URLSearchParams(window.location.search);
  
  // Check for formUrl parameter
  const formUrl = params.get('formUrl');
  if (formUrl) {
    return { type: 'url', url: formUrl };
  }
  
  // Check for form path parameter
  const formPath = params.get('form');
  if (formPath) {
    return { type: 'path', path: formPath };
  }
  
  // Check for base64 form data
  const formData = params.get('formData');
  if (formData) {
    return { type: 'data', base64Data: formData };
  }
  
  // Check for localStorage import
  const importKey = params.get('import');
  if (importKey === 'local') {
    return { type: 'localStorage', key: 'fusionforms_import' };
  } else if (importKey) {
    return { type: 'localStorage', key: importKey };
  }
  
  return null;
};

/**
 * Helper for external apps to prepare form data for import
 */
export const prepareFormDataForImport = (schema: FormSchema): string => {
  const json = JSON.stringify(schema);
  return btoa(json);
};

/**
 * Helper for external apps to create localStorage import
 */
export const setFormForImport = (schema: FormSchema, key = 'fusionforms_import'): void => {
  localStorage.setItem(key, JSON.stringify(schema));
};
