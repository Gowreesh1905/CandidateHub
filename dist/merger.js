import * as crypto from 'crypto';
// Field-level trust weights per source (0.0 to 1.0)
const TRUST_MATRIX = {
    'Resume PDF': {
        full_name: 0.9,
        emails: 0.9,
        phones: 0.9,
        skills: 0.95,
        education: 0.95,
        experience: 0.7,
    },
    'Recruiter CSV': {
        full_name: 0.8,
        emails: 0.8,
        phones: 0.8,
        experience: 0.9, // Higher trust for current employment
    }
};
const DEFAULT_TRUST = 0.5;
/**
 * Step 1: Identity Resolution
 * Groups records that belong to the same candidate based on match keys.
 */
export function groupRecordsByIdentity(records) {
    const groups = [];
    for (const record of records) {
        let matchedGroup = groups.find(group => {
            // Pass 1: Exact Email Match
            const hasSharedEmail = group.some(g => g.profile.emails?.some((email) => record.profile.emails?.includes(email)));
            if (hasSharedEmail)
                return true;
            // Pass 2: Exact Phone Match
            const hasSharedPhone = group.some(g => g.profile.phones?.some((phone) => record.profile.phones?.includes(phone)));
            // Edge Case: If they share a phone but have completely different emails, do not merge!
            if (hasSharedPhone) {
                const gEmails = group.flatMap(g => g.profile.emails || []);
                const rEmails = record.profile.emails || [];
                if (gEmails.length > 0 && rEmails.length > 0 && !gEmails.some(e => rEmails.includes(e))) {
                    return false; // Prevent wrong-but-confident merge
                }
                return true;
            }
            return false;
        });
        if (matchedGroup) {
            matchedGroup.push(record);
        }
        else {
            groups.push([record]);
        }
    }
    return groups;
}
/**
 * Step 2: Conflict Resolution & Merging
 * Merges a group of records belonging to one candidate into a single CanonicalProfile.
 */
export function mergeCandidateGroup(group) {
    const merged = {
        candidate_id: crypto.randomUUID(),
        provenance: []
    };
    let totalConfidence = 0;
    let fieldCount = 0;
    // Helper to pick the winning value for a field
    const pickWinner = (field) => {
        let bestValue = undefined;
        let highestTrust = -1;
        let winningSource = '';
        for (const record of group) {
            if (record.profile[field] !== undefined) {
                const trust = TRUST_MATRIX[record.sourceType]?.[field] ?? DEFAULT_TRUST;
                if (trust > highestTrust) {
                    highestTrust = trust;
                    bestValue = record.profile[field];
                    winningSource = record.sourceType;
                }
            }
        }
        if (bestValue !== undefined) {
            merged[field] = bestValue;
            merged.provenance.push({
                field,
                source: winningSource,
                method: `Trust Matrix Score: ${highestTrust}`
            });
            totalConfidence += highestTrust;
            fieldCount++;
        }
    };
    // Run the winner selection for each possible field
    const fieldsToMerge = [
        'full_name', 'emails', 'phones', 'location', 'links',
        'headline', 'years_experience', 'skills', 'experience', 'education'
    ];
    fieldsToMerge.forEach(pickWinner);
    // Calculate overall confidence based on field confidences
    merged.overall_confidence = fieldCount > 0 ? (totalConfidence / fieldCount) : 0;
    return merged;
}
