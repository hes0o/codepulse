/**
 * Get Commits - Returns commits for a specific repository
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
            `https://api.github.com/repos/${owner}/${repo}/commits?per_page=30`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'CodePulse'
                }
            }
        );

        if (!response.ok) {
            // It's okay if we can't get commits for some repos (empty repos, etc.)
            if (response.status === 409) {
                return res.json([]);
            }
            return res.status(response.status).json({ error: 'Failed to fetch commits' });
        }

        const commits = await response.json();
        res.json(commits);

    } catch (error) {
        console.error('Commits fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}
