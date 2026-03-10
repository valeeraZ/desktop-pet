# Desktop Pet MVP (Chrome Extension)

This is the first MVP implementation for the desktop pet concept.

## What is implemented

- Upload one pet image from popup UI.
- Save normalized pet profile to `chrome.storage.local`.
- Spawn a floating pet panel on regular webpages.
- Basic pet behavior state machine: `idle`, `walk`, `jump`.
- Basic interactions:
  - Click pet to trigger a jump.
  - Toggle `Toy` mode and move cursor in panel to make pet chase.
- Drag panel by header, pause/resume animation, close panel.

## How to run

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select this folder:
   - `/Users/sylvain/Work/desktop-pet/desktop-pet-extension`
5. Open any `http` or `https` website.
6. Open extension popup, upload image, click `Show pet`.

## MVP constraints

- Image input only (video and AI auto rigging are not included yet).
- Single pet instance.
- Animation is template-driven (state machine + physics), not AI-generated motion.
