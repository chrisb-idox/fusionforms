# Class Selector Feature

## Overview

The FusionForms builder now includes a class selector that allows users to:
1. Select an EDMS class (e.g., FusionDocument, VendorDocument)
2. View all available properties for that class
3. Select a property to bind to a form field

This feature is similar to the GraphCycle application's property selector.

## Implementation

### Files Added/Modified

1. **`data/propertiesLibrary.xml`** - XML library defining classes and their properties
2. **`src/utils/propertiesLibrary.ts`** - TypeScript parser for the XML library
3. **`src/vite-env.d.ts`** - Type declarations for importing XML as raw text
4. **`src/types/formSchema.ts`** - Added `bindingClass` field to FieldSchema
5. **`src/components/builder/PropertiesPanel.tsx`** - Read-only display with Edit button and modal
6. **`src/components/builder/CanvasPanel.tsx`** - Display class info on field cards

### How It Works

1. **XML Parsing**: The `propertiesLibrary.xml` file is loaded at runtime and parsed using DOMParser
2. **Caching**: The parsed library is cached for performance
3. **Cascading Selectors**: 
   - First, select a class from the dropdown
   - Then, select a property from the filtered list of that class's properties
4. **Visual Feedback**: Selected class appears in blue brackets `[ClassName]` on field cards in the canvas

### Usage in the Builder

1. **Select a field** in the canvas
2. **In the Properties Panel**, scroll to the "EDMS Binding" section
3. **View current binding**: 
   - If a class/property is bound, it displays as a read-only badge and label
   - If no binding is set, shows "No binding set"
4. **Click "Edit" button** to open the class selector modal
5. **In the modal**:
   - **Select a Class**: Choose from FusionDocument or VendorDocument
   - **Select a Property**: Either use the dropdown or click directly in the property browser
   - The property browser shows all available properties with labels and names
   - Selected property is highlighted with a blue background and checkmark
6. **Click "Apply"** to save the binding
7. **Optional**: Click "Clear" to remove the binding entirely

### Data Structure

```typescript
export type PropertyDefinition = {
  name: string;        // Internal property name (e.g., "ApprovalDate")
  label: string;       // Display label (e.g., "Approval Date")
};

export type ClassProperties = {
  name: string;                    // Class name (e.g., "FusionDocument")
  properties: PropertyDefinition[]; // Available properties
};
```

### Available Classes

- **FusionDocument**: 41 properties including ApprovalDate, DocumentTitle, LifecycleState, etc.
- **VendorDocument**: 41 properties (similar to FusionDocument with minor variations)

### Field Schema Updates

Fields now store both class and property:
```typescript
{
  bindingClass: "FusionDocument",
  bindingProperty: "ApprovalDate",
  defaultValue: "${ApprovalDate}"
}
```

## Future Enhancements

- Add more classes to the propertiesLibrary.xml
- Display property descriptions/help text
- Filter properties by data type
- Property validation based on field type
- Bulk property assignment across multiple fields
