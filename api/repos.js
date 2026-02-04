/**
 * Get Repos - Returns user's repositories
 */

import { requireAuth } from './_utils/auth.js';

export default async function handler(req, res) {
    const token = requireAuth(req, res);
    if (!token) return;

    try {
        const response = await fetch('https://api.github.com/user/repos?sort=pushed&per_page=50', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'CodePulse'
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch repos' });
        }

        const repos = await response.json();
        res.json(repos);

    } catch (error) {
        console.error('Repos fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}
