// EDMS properties sourced from the top-level properties.json file.
import propertiesFile from '../../properties.json';

export const edmsProperties: string[] = Array.isArray(propertiesFile.properties)
  ? propertiesFile.properties
  : [];
