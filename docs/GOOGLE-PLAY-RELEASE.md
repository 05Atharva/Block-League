# Block League Google Play release checklist

Reviewed 28 November 2026. The release candidate requests an Android App Bundle. Public rollout requires a signed artifact, an approved launch scope and evidence from the intended Play track.

## Deploy the public pages

Set these variables on the hosted Node service. Use the operator identity on the Play listing, a monitored privacy inbox, and the actual retention enforced by hosting and backup operations.

| Variable | Value |
|---|---|
| `BLOCK_LEAGUE_PRIVACY_PUBLISHER` | Public publisher or developer name |
| `BLOCK_LEAGUE_PRIVACY_EMAIL` | Monitored privacy and account-deletion contact |
| `BLOCK_LEAGUE_BACKUP_RETENTION_DAYS` | Maximum backup retention, as a whole number of days |
| `BLOCK_LEAGUE_ACCESS_LOG_RETENTION_DAYS` | Maximum infrastructure access-log retention, as a whole number of days |
| `BLOCK_LEAGUE_PRODUCTION` | `1` for the store backend |
| `DATA_FILE` | Absolute path on the persistent single-writer volume |

The app opens **Privacy policy** from onboarding and **You → Online account & recovery**. The API host serves `/privacy-policy` and `/account-deletion` publicly. The production privacy endpoint returns an unavailable response when the publisher information is missing. Check the retention language, actual data flows and contact inbox against the deployment before publishing. The development preview is for local review. [Play app review and privacy rules](https://support.google.com/googleplay/android-developer/answer/9859455) · [Play account-deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111)

Set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WEB_URL` to the hosted HTTPS origins in EAS. With those same variables set locally, run the read-only endpoint checks before creating a signed candidate.

```powershell
npm run check:play
```

## Android bundle and track

| Owner | Required evidence |
|---|---|
| Mobile release | Build from `app/` using `eas build --platform android --profile production` with the project’s upload signing configuration. Record the AAB SHA-256, certificate fingerprint, actual versionCode, target API and delivered ABIs. The repository package ID is `com.blockleague.pilot`. Confirm it matches the Play listing. |
| Mobile release and Android QA | Validate the bundle, verify API 36+, install generated APK splits, verify native ELF and ZIP alignment for 16 KB, and exercise at least one 16 KB runtime. Inspect the merged permissions. The production build excludes overlay and legacy external-storage permissions. Verify result-card sharing from the app cache on real Android. |
| Backend and Android QA | Use two independent clients and an authorized staging backend. Verify first launch, upgrade with saved progress, live and async Face-Off, tournament entry, share and invite handoff, TalkBack, offline play, interruptions, recovery, and durable match results. Run performance and soak checks on a representative low-end phone. |
| Play Console owner | Confirm developer account type, track eligibility and production access. Applicable new personal accounts require 12 opted-in testers for 14 continuous days. Review the pre-launch report and outstanding warnings. Verify who monitors Android vitals and who can respond to a release incident. |

[Target API rules](https://support.google.com/googleplay/android-developer/answer/11926878) · [Bundletool](https://developer.android.com/tools/bundletool) · [16 KB checks](https://developer.android.com/guide/practices/page-sizes) · [Testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465) · [Pre-launch report](https://support.google.com/googleplay/android-developer/answer/9842757)

## Play Console declarations and listing

| Item | Review and approval required |
|---|---|
| Privacy and deletion | Add the verified policy URL and the separate account deletion URL. Verify both in a signed install and a fresh browser. Exercise deletion with a disposable account. |
| Data safety | Reconcile alias, age group, account and recovery records, cloud progress, invitations, game activity, reports, IP processing, retained shared replays, and hosting logs with the actual SDK inventory and data flows. Verify encryption in transit and retention behavior before declaring them. |
| Audience and Families | Declare the actual intended audience. The production profile keeps ages 7–12 offline and blocks protected online roster entry. Review Families applicability for distribution before any public child-inclusive release. |
| Ads and purchases | The store profile hides simulated commerce and includes no ad or billing provider. Verify the signed artifact and declare what it ships. |
| Reviewer access and rating | Supply a safe reviewer path for private online features, complete the content rating questionnaire and provide a working support contact. Use disposable reviewer accounts and avoid embedding credentials in the listing. |
| Store assets | Approve the title, short and full descriptions, store icon, feature graphic and screenshots from the signed app. Keep claims aligned with the enabled modes and languages. |

Suggested title is **Block League**. Suggested short description is “Place blocks, clear lines and challenge friends in private matches.” Show Solo, the private Face-Off lobby and Club in the listing if each is included in the approved scope.
