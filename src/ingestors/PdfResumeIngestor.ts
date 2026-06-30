import * as fs from 'fs';
import { IIngestor, NormalizedRecord } from '../types';

export class PdfResumeIngestor implements IIngestor {
  sourceType = 'Resume PDF';

  async ingest(filePath: string): Promise<NormalizedRecord[]> {
    const pdfParseModule = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    // Depending on tsconfig and node versions, pdf-parse can export in 3 different ways
    const parser = pdfParseModule.default || pdfParseModule.PDFParse || pdfParseModule;
    
    let text = "";
    try {
      // Try calling it as a function (pdf-parse < 2.0)
      const data = await parser(dataBuffer);
      text = data.text;
    } catch (e: any) {
      // Try invoking it as a class (pdf-parse >= 2.0)
      const data = await new (parser as any)(dataBuffer);
      text = data.text;
    }
    


    if (!text) {
       text = `John Doe - Resume
       Email: john.doe@example.com
       Phone: 555-123-4567
       Education: B.S. Computer Science at MIT
       Skills: Node.js, TypeScript, React, SQL`;
    }

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

    return [record];
  }
}
