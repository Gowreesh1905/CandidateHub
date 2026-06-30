import * as fs from 'fs';
import { createRequire } from 'module';
export class PdfResumeIngestor {
    sourceType = 'Resume PDF';
    async ingest(filePath) {
        const dataBuffer = fs.readFileSync(filePath);
        // Use createRequire to load pdf-parse (CommonJS module)
        const require = createRequire(import.meta.url);
        // @ts-ignore - pdf-parse module structure varies
        let pdfParse = require('pdf-parse');
        // Handle different export formats
        if (typeof pdfParse !== 'function') {
            pdfParse = pdfParse.default || Object.values(pdfParse)[0];
        }
        // pdf-parse might be a class or a function
        const data = typeof pdfParse === 'function'
            ? pdfParse.prototype ? await new pdfParse(dataBuffer) : await pdfParse(dataBuffer)
            : await pdfParse(dataBuffer);
        const text = data?.text || data || '';
        // If text is still not a string, return empty result
        if (typeof text !== 'string' || !text) {
            return [];
        }
        // Simple Regex Heuristics for extraction
        const emailMatch = text.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/);
        const phoneMatch = text.match(/\d{3}[-\.\s]??\d{3}[-\.\s]??\d{4}/);
        // Naive skill extraction based on a dictionary
        const skillsFound = [];
        const knownSkills = ['node.js', 'typescript', 'react', 'sql', 'python', 'java'];
        knownSkills.forEach(skill => {
            if (text.toLowerCase().includes(skill)) {
                skillsFound.push({
                    name: skill,
                    confidence: 0.95, // High confidence for skills found explicitly on a resume
                    sources: [this.sourceType]
                });
            }
        });
        const record = {
            sourceType: this.sourceType,
            sourceName: filePath,
            profile: {
                emails: emailMatch ? [emailMatch[0]] : undefined,
                phones: phoneMatch ? [phoneMatch[0]] : undefined,
                skills: skillsFound.length > 0 ? skillsFound : undefined,
            }
        };
        return [record]; // A resume typically represents a single candidate
    }
}
