import * as fs from 'fs';
import { parse } from 'csv-parse';
import { IIngestor, NormalizedRecord } from '../types.js';

export class CsvIngestor implements IIngestor {
  sourceType = 'Recruiter CSV';

  async ingest(filePath: string): Promise<NormalizedRecord[]> {
    return new Promise((resolve, reject) => {
      const records: NormalizedRecord[] = [];
      const parser = fs.createReadStream(filePath).pipe(
        parse({
          columns: true,
          skip_empty_lines: true,
          trim: true
        })
      );

      parser.on('readable', () => {
        let record;
        while ((record = parser.read()) !== null) {
          records.push({
            sourceType: this.sourceType,
            sourceName: filePath,
            profile: {
              full_name: record.name || undefined,
              emails: record.email ? [record.email] : undefined,
              phones: record.phone ? [record.phone] : undefined,
              experience: record.current_company ? [{
                company: record.current_company,
                title: record.title || 'Unknown',
                start: 'Unknown' // Missing in simple CSV
              }] : undefined
            }
          });
        }
      });

      parser.on('error', (err) => reject(err));
      parser.on('end', () => resolve(records));
    });
  }
}
