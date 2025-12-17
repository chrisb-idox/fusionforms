# Quick Guide: How to Access the Class Selector

## Step-by-Step Instructions

### 1. Select a Field
First, you need to select a field in the canvas:
- Click on any field card in the form builder canvas
- The field will be highlighted with a blue border when selected
- The Properties Panel on the right will update to show field properties

### 2. Scroll to EDMS Binding Section
In the Properties Panel (right side), scroll down past:
- Field label
- Field name  
- Placeholder
- Help text

You'll see a divider labeled **"EDMS Binding"**

### 3. Find the Edit Button
Under "EDMS Binding", you'll see:
- Text: "Class/Property Binding"
- Below that: Either "No binding set" OR a card showing current binding
- On the right side: **[Edit]** button (small, light blue)
- If a binding exists: **[Clear]** button (small, red)

### 4. Click Edit
Click the **Edit** button to open the Class Selector modal

### 5. In the Modal
The modal will open with:
- Title: "Edit Class/Property Binding"
- Class dropdown
- Property dropdown (appears after selecting a class)
- Visual property browser (scrollable list)
- Apply and Cancel buttons at the bottom

## Visual Location

```
┌─────────────────────────────────┐
│ Properties Panel (Right Side)   │
├─────────────────────────────────┤
│ Field                           │
│ ├─ Label: [...]                 │
│ ├─ Name: [...]                  │
│ ├─ Placeholder: [...]           │
│ └─ Help text: [...]             │
│                                 │
│ EDMS Binding                    │
│ ┌─────────────────────────────┐ │
│ │ Class/Property Binding      │ │
│ │                             │ │
│ │ No binding set       [Edit] │ │  ← HERE!
│ └─────────────────────────────┘ │
│                                 │
│ Legacy EDMS Binding             │
│ └─ [dropdown...]                │
└─────────────────────────────────┘
```

## Troubleshooting

**"I don't see the Edit button"**
- ✅ Make sure you've selected a **field** (not a section or row)
- ✅ Check that you're looking in the Properties Panel on the **right side**
- ✅ Scroll down in the Properties Panel to the "EDMS Binding" section
- ✅ The button is small and says just "Edit"

**"I selected a field but still don't see it"**
- Try clicking on a different field
- Try refreshing the page (Ctrl+F5 or Cmd+Shift+R)
- Check the browser console for any errors (F12)

**"The Properties Panel is empty"**
- This means no field is selected
- Click directly on a field card in the canvas (the cards that say field names)
- You should see "Field" as a divider at the top of the Properties Panel when selected

## Current Deployment
- **URL**: https://dev-codex.idoxgroup.local:8444
- **Last Updated**: Dec 17, 2025 at 17:51
- **Feature**: Class Selector with Edit button is LIVE
