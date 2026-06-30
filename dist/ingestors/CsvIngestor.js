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
exports.CsvIngestor = void 0;
const fs = __importStar(require("fs"));
const csv_parse_1 = require("csv-parse");
class CsvIngestor {
    sourceType = 'Recruiter CSV';
    async ingest(filePath) {
        return new Promise((resolve, reject) => {
            const records = [];
            const parser = fs.createReadStream(filePath).pipe((0, csv_parse_1.parse)({
                columns: true,
                skip_empty_lines: true,
                trim: true
            }));
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
exports.CsvIngestor = CsvIngestor;
