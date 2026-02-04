/**
 * Get Commit Details - Returns detailed info for a specific commit
 */

import { requireAuth } from './_utils/auth.js';

export default async function handler(req, res) {
    const token = requireAuth(req, res);
    if (!token) return;

    const { repo, owner, sha } = req.query;

    if (!repo || !owner || !sha) {
        return res.status(400).json({ error: 'repo, owner, and sha are required' });
    }

    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'CodePulse'
                }
            }
        );

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch commit details' });
        }

        const commit = await response.json();
        res.json(commit);

    } catch (error) {
        console.error('Commit details fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}
