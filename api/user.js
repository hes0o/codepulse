/**
 * Get User - Returns authenticated user info
 */

import { requireAuth } from './_utils/auth.js';

export default async function handler(req, res) {
    const token = requireAuth(req, res);
    if (!token) return;

    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'CodePulse'
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch user' });
        }

        const user = await response.json();
        res.json(user);

    } catch (error) {
        console.error('User fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}
