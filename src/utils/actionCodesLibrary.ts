export interface ActionCodeItem {
  value: string;
  label: string;
  description: string;
}

let cachedActionCodes: ActionCodeItem[] | null = null;

const defaultActionCodes: ActionCodeItem[] = [
  { value: 'AMD', label: 'AMD', description: 'Amendment' },
  { value: 'CI', label: 'CI', description: 'Check in' },
  { value: 'CO', label: 'CO', description: 'Check out' },
  { value: 'CPY', label: 'CPY', description: 'Copy' },
  { value: 'CRE', label: 'CRE', description: 'Creation' },
  { value: 'DF', label: 'DF', description: 'Details' },
  { value: 'QRY', label: 'QRY', description: 'Query' },
  { value: 'REC', label: 'REC', description: 'Re-categorize' },
  { value: 'SAS', label: 'SAS', description: 'Save document' },
];

async function loadActionCodesFromXml(): Promise<ActionCodeItem[]> {
  try {
    const response = await fetch('/fusionforms/data/actionCodesLibrary.xml');
    if (!response.ok) {
      console.warn('Failed to load action codes XML, using defaults');
      return [...defaultActionCodes];
    }
    
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    
    const actionCodeElements = xml.querySelectorAll('actionCode');
    const codes: ActionCodeItem[] = [];
    
    actionCodeElements.forEach((el) => {
      const value = el.getAttribute('value');
      const label = el.getAttribute('label');
      const description = el.getAttribute('description');
      
      if (value && label) {
        codes.push({
          value,
          label,
          description: description || '',
        });
      }
    });
    
    return codes.length > 0 ? codes : [...defaultActionCodes];
  } catch (error) {
    console.error('Error loading action codes:', error);
    return [...defaultActionCodes];
  }
}

export async function getActionCodes(): Promise<ActionCodeItem[]> {
  if (cachedActionCodes) {
    return cachedActionCodes;
  }
  
  const codes = await loadActionCodesFromXml();
  cachedActionCodes = codes.sort((a, b) => a.value.localeCompare(b.value));
  return cachedActionCodes;
}

export function saveActionCodesToLocalStorage(codes: ActionCodeItem[]): void {
  const sorted = [...codes].sort((a, b) => a.value.localeCompare(b.value));
  localStorage.setItem('fusionforms_action_codes', JSON.stringify(sorted));
  cachedActionCodes = sorted;
}

export function loadActionCodesFromLocalStorage(): ActionCodeItem[] | null {
  try {
    const stored = localStorage.getItem('fusionforms_action_codes');
    if (stored) {
      const codes = JSON.parse(stored) as ActionCodeItem[];
      return codes.sort((a, b) => a.value.localeCompare(b.value));
    }
  } catch (error) {
    console.error('Error loading action codes from localStorage:', error);
  }
  return null;
}

export function getActionCodesSync(): ActionCodeItem[] {
  // First check localStorage
  const fromStorage = loadActionCodesFromLocalStorage();
  if (fromStorage) {
    return fromStorage;
  }
  
  // Use cached if available
  if (cachedActionCodes) {
    return cachedActionCodes;
  }
  
  // Fall back to defaults
  return [...defaultActionCodes].sort((a, b) => a.value.localeCompare(b.value));
}

export function resetActionCodesToDefaults(): void {
  localStorage.removeItem('fusionforms_action_codes');
  cachedActionCodes = [...defaultActionCodes].sort((a, b) => a.value.localeCompare(b.value));
}

export function validateActionCode(code: string, existingCodes: ActionCodeItem[]): string | null {
  // Must not be empty
  if (!code.trim()) {
    return 'Action code cannot be empty';
  }
  
  // Must be uppercase
  if (code !== code.toUpperCase()) {
    return 'Action code must be all uppercase';
  }
  
  // No spaces
  if (/\s/.test(code)) {
    return 'Action code cannot contain spaces';
  }
  
  // No special characters (only letters and numbers)
  if (!/^[A-Z0-9]+$/.test(code)) {
    return 'Action code can only contain uppercase letters and numbers';
  }
  
  // Max 10 characters
  if (code.length > 10) {
    return 'Action code cannot exceed 10 characters';
  }
  
  // Must be unique
  if (existingCodes.some(ac => ac.value === code)) {
    return 'Action code already exists';
  }
  
  return null;
}
