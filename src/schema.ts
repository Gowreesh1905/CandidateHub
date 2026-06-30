import { z } from 'zod';

// Zod schema for runtime validation of the final Canonical output
export const CanonicalProfileSchema = z.object({
  candidate_id: z.string().uuid(),
  full_name: z.string(),
  emails: z.array(z.string().email()),
  phones: z.array(z.string()),
  location: z.object({
    city: z.string().optional(),
    region: z.string().optional(),
    country: z.string().length(2).optional(), // ISO-3166 alpha-2
  }).optional(),
  links: z.object({
    linkedin: z.string().url().optional(),
    github: z.string().url().optional(),
    portfolio: z.string().url().optional(),
    other: z.array(z.string().url()).optional(),
  }).optional(),
  headline: z.string().nullable().optional(),
  years_experience: z.number().nullable().optional(),
  skills: z.array(
    z.object({
      name: z.string(),
      confidence: z.number().min(0).max(1),
      sources: z.array(z.string())
    })
  ).optional(),
  experience: z.array(
    z.object({
      company: z.string(),
      title: z.string(),
      start: z.string(), // YYYY-MM
      end: z.string().optional(), // YYYY-MM or 'Present'
      summary: z.string().optional()
    })
  ).optional(),
  education: z.array(
    z.object({
      institution: z.string(),
      degree: z.string().optional(),
      field: z.string().optional(),
      end_year: z.string().optional()
    })
  ).optional(),
  provenance: z.array(
    z.object({
      field: z.string(),
      source: z.string(),
      method: z.string()
    })
  ).optional(),
  overall_confidence: z.number().min(0).max(1)
});

// Infer strict TypeScript type from the Zod schema
export type CanonicalProfile = z.infer<typeof CanonicalProfileSchema>;
