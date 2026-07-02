"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fs = __importStar(require("fs"));
const CsvIngestor_js_1 = require("./ingestors/CsvIngestor.js");
const PdfResumeIngestor_js_1 = require("./ingestors/PdfResumeIngestor.js");
const AtsJsonIngestor_js_1 = require("./ingestors/AtsJsonIngestor.js");
const GithubApiIngestor_js_1 = require("./ingestors/GithubApiIngestor.js");
const merger_js_1 = require("./merger.js");
const projector_js_1 = require("./projector.js");
const program = new commander_1.Command();
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
        const config = JSON.parse(configRaw);
        // 2. Ingestion
        const allNormalizedRecords = [];
        if (options.csv && options.csv.length > 0) {
            const csvIngestor = new CsvIngestor_js_1.CsvIngestor();
            for (const csvPath of options.csv) {
                const records = await csvIngestor.ingest(csvPath.trim());
                allNormalizedRecords.push(...records);
            }
        }
        if (options.pdf && options.pdf.length > 0) {
            const pdfIngestor = new PdfResumeIngestor_js_1.PdfResumeIngestor();
            for (const pdfPath of options.pdf) {
                const records = await pdfIngestor.ingest(pdfPath.trim());
                allNormalizedRecords.push(...records);
            }
        }
        if (options.ats && options.ats.length > 0) {
            const atsIngestor = new AtsJsonIngestor_js_1.AtsJsonIngestor();
            for (const atsPath of options.ats) {
                const records = await atsIngestor.ingest(atsPath.trim());
                allNormalizedRecords.push(...records);
            }
        }
        if (options.github && options.github.length > 0) {
            const githubIngestor = new GithubApiIngestor_js_1.GithubApiIngestor();
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
        const groups = (0, merger_js_1.groupRecordsByIdentity)(allNormalizedRecords);
        // 4. Conflict Resolution (Merging)
        const canonicalProfiles = groups.map((group) => (0, merger_js_1.mergeCandidateGroup)(group));
        // 5. Config-Driven Projection
        const finalOutputs = [];
        canonicalProfiles.forEach((profile) => {
            try {
                finalOutputs.push(projector_js_1.ProjectionEngine.project(profile, config));
            }
            catch (error) {
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
                    console.log(`Confidence: ${(profile.overall_confidence * 100).toFixed(1)}%`);
                    console.log('Field Decisions:');
                    profile.provenance.forEach(p => {
                        console.log(`  - [${p.field}]: Chose '${p.source}' (${p.method})`);
                    });
                }
            }
        });
        console.log('======================================================\n');
    }
    catch (error) {
        console.error(`Pipeline Error:\n${error.stack}`);
        process.exit(1);
    }
});
program.parse(process.argv);
