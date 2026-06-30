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
const merger_js_1 = require("./merger.js");
const projector_js_1 = require("./projector.js");
const program = new commander_1.Command();
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
            const csvIngestor = new CsvIngestor_js_1.CsvIngestor();
            const records = await csvIngestor.ingest(options.csv);
            allNormalizedRecords.push(...records);
        }
        if (options.pdf) {
            const pdfIngestor = new PdfResumeIngestor_js_1.PdfResumeIngestor();
            const records = await pdfIngestor.ingest(options.pdf);
            allNormalizedRecords.push(...records);
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
        const finalOutputs = canonicalProfiles.map((profile) => projector_js_1.ProjectionEngine.project(profile, config));
        // 6. Output JSON
        console.log(JSON.stringify(finalOutputs, null, 2));
    }
    catch (error) {
        console.error(`Pipeline Error:\n${error.stack}`);
        process.exit(1);
    }
});
program.parse(process.argv);
