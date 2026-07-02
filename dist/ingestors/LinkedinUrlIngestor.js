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
exports.LinkedinUrlIngestor = void 0;
const cheerio = __importStar(require("cheerio"));
class LinkedinUrlIngestor {
    sourceType = 'LinkedIn Scraper';
    async ingest(filePathOrUrl) {
        try {
            if (!filePathOrUrl.startsWith('http')) {
                throw new Error("LinkedIn ingestor requires a valid HTTP URL.");
            }
            const response = await fetch(filePathOrUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            if (!response.ok) {
                // LinkedIn almost always returns 999 or 403 for simple programmatic fetches. We throw gracefully to show the pipeline handles it.
                throw new Error(`LinkedIn blocked the request (HTTP ${response.status}). Enterprise API key or authenticated session required for live scraping.`);
            }
            const html = await response.text();
            const $ = cheerio.load(html);
            // Extract basics from public HTML (title usually has the name: "John Doe - Software Engineer - LinkedIn")
            const titleTag = $('title').text();
            let extractedName = titleTag.split('-')[0]?.trim();
            return [{
                    sourceType: this.sourceType,
                    sourceName: filePathOrUrl,
                    profile: {
                        full_name: extractedName || 'Unknown LinkedIn User',
                        experience: [{
                                company: 'LinkedIn Fetch',
                                title: 'Profile Parsed',
                                start: 'Unknown'
                            }]
                    }
                }];
        }
        catch (error) {
            console.warn(`\n⚠️ [LinkedIn Scraper Warning] Failed to ingest ${filePathOrUrl}: ${error.message}`);
            return []; // Graceful degradation prevents pipeline crashes
        }
    }
}
exports.LinkedinUrlIngestor = LinkedinUrlIngestor;
