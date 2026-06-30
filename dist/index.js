import { Command } from 'commander';
import * as fs from 'fs';
import { CsvIngestor } from './ingestors/CsvIngestor.js';
import { PdfResumeIngestor } from './ingestors/PdfResumeIngestor.js';
import { groupRecordsByIdentity, mergeCandidateGroup } from './merger.js';
import { ProjectionEngine } from './projector.js';
const program = new Command();
program
    .name('eightfold-transformer')
    .description('Multi-Source Candidate Data Transformer')
    .option('--csv <path>', 'Path to structured Recruiter CSV')
    .option('--pdf <path>', 'Path to unstructured Resume PDF')
    .option('--config <path>', 'Path to the runtime projection JSON config')
    .action(async (options) => {
    try {
        if (!options.config) {
            throw new Error("A runtime config file is required (--config).");
        }
        // 1. Load Config
        const configRaw = fs.readFileSync(options.config, 'utf-8');
        const config = JSON.parse(configRaw);
        // 2. Ingestion
        const allNormalizedRecords = [];
        if (options.csv) {
            const csvIngestor = new CsvIngestor();
            const records = await csvIngestor.ingest(options.csv);
            allNormalizedRecords.push(...records);
        }
        if (options.pdf) {
            const pdfIngestor = new PdfResumeIngestor();
            const records = await pdfIngestor.ingest(options.pdf);
            allNormalizedRecords.push(...records);
        }
        if (allNormalizedRecords.length === 0) {
            console.warn("Warning: No valid inputs provided. Returning empty array.");
            console.log(JSON.stringify([], null, 2));
            return;
        }
        // 3. Identity Resolution (Grouping)
        const groups = groupRecordsByIdentity(allNormalizedRecords);
        // 4. Conflict Resolution (Merging)
        const canonicalProfiles = groups.map((group) => mergeCandidateGroup(group));
        // 5. Config-Driven Projection
        const finalOutputs = canonicalProfiles.map((profile) => ProjectionEngine.project(profile, config));
        // 6. Output JSON
        console.log(JSON.stringify(finalOutputs, null, 2));
    }
    catch (error) {
        console.error(`Pipeline Error: ${error.message}`);
        process.exit(1);
    }
});
program.parse(process.argv);
