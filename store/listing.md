# Store listing text

Copy these into the Chrome Web Store and Firefox Add-ons forms.

## Name
Shortcut Keys for Gmail

## Summary (Chrome "Summary", Firefox "Summary"; 132 characters max)
Delete, archive and undo in Gmail with familiar keys, and map any key to any Gmail action.

## Description

Work through your Gmail inbox with the keys your hands already know.

DEFAULT SHORTCUTS
• delete / Delete: delete the selected or open email
• ⌘ ← (Ctrl+← on Windows and Linux): archive
• ⌘ Z (Ctrl+Z on Windows and Linux): undo the last action, using Gmail's own Undo

MAKE IT YOURS
Open the settings page from the toolbar icon to map any key combination to any of 24 Gmail actions:
archive, delete, undo, mark as read or unread, report spam, star, mark important, mute, snooze, move to, label, reply, reply all, forward, compose, newer or older conversation, back to list, search, and go to Inbox, Sent, Starred or Drafts.

STAYS OUT OF YOUR WAY
• Shortcuts never fire while you type in a compose window, a reply, the search box or any other text field, including during Japanese, Chinese or Korean input.
• Holding a key down runs the action once, so you can't wipe your inbox by accident.
• One switch turns everything off.
• Settings sync across your browsers. A shortcut set on a Mac with ⌘ uses Ctrl on Windows and Linux.

PRIVATE BY DESIGN
No data collection, no analytics, no network requests. The extension only runs on mail.google.com and only clicks Gmail's own buttons for you.

Tip: a few actions (star, reply, newer/older and others) use Gmail's built-in keyboard shortcuts behind the scenes. If one does nothing, turn on Gmail Settings → See all settings → General → Keyboard shortcuts on.

Open source: https://github.com/semicolonconsulting/mygmailshortcutkeys

Not affiliated with or endorsed by Google. Gmail is a trademark of Google LLC.

## Category
- Chrome Web Store: Productivity → Communication (or "Workflow & Planning")
- Firefox Add-ons: Social & Communication

## Links
- Homepage / support: https://github.com/semicolonconsulting/mygmailshortcutkeys
- Privacy policy: https://github.com/semicolonconsulting/mygmailshortcutkeys/blob/main/PRIVACY.md

## Chrome Web Store "Privacy practices" tab

**Single purpose**
Adds customizable keyboard shortcuts to Gmail (delete, archive, undo and other Gmail actions).

**Permission justification**
- `storage`: Saves the user's shortcut settings (which key runs which action) and the on/off switch.
- Host permission `https://mail.google.com/*` (content script): The shortcuts run inside Gmail. The script listens for the user's configured keys and clicks the matching Gmail toolbar button. It does not read email content.

**Remote code:** No, I am not using remote code.

**Data usage:** Tick nothing. The extension collects none of the listed data types.
Tick all three certifications (no selling data, no unrelated use, no creditworthiness use).

## Firefox Add-ons extra answers
- "Does this add-on require source code?" No. The package is the plain source, not minified or bundled.
- License: MIT
- Data collection: the manifest already declares `data_collection_permissions: none`.
- Notes to reviewer: "No build step; files in the zip are the source as written. Test on https://mail.google.com: select an email and press Delete, Ctrl/⌘+← (archive), Ctrl/⌘+Z (undo). Settings page: toolbar icon."
