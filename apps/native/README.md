# @raven/native

Capacitor project for the Raven iOS and Android apps. The web content is a
native-mode build of `apps/web` (`VITE_NATIVE=1`, output `apps/web/dist-native`),
served from the app's own origin and working offline. Design:
`docs/superpowers/specs/2026-09-09-native-bundled-design.md`.

## Build & run

```bash
yarn native:build     # apps/web native build → apps/web/dist-native
yarn native:sync      # build + cap sync
yarn native:ios       # cap open → Xcode
yarn native:android   # cap open → Android Studio
cd apps/native && npx cap run android --target <avd>
cd apps/native && npx cap run ios --target <udid>
```

## Local files (gitignored)

- `android/app/google-services.json`, `ios/App/App/GoogleService-Info.plist`: Firebase.
- `android/local.properties`: SDK path.
- `capacitor.config.local.json`: dev overrides, e.g. `server.androidScheme: "http"` so
  the emulator can call a plain-http bench.

## Native sources

- Android: `MainActivity` (system-bar insets, theme canvas, launch-intent replay guard),
  `RavenApplication` (night mode, notification channel), `RavenShellPlugin`
  (foreground notifications, share intake), `ConversationNotification`.
- iOS: `RavenBridgeViewController` (plugin registration, canvas), `SceneDelegate`
  (theme, share extension handoff), `AppDelegate` (APNs token), `RavenShellPlugin`.

Layer 1 of the bundled design: the app boots to a placeholder from `apps/web`.

## Sites and sign-in

- A site is added by origin; the app calls `raven.api.native.handshake` (guest) and
  refuses sites that predate it, sites whose `min_app_version` is newer than the app,
  and sites without an OAuth client that lists `raven.thecommit.company://oauth`.
- Sign-in is OAuth PKCE in the system browser (`@capacitor/browser`); tokens live in the
  keychain per site (`raven.tokens.<origin>`) and are refreshed at 80% of their lifetime
  and once more on a 401. A failed refresh returns to the picker with the site kept.
- API calls use the sdk with a bearer token; the site allows the app's origins through
  `raven.api.native.set_cors` (`before_request`), so sites need no CORS configuration.
- Set up once per site (Raven Settings → OAuth Client):
  `bench --site <site> execute raven.api.raven_mobile.create_oauth_client`.
- Local bench: add `http://10.0.2.2:8004` on the emulator, `http://127.0.0.1:8004` on the
  simulator (ATS exception in `Info.plist`); the site's `developer_mode` allows the
  `http://localhost` origin.

## The app on a remote site

- `src/lib/site.ts` holds the active site: `siteUrl` for site-relative paths, `siteKey` and
  `siteStorage` for per-site localStorage, `siteFetch` for fetches with the bearer token.
  In the browser all of them are the identity.
- Boot comes from `raven.api.native.boot` (`src/native/appBoot.ts`) and the last good copy
  is kept per site for offline starts. The current user comes from boot through
  `src/lib/sessionUser.ts`, which replaces the Frappe cookies.
- Private files (`/private/files/`) cannot carry the token on an `<img>`; `useFileSrc` and
  `FileImage` fetch them with the token into object URLs. Public paths only get the site
  prefix.
- The emoji data file is bundled (`dist-native/emojis.json`); the site's `/assets` are
  served without CORS headers.
- Switch site and log out live on the Profile page.
- Realtime runs through a native socket.io client (`RavenSocketPlugin`, Java and Swift)
  bridged into the sdk's context (`src/native/nativeSocket.ts`). Frappe's realtime server
  only accepts a socket whose `Origin` is the site and calls the site back on that origin,
  which a WebView cannot send; the native client sets `Origin`, `Authorization`, and
  `X-Frappe-Site-Name` itself.
- Local bench on the emulator: `adb reverse tcp:8004 tcp:8004` and `tcp:9004`, then add the
  site as `http://127.0.0.1:8004`. The socket server calls the site back on the origin the
  client sends: `10.0.2.2` is not routable from the host, and the bench's Node resolves
  `localhost` to `::1`, where nothing listens.

## Offline (tier 1)

- Data at rest is kept only in the native app and an installed PWA (`offlineCacheEnabled`).
- Per site: a Dexie database named by the site origin (users, outboxes, and the newest 20
  messages of every visited channel or thread, written through from the message store),
  plus the persisted SWR cache (channel list, workspaces, unread counts, profile) written
  shortly after every change.
- An offline cold start renders boot, the workspace, channels, unread counts, and the
  cached messages; sends queue in the outbox and flush on reconnect; the cached windows
  are never stamped fresh, so the freshness counter refetches them on reconnect.
- Offline signal: `navigator.onLine` (`src/stores/connectionState.ts`) drives the banner,
  the pagination guard, and the static edge rows in the stream.
