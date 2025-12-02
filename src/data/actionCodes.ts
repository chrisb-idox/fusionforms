import type { ActionCode } from '../types/formSchema';

export const actionCodes: { value: ActionCode; label: string; description: string }[] = [
  { value: 'CRE', label: 'CRE', description: 'Creation' },
  { value: 'AMD', label: 'AMD', description: 'Amendment' },
  { value: 'CO', label: 'CO', description: 'Check out' },
  { value: 'CI', label: 'CI', description: 'Check in' },
  { value: 'DF', label: 'DF', description: 'Details' },
  { value: 'SAS', label: 'SAS', description: 'Save document' },
  { value: 'QRY', label: 'QRY', description: 'Query' },
  { value: 'REC', label: 'REC', description: 'Re-categorize' },
  { value: 'CPY', label: 'CPY', description: 'Copy' },
];
