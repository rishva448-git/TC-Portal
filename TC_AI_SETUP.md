# TC AI Configuration

TC AI's editable company facts and role starter guidance are centralized in `lib/tc-ai/company-knowledge.ts`. Role guidance is explicitly marked as a starting template, not verified company policy.

## Verified YouTube Research

Current YouTube research requires the server-side `YOUTUBE_API_KEY` environment variable for YouTube Data API v3. TC AI verifies candidates with the YouTube video details endpoint and oEmbed, checks declared Tamil audio language when Tamil is requested, removes duplicate video IDs, and omits unverified results.

Without the key, research reports that it is unavailable; it does not invent video links. Do not expose the key through a `NEXT_PUBLIC_` variable or store it in company knowledge.

## Confirmations

Sensitive and bulk action confirmations are stored in `SystemSetting` as short-lived, single-use tickets bound to the authenticated administrator. Production deployments must set a strong `JWT_SECRET` or a dedicated `TC_AI_CONFIRMATION_SECRET`; confirmations fail closed without one.