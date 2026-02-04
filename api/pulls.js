/**
 * Get Pull Requests - Returns PRs for a repository
 */

import { requireAuth } from './_utils/auth.js';

export default async function handler(req, res) {
    const token = requireAuth(req, res);
    if (!token) return;

    const { repo, owner, state = 'all' } = req.query;

    if (!repo || !owner) {
        return res.status(400).json({ error: 'repo and owner are required' });
    }

    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/pulls?state=${state}&per_page=30`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'CodePulse'
                }
            }
        );

        if (!response.ok) {
            if (response.status === 404) {
                return res.json([]);
            }
            return res.status(response.status).json({ error: 'Failed to fetch pull requests' });
        }

        const prs = await response.json();
        res.json(prs);

    } catch (error) {
        console.error('Pull requests fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}
