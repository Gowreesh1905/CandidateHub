"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanonicalProfileSchema = void 0;
const zod_1 = require("zod");
// Zod schema for runtime validation of the final Canonical output
exports.CanonicalProfileSchema = zod_1.z.object({
    candidate_id: zod_1.z.string().uuid(),
    full_name: zod_1.z.string(),
    emails: zod_1.z.array(zod_1.z.string().email()),
    phones: zod_1.z.array(zod_1.z.string()),
    location: zod_1.z.object({
        city: zod_1.z.string().optional(),
        region: zod_1.z.string().optional(),
        country: zod_1.z.string().length(2).optional(), // ISO-3166 alpha-2
    }).optional(),
    links: zod_1.z.object({
        linkedin: zod_1.z.string().url().optional(),
        github: zod_1.z.string().url().optional(),
        portfolio: zod_1.z.string().url().optional(),
        other: zod_1.z.array(zod_1.z.string().url()).optional(),
    }).optional(),
    headline: zod_1.z.string().nullable().optional(),
    years_experience: zod_1.z.number().nullable().optional(),
    skills: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        confidence: zod_1.z.number().min(0).max(1),
        sources: zod_1.z.array(zod_1.z.string())
    })).optional(),
    experience: zod_1.z.array(zod_1.z.object({
        company: zod_1.z.string(),
        title: zod_1.z.string(),
        start: zod_1.z.string(), // YYYY-MM
        end: zod_1.z.string().optional(), // YYYY-MM or 'Present'
        summary: zod_1.z.string().optional()
    })).optional(),
    education: zod_1.z.array(zod_1.z.object({
        institution: zod_1.z.string(),
        degree: zod_1.z.string().optional(),
        field: zod_1.z.string().optional(),
        end_year: zod_1.z.string().optional()
    })).optional(),
    provenance: zod_1.z.array(zod_1.z.object({
        field: zod_1.z.string(),
        source: zod_1.z.string(),
        method: zod_1.z.string()
    })).optional(),
    overall_confidence: zod_1.z.number().min(0).max(1)
});
