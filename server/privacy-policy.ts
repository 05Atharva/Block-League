function escapeHtml(text: string) {
  return text.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
}

export function privacyOperator(env: NodeJS.ProcessEnv) {
  const publisher = env.BLOCK_LEAGUE_PRIVACY_PUBLISHER?.trim();
  const email = env.BLOCK_LEAGUE_PRIVACY_EMAIL?.trim();
  const backups = env.BLOCK_LEAGUE_BACKUP_RETENTION_DAYS?.trim() || "";
  const logs = env.BLOCK_LEAGUE_ACCESS_LOG_RETENTION_DAYS?.trim() || "";
  const backupDays = Number(backups);
  const accessLogDays = Number(logs);
  if (
    !publisher ||
    !email ||
    !/^[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email) ||
    !/^\d+$/.test(backups) ||
    !/^\d+$/.test(logs) ||
    !Number.isSafeInteger(backupDays) ||
    backupDays < 0 ||
    !Number.isSafeInteger(accessLogDays) ||
    accessLogDays < 0
  )
    return undefined;
  return { publisher, email, backupDays, accessLogDays };
}

export function privacyPolicyPage(
  operator: ReturnType<typeof privacyOperator>,
) {
  const contact = operator
    ? `<p>Block League is operated by ${escapeHtml(operator.publisher)}. For privacy questions or help with account deletion, email <a href="mailto:${escapeHtml(operator.email)}">${escapeHtml(operator.email)}</a>.</p>`
    : "<p>This is a development preview. The release operator’s identity, contact and retention periods must be supplied before publication.</p>";
  const retention = operator
    ? `<p>Infrastructure access logs are retained for up to ${operator.accessLogDays} days. Deleted account data may remain in restricted backups for up to ${operator.backupDays} days before those copies are rotated out.</p>`
    : "<p>Backup and infrastructure log retention depend on the hosting configuration.</p>";
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Block League Privacy Policy</title>
<style>
  :root { color-scheme: light dark; font: 1rem/1.65 system-ui,sans-serif; color: #261d2c; background: #f7f2ea }
  main { width: min(100% - 2rem, 43rem); margin: 2.5rem auto 4rem }
  h1,h2 { line-height: 1.15; margin: 1.5em 0 .55em }
  h1 { font-size: clamp(2rem,8vw,3.25rem); margin-top: .35em }
  h2 { font-size: 1.35rem }
  a { color: #7b3753; text-underline-offset: .2em; overflow-wrap: anywhere }
  :focus-visible { outline: 3px solid #272080; outline-offset: 3px }
  @media (prefers-color-scheme: dark) {
    :root { color: #fff5ed; background: #17131d }
    a { color: #ffb29b }
    :focus-visible { outline-color: #dfef9d }
  }
</style>
<main>
  <p><strong>Block League</strong></p>
  <h1>Privacy policy</h1>
  <p>Last updated 28 November 2026</p>
  ${contact}

  <h2>What the game stores</h2>
  <p>The game stores your chosen alias and age group, preferences, solo progress and saved boards on your device. Solo, practice and pass-and-play can be used without an online account. Use an alias that does not reveal your real name.</p>
  <p>If you use an online account, the service stores your alias and age group, cloud saves, authentication records, private invitations, league and roster membership, accepted moves and results, reactions, and reports you submit. Protected pilot accounts may also store guardian approval settings and a protected PIN record. Connection information, including IP addresses, may be processed to operate the service and limit abuse.</p>

  <h2>How we use and share it</h2>
  <p>We use this data to restore progress, enforce access rules, verify moves and results, run private competitions, and investigate reports and service problems. Invited players and eligible teammates can see the aliases and results needed for shared games. Hosting, backup and support providers may process data on behalf of the operator for those functions. Relevant data may be disclosed when required by law.</p>
  <p>The Google Play game does not include an advertising or purchase provider. Sharing is optional. When you export a card, copy an invitation, or use the share sheet, the recipients and apps you choose can process that content under their own policies.</p>

  <h2>Retention and deletion</h2>
  <p>Account data and progress are kept while the online account is active so you can return to the game and recover your progress. Delete the account in the game under <strong>You → Online account &amp; recovery</strong>, or use the <a href="/account-deletion">account deletion page</a> with your recovery key.</p>
  <p>Deletion removes the account’s profile details and cloud progress, invalidates sign-in sessions and the recovery key, and removes account reports and reactions. Other players keep their shared competition records and replays with the deleted account labelled “Deleted player”. Local profiles and files you exported can remain on devices where they were stored. Remove individual profiles under <strong>You → Family profiles</strong>.</p>
  ${retention}

  <h2>Security and younger players</h2>
  <p>The store build uses an encrypted HTTPS connection to the service. Keep your recovery key private because it grants access to your account. You can contact the operator for help with your information, corrections or deletion.</p>
  <p>In the store release, ages 7–12 stay offline. Local family play remains available. Age groups are self-declared.</p>
</main>
</html>`;
}
