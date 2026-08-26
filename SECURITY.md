# Security Policy

## Reporting a vulnerability

Report vulnerabilities through [GitHub private vulnerability reporting](https://github.com/thiagocbarreto/pi-timestamp-context/security/advisories/new). Do not open a public issue for a security-sensitive report.

Include the affected version, impact, reproduction steps, and any known mitigation.

## Security model

[Pi packages](https://pi.dev/docs/latest/packages) run inside Pi with the current user's permissions. Install packages only from sources you trust.

Pi Timestamp Context reads timestamps from Pi's in-memory message context and adds timestamp metadata to the temporary context sent to the selected model provider. Sending this metadata to the provider is expected behavior.

The extension does not access the filesystem, start processes, make network requests, read environment variables, create timers, or persist data.
