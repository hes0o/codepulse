/**
 * Utility functions for authentication
 */

export function getTokenFromCookies(req) {
    const cookies = req.headers.cookie || '';
    const tokenMatch = cookies.match(/github_token=([^;]+)/);
    return tokenMatch ? tokenMatch[1] : null;
}

export function requireAuth(req, res) {
    const token = getTokenFromCookies(req);

    if (!token) {
        res.status(401).json({ error: 'Authentication required' });
        return null;
    }

    return token;
}
