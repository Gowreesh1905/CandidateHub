import type { CanonicalProfile } from './schema.js';

// Represents the output from any given Ingestor before matching/merging
export interface NormalizedRecord {
  sourceType: string;
  sourceName: string;
  profile: Partial<CanonicalProfile>;
}

// The core contract for our Pluggable Strategy Pattern
export interface IIngestor {
  sourceType: string;
  ingest(filePathOrUrl: string): Promise<NormalizedRecord[]>;
}

// Config Types for the Projection Engine
export type MissingAction = 'null' | 'omit' | 'error';

export interface FieldConfig {
  path: string;       // The output path
  from?: string;      // The canonical path (e.g. "emails[0]")
  type: 'string' | 'string[]' | 'number' | 'number[]' | 'boolean' | 'object';
  required?: boolean;
  normalize?: string; // e.g. "E164", "canonical"
}

export interface ProjectionConfig {
  fields: FieldConfig[];
  include_confidence?: boolean;
  on_missing?: MissingAction;
}
