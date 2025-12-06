import { parseSampleHtmlToSchema } from './src/utils/sampleParser';
import * as fs from 'fs';
import * as path from 'path';
import { JSDOM } from 'jsdom';

// Mock browser environment for DOMParser
const dom = new JSDOM();
global.DOMParser = dom.window.DOMParser;
global.Element = dom.window.Element;
global.HTMLInputElement = dom.window.HTMLInputElement;
global.HTMLTableElement = dom.window.HTMLTableElement;
global.document = dom.window.document;

const html = fs.readFileSync(path.resolve(__dirname, 'samples/design.html'), 'utf-8');
const schema = parseSampleHtmlToSchema(html, 'Design Sample');

let missingOriginalNameCount = 0;
let totalFields = 0;

schema.sections.forEach(section => {
    section.rows.forEach(row => {
        row.columns.forEach(column => {
            column.fields.forEach(field => {
                totalFields++;
                if (!field.originalName) {
                    console.log(`Field missing originalName: ${field.name} (ID: ${field.id})`);
                    missingOriginalNameCount++;
                } else {
                    // console.log(`Field has originalName: ${field.name} -> ${field.originalName}`);
                }
            });
        });
    });
});

console.log(`Total fields: ${totalFields}`);
console.log(`Fields missing originalName: ${missingOriginalNameCount}`);
