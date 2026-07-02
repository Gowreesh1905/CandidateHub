"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubApiIngestor = void 0;
class GithubApiIngestor {
    sourceType = 'GitHub API';
    async ingest(filePathOrUrl) {
        try {
            if (!filePathOrUrl.startsWith('http://') && !filePathOrUrl.startsWith('https://')) {
                throw new Error("GitHub ingestor requires a valid HTTP URL.");
            }
            // Extract username from standard Github URL (e.g., https://github.com/torvalds)
            const urlParts = new URL(filePathOrUrl);
            const pathSegments = urlParts.pathname.split('/').filter(Boolean);
            let username = pathSegments[0];
            let apiUrl = filePathOrUrl;
            // If they passed a normal github profile URL, convert it to the API URL
            if (urlParts.hostname === 'github.com' || urlParts.hostname === 'www.github.com') {
                if (!username) {
                    throw new Error("Could not parse username from GitHub URL");
                }
                apiUrl = `https://api.github.com/users/${username}`;
            }
            const response = await fetch(apiUrl, {
                headers: {
                    'User-Agent': 'CandidateHub-Transformer (Node.js)'
                }
            });
            if (!response.ok) {
                throw new Error(`GitHub API returned HTTP ${response.status}`);
            }
            const githubData = await response.json();
            return [{
                    sourceType: this.sourceType,
                    sourceName: filePathOrUrl,
                    profile: {
                        full_name: githubData.name || githubData.login || 'Unknown GitHub User',
                        emails: githubData.email ? [githubData.email] : undefined,
                        experience: [{
                                company: githubData.company || 'GitHub (Open Source)',
                                title: 'Developer',
                                start: githubData.created_at || 'Unknown'
                            }]
                    }
                }];
        }
        catch (error) {
            console.warn(`\n⚠️ [GitHub Ingestor Warning] Failed to ingest ${filePathOrUrl}: ${error.message}`);
            return []; // Graceful degradation
        }
    }
}
exports.GithubApiIngestor = GithubApiIngestor;
