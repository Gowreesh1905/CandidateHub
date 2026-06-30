import { get } from 'lodash-es';
import type { CanonicalProfile } from './schema.js';
import type { ProjectionConfig } from './types.js';

export class ProjectionEngine {
  
  /**
   * Transforms the internal CanonicalProfile into the shape requested by the JSON Config.
   */
  static project(profile: CanonicalProfile, config: ProjectionConfig): any {
    const output: Record<string, any> = {};

    for (const fieldConfig of config.fields) {
      // 1. Resolve the path (fallback to 'path' if 'from' is omitted)
      const fetchPath = fieldConfig.from || fieldConfig.path;
      
      // Use lodash.get to safely extract nested values (e.g. 'emails[0]')
      let value = get(profile, fetchPath);

      // 2. Handle missing data strictly according to policy
      if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
        if (fieldConfig.required || config.on_missing === 'error') {
          throw new Error(`Strict Projection Error: Required field missing: ${fetchPath} on candidate ${profile.candidate_id}`);
        } else if (config.on_missing === 'omit') {
          continue; // Do not include the key in the output JSON
        } else {
          value = null; // Default fallback to null
        }
      }

      // 3. Apply optional per-field normalization defined in config
      if (value !== null && fieldConfig.normalize === 'E164') {
        value = typeof value === 'string' ? value.replace(/[^\d+]/g, '') : value;
      } else if (value !== null && fieldConfig.normalize === 'canonical') {
        value = Array.isArray(value) ? value.map(s => typeof s === 'string' ? s.toLowerCase().trim() : s) : value;
      }
      
      // Assign the value to the requested output path
      output[fieldConfig.path] = value;
    }

    // 4. Optionally append confidence and provenance if requested
    if (config.include_confidence) {
      output['overall_confidence'] = profile.overall_confidence;
      output['provenance'] = profile.provenance;
    }

    return output;
  }
}
