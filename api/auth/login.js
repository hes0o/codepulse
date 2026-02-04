/**
 * GitHub OAuth Login - Redirects to GitHub for authentication
 */

export default function handler(req, res) {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = `${process.env.APP_URL}/api/auth/callback`;
    const scope = 'read:user repo';

    if (!clientId) {
        return res.status(500).json({
            error: 'GitHub OAuth not configured. Set GITHUB_CLIENT_ID environment variable.'
        });
    }

    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('state', generateState());

    res.redirect(authUrl.toString());
}

function generateState() {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
}
