import propertiesXml from '../../data/propertiesLibrary.xml?raw';

export type PropertyDefinition = {
  name: string;
  label: string;
};

export type ClassProperties = {
  name: string;
  properties: PropertyDefinition[];
};

let cachedClasses: ClassProperties[] | null = null;

const parsePropertiesLibrary = (): ClassProperties[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(propertiesXml, 'application/xml');
  const root = doc.documentElement;
  const classes = Array.from(root.getElementsByTagName('Class'));
  return classes.map((classNode) => {
    const className = classNode.getAttribute('name') || 'UnknownClass';
    const properties = Array.from(classNode.getElementsByTagName('property')).map((prop) => ({
      name: prop.getAttribute('name') || '',
      label: prop.getAttribute('label') || prop.getAttribute('name') || '',
    }));
    return { name: className, properties };
  });
};

export const getPropertiesLibrary = (): ClassProperties[] => {
  if (cachedClasses) {
    return cachedClasses;
  }
  cachedClasses = parsePropertiesLibrary();
  return cachedClasses;
};
