import { Command } from 'commander';
import * as fs from 'fs';
import { CsvIngestor } from './ingestors/CsvIngestor.js';
import { PdfResumeIngestor } from './ingestors/PdfResumeIngestor.js';
import { AtsJsonIngestor } from './ingestors/AtsJsonIngestor.js';
import { GithubApiIngestor } from './ingestors/GithubApiIngestor.js';
import { groupRecordsByIdentity, mergeCandidateGroup } from './merger.js';
import { ProjectionEngine } from './projector.js';
import type { ProjectionConfig } from './types.js';

const program = new Command();

program
  .name('eightfold-transformer')
  .description('Multi-Source Candidate Data Transformer')
  .option('--csv <paths>', 'Comma-separated paths to structured Recruiter CSVs', (val) => val.split(','))
  .option('--pdf <paths>', 'Comma-separated paths to unstructured Resume PDFs', (val) => val.split(','))
  .option('--ats <paths>', 'Comma-separated paths/URLs to ATS JSON data', (val) => val.split(','))
  .option('--github <urls>', 'Comma-separated public GitHub profile URLs', (val) => val.split(','))
  .option('--config <path>', 'Path to the runtime projection JSON config')
  .action(async (options) => {
    try {
      if (!options.config) {
        throw new Error("A runtime config file is required (--config).");
      }

      // 1. Load Config
      const configRaw = fs.readFileSync(options.config, 'utf-8');
      const config: ProjectionConfig = JSON.parse(configRaw);

      // 2. Ingestion
      const allNormalizedRecords = [];
      
      if (options.csv && options.csv.length > 0) {
        const csvIngestor = new CsvIngestor();
        for (const csvPath of options.csv) {
          const records = await csvIngestor.ingest(csvPath.trim());
          allNormalizedRecords.push(...records);
        }
      }

      if (options.pdf && options.pdf.length > 0) {
        const pdfIngestor = new PdfResumeIngestor();
        for (const pdfPath of options.pdf) {
          const records = await pdfIngestor.ingest(pdfPath.trim());
          allNormalizedRecords.push(...records);
        }
      }

      if (options.ats && options.ats.length > 0) {
        const atsIngestor = new AtsJsonIngestor();
        for (const atsPath of options.ats) {
          const records = await atsIngestor.ingest(atsPath.trim());
          allNormalizedRecords.push(...records);
        }
      }

      if (options.github && options.github.length > 0) {
        const githubIngestor = new GithubApiIngestor();
        for (const ghUrl of options.github) {
          const records = await githubIngestor.ingest(ghUrl.trim());
          allNormalizedRecords.push(...records);
        }
      }

      if (allNormalizedRecords.length === 0) {
        console.warn("Warning: No valid inputs provided. Returning empty array.");
        console.log(JSON.stringify([], null, 2));
        return;
      }

      // 3. Identity Resolution (Grouping)
      const groups = groupRecordsByIdentity(allNormalizedRecords);

      // 4. Conflict Resolution (Merging)
      const canonicalProfiles = groups.map((group: typeof groups[0]) => mergeCandidateGroup(group));

      // 5. Config-Driven Projection
      const finalOutputs: any[] = [];
      canonicalProfiles.forEach((profile: typeof canonicalProfiles[0]) => {
        try {
          finalOutputs.push(ProjectionEngine.project(profile, config));
        } catch (error: any) {
          console.log(`\n⚠️ [PIPELINE WARNING] Skipping Candidate '${profile.full_name || profile.candidate_id}': ${error.message}`);
        }
      });

      // 6. Output JSON
      console.log(JSON.stringify(finalOutputs, null, 2));

      // 7. Print Transformation Report
      console.log('\n======================================================');
      console.log('                 TRANSFORMATION REPORT                ');
      console.log('======================================================');
      console.log(`Total Inputs Processed: ${allNormalizedRecords.length} records`);
      console.log(`Total Candidates Resolved: ${canonicalProfiles.length} unique candidates`);
      
      console.log('\n--- Conflict Resolution Log ---');
      canonicalProfiles.forEach(profile => {
        if (profile.provenance && profile.provenance.length > 0) {
          const multiSource = new Set(profile.provenance.map(p => p.source)).size > 1;
          if (multiSource) {
            console.log(`\nCandidate: ${profile.full_name || profile.candidate_id}`);
            console.log(`Confidence: ${(profile.overall_confidence! * 100).toFixed(1)}%`);
            console.log('Field Decisions:');
            profile.provenance.forEach(p => {
               console.log(`  - [${p.field}]: Chose '${p.source}' (${p.method})`);
            });
          }
        }
      });
      console.log('======================================================\n');

    } catch (error: any) {
      console.error(`Pipeline Error:\n${error.stack}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
