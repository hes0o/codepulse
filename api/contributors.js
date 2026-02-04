/**
 * Get Contributors - Returns contributors for a specific repository
 */

import { requireAuth } from './_utils/auth.js';

export default async function handler(req, res) {
    const token = requireAuth(req, res);
    if (!token) return;

    const { repo, owner } = req.query;

    if (!repo || !owner) {
        return res.status(400).json({ error: 'repo and owner are required' });
    }

    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=30`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'CodePulse'
                }
            }
        );

        if (!response.ok) {
            // It's okay if we can't get contributors for some repos
            return res.json([]);
        }

        const contributors = await response.json();
        res.json(contributors);

    } catch (error) {
        console.error('Contributors fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}
