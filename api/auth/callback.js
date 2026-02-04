/**
 * GitHub OAuth Callback - Handles the redirect from GitHub
 */

export default async function handler(req, res) {
    const { code, error } = req.query;

    if (error) {
        return res.redirect('/?error=auth_denied');
    }

    if (!code) {
        return res.redirect('/?error=no_code');
    }

    try {
        // Exchange code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code: code
            })
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            console.error('Token error:', tokenData.error);
            return res.redirect('/?error=token_error');
        }

        const accessToken = tokenData.access_token;

        // Set the token as an HTTP-only cookie
        res.setHeader('Set-Cookie', [
            `github_token=${accessToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}` // 7 days
        ]);

        // Redirect to dashboard
        res.redirect('/dashboard.html');

    } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect('/?error=server_error');
    }
}
