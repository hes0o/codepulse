/**
 * Auth Status - Check if user is authenticated
 */

import { getTokenFromCookies } from '../_utils/auth.js';

export default async function handler(req, res) {
    const token = getTokenFromCookies(req);

    if (!token) {
        return res.json({ authenticated: false });
    }

    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (response.ok) {
            return res.json({ authenticated: true });
        }
    } catch (error) {
        console.error('Auth status check failed:', error);
    }

    return res.json({ authenticated: false });
}
