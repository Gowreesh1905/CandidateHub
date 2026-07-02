import * as fs from 'fs';
import type { IIngestor, NormalizedRecord } from '../types.js';

export class AtsJsonIngestor implements IIngestor {
  sourceType = 'ATS JSON';

  async ingest(filePathOrUrl: string): Promise<NormalizedRecord[]> {
    let rawData: string;

    try {
      if (filePathOrUrl.startsWith('http://') || filePathOrUrl.startsWith('https://')) {
        const response = await fetch(filePathOrUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        rawData = await response.text();
      } else {
        rawData = fs.readFileSync(filePathOrUrl, 'utf-8');
      }

      const jsonData = JSON.parse(rawData);
      
      // Basic normalization logic for our expected ATS structure
      const candidates = jsonData.candidates || (Array.isArray(jsonData) ? jsonData : [jsonData]);

      return candidates.map((c: any) => ({
        sourceType: this.sourceType,
        sourceName: filePathOrUrl,
        profile: {
          candidate_id: c.applicant_id,
          full_name: c.applicant_name,
          emails: c.contact_info?.email_address ? [c.contact_info.email_address] : undefined,
          phones: c.contact_info?.phone_number ? [c.contact_info.phone_number] : undefined,
          skills: c.professional_skills?.map((s: string) => ({
            name: s.toLowerCase(),
            confidence: 0.95,
            sources: [this.sourceType]
          })) || undefined,
          experience: c.employment_history?.map((e: any) => ({
            company: e.employer,
            title: e.job_title,
            start: e.start_date || 'Unknown'
          })) || undefined
        }
      }));
    } catch (error: any) {
      console.warn(`\n⚠️ [ATS Ingestor Warning] Failed to ingest ${filePathOrUrl}: ${error.message}`);
      return []; // Graceful degradation
    }
  }
}
