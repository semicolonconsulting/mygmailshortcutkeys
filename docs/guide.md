# Guide

## Requirements

- Chrome, Edge, Brave or another Chromium browser, or Firefox 128 or later.
- Gmail in the browser at `mail.google.com`.
- For some actions, Gmail's own keyboard shortcuts must be on (see below).

## Default shortcuts

| Key (macOS) | Key (Windows / Linux) | Action |
|---|---|---|
| `delete` (Backspace) or `fn`+`delete` | `Delete` or `Backspace` | Delete the selected or open email |
| `⌘` `←` | `Ctrl` `←` | Archive |
| `⌘` `Z` | `Ctrl` `Z` | Undo the last action (clicks Gmail's own Undo) |

## Customizing

Click the extension's toolbar icon to open the settings page. Any key combination
can be mapped to any of 24 actions: archive, delete, undo, read/unread, spam, star,
important, mute, snooze, move, label, reply, reply all, forward, compose,
newer/older, back to list, search, and go to Inbox/Sent/Starred/Drafts.
Settings sync through your browser account.

Shortcuts never fire while you are typing: compose, inline replies, To/Cc fields,
the search box, any text field, and during IME composition (e.g. Japanese input).
Holding a key down does not repeat the action.

## How actions run

Each action tries, in order (see `src/content/actions.js`):

1. A direct method where one exists (Undo link in Gmail's notification bar, the
   search box, `#inbox`-style navigation).
2. Clicking the visible Gmail toolbar button, matched by its English label and
   then by Gmail's language-independent `act` code.
3. Sending Gmail's own keyboard shortcut (`#`, `e`, `z`, `s`, …). This needs
   **Gmail Settings → See all settings → General → Keyboard shortcuts on**.
   Star, important, mute, reply, reply all, forward, and newer/older always use
   this route.

Gmail changes its markup from time to time; if an action stops working, step 2
is the usual culprit and step 3 keeps it working when shortcuts are on.
