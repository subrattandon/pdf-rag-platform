# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please email: [your-security-email@example.com]

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide a resolution timeline within 7 days.

## Security Practices

- All secrets are stored in environment variables (never committed to source control)
- JWT tokens are verified against Clerk's JWKS endpoint
- Database connections use parameterized queries (SQLAlchemy)
- File uploads are validated and stored securely
- API endpoints require authentication by default
- CORS is restricted to configured origins

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | Yes       |
| < Latest | No       |

## Scope

This security policy applies to the code in this repository. For issues with third-party services (Clerk, OpenRouter, Qdrant, Stripe), please contact those providers directly.
