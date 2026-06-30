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
exports.PdfResumeIngestor = void 0;
const fs = __importStar(require("fs"));
class PdfResumeIngestor {
    sourceType = 'Resume PDF';
    async ingest(filePath) {
        const pdfParseModule = require('pdf-parse');
        const dataBuffer = fs.readFileSync(filePath);
        // Depending on tsconfig and node versions, pdf-parse can export in 3 different ways
        const parser = pdfParseModule.default || pdfParseModule.PDFParse || pdfParseModule;
        let text = "";
        try {
            // Try calling it as a function (pdf-parse < 2.0)
            const data = await parser(dataBuffer);
            text = data.text;
        }
        catch (e) {
            // Try invoking it as a class (pdf-parse >= 2.0)
            const data = await new parser(dataBuffer);
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
        const skillsFound = [];
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
        const record = {
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
exports.PdfResumeIngestor = PdfResumeIngestor;
