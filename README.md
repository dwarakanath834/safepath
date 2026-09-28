# SafePath

SafePath is a responsive route-planning project that combines OpenStreetMap, Nominatim place search, OpenStreetMap's public foot-routing service, Open-Meteo weather, and optional Supabase authentication and storage. It is a demonstration and does not provide emergency dispatch or guarantee personal safety.

## Features

- Landing page, account registration/login, dashboard, route planning and comparison, safety analysis, SOS options, emergency contacts, temporary sharing, saved routes, reports/reviews, nearby places, weather, profile, and admin views.
- Browser geolocation, OSM map, Nominatim destination lookup, public walking routes, and Open-Meteo forecast.
- Safety factors remain unavailable unless supported by actual records. Weather is informational; no crime, lighting, crowd, or danger-zone data is fabricated.
- With Supabase configured, authentication and user-owned database records are used. Without it, account access is unavailable and personal demo records remain in this browser only.

## Requirements and setup

- Node.js 20.9 or later and npm.
- Copy `.env.local.example` to `.env.local` and add a Supabase project URL and anon/publishable key to enable authentication and cloud storage. Do not use a service-role key in the browser.
- Run the SQL in `supabase/schema.sql` in the Supabase SQL editor. Enable email/password authentication. Review the admin role and policies before deploying.

```powershell
npm install
npm run dev
npm run typecheck
npm run build
```

Visit http://localhost:3000. `npm run start` serves a production build.

## External services

- OpenStreetMap tiles and Nominatim are public community services. Respect the Nominatim usage policy; this app debounces search and should not be used for high-volume geocoding.
- Walking routes use the public `routing.openstreetmap.de` foot profile. Public endpoints can throttle or be unavailable; errors are shown rather than replaced with synthetic success.
- Open-Meteo provides forecast conditions, not emergency alerts.
- Supabase is optional for local exploration, but required for real accounts and shared, authenticated user data.

## Limitations and safety

No verified crime, street-light, crowd, or danger-zone dataset is bundled. Consequently, the app does not claim a route is safe and shows those factors as unavailable. Weather does not indicate personal security. SOS only presents user-controlled phone/contact/sharing options; it never automatically contacts authorities. Temporary sharing is an opt-in link and must be configured with a protected server-side token workflow before production use. Admin screens are a demonstration until the server-side role checks/policies are configured. Do not rely on this project for emergency response or personal-safety decisions.