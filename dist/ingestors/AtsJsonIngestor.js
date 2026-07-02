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
exports.AtsJsonIngestor = void 0;
const fs = __importStar(require("fs"));
class AtsJsonIngestor {
    sourceType = 'ATS JSON';
    async ingest(filePathOrUrl) {
        let rawData;
        try {
            if (filePathOrUrl.startsWith('http://') || filePathOrUrl.startsWith('https://')) {
                const response = await fetch(filePathOrUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                rawData = await response.text();
            }
            else {
                rawData = fs.readFileSync(filePathOrUrl, 'utf-8');
            }
            const jsonData = JSON.parse(rawData);
            // Basic normalization logic for our expected ATS structure
            const candidates = jsonData.candidates || (Array.isArray(jsonData) ? jsonData : [jsonData]);
            return candidates.map((c) => ({
                sourceType: this.sourceType,
                sourceName: filePathOrUrl,
                profile: {
                    candidate_id: c.applicant_id,
                    full_name: c.applicant_name,
                    emails: c.contact_info?.email_address ? [c.contact_info.email_address] : undefined,
                    phones: c.contact_info?.phone_number ? [c.contact_info.phone_number] : undefined,
                    skills: c.professional_skills?.map((s) => ({
                        name: s.toLowerCase(),
                        confidence: 0.95,
                        sources: [this.sourceType]
                    })) || undefined,
                    experience: c.employment_history?.map((e) => ({
                        company: e.employer,
                        title: e.job_title,
                        start: e.start_date || 'Unknown'
                    })) || undefined
                }
            }));
        }
        catch (error) {
            console.warn(`\n⚠️ [ATS Ingestor Warning] Failed to ingest ${filePathOrUrl}: ${error.message}`);
            return []; // Graceful degradation
        }
    }
}
exports.AtsJsonIngestor = AtsJsonIngestor;
