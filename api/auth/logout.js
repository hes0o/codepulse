/**
 * Logout - Clears the authentication cookie
 */

export default function handler(req, res) {
    // Clear the token cookie
    res.setHeader('Set-Cookie', [
        'github_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
    ]);

    // Redirect to home page
    res.redirect('/');
}
