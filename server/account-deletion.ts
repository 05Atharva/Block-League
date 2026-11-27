export function deletionPage(state?: "deleted" | "error") {
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Delete your Block League account</title>
<style>
  :root { font: 1rem/1.55 system-ui, sans-serif; color: #261d2c; background: #f7f2ea }
  main { max-width: 34rem; margin: 4vh auto; padding: 1.25rem }
  h1 { line-height: 1.15 }
  form { display: grid; gap: 1rem; padding: 1.2rem; background: #fffdf8; border: 1px solid #dcd2d8; border-radius: 1rem }
  input, button { font: inherit }
  input[type=password] { box-sizing: border-box; width: 100%; padding: .7rem; border: 1px solid #625663; border-radius: .5rem }
  button { min-height: 3.25rem; padding: .7rem 1rem; color: white; background: #8c3040; border: 0; border-radius: .5rem; cursor: pointer }
  :focus-visible { outline: 3px solid #272080; outline-offset: 3px }
  [role=alert] { color: #8c3040 }
</style>
<main>
  <p><strong>Block League</strong></p>
  <h1>Delete your Block League account</h1>
  ${
    state === "deleted"
      ? `<p role="status">Your online account was deleted and all sessions were signed out.</p>
  <p>To remove an offline copy, select that profile in the game and choose <strong>You → Family profiles → Remove profile from this device</strong>.</p>`
      : `
  <p>Use the private recovery key from <strong>You → Online account &amp; recovery</strong>. If you are signed in, you can also delete the account directly there.</p>
  <p>Deletion removes your account details and cloud progress. Other players can still see their shared scores and replays with your identity replaced by “Deleted player”.</p>
  ${state === "error" ? '<p role="alert">The account was not deleted. Check your recovery key and confirmation, or try again later.</p>' : ""}
  <form method="post" action="/account-deletion">
    <label for="recovery">Private recovery key</label>
    <input id="recovery" name="recovery" type="password" required maxlength="64" autocomplete="off" spellcheck="false">
    <label><input type="checkbox" name="confirm" value="yes" required> Permanently delete this online account</label>
    <button type="submit">Delete account</button>
  </form>`
  }
  <p><a href="/privacy-policy">Block League privacy policy</a></p>
</main>
</html>`;
}
