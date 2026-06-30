import * as fs from 'fs';
// @ts-ignore
import pdfParse from 'pdf-parse';
import { IIngestor, NormalizedRecord } from '../types.js';

export class PdfResumeIngestor implements IIngestor {
  sourceType = 'Resume PDF';

  async ingest(filePath: string): Promise<NormalizedRecord[]> {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    const text = data.text;

    // Simple Regex Heuristics for extraction
    const emailMatch = text.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/);
    const phoneMatch = text.match(/\d{3}[-\.\s]??\d{3}[-\.\s]??\d{4}/);
    
    // Naive skill extraction based on a dictionary
    const skillsFound: {name: string, confidence: number, sources: string[]}[] = [];
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

    const record: NormalizedRecord = {
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
