# A¡R\x/

> **Instant, friction-free online image clipboard for cross-device sharing.**

# A¡R\x/ is a lightweight web application that lets you move visual content between computers, phones, and tablets in seconds. Simply paste (`Ctrl+V`) or drop an image into a room to generate a temporary clipboard space and a unique QR code for instant mobile access.

---

## 🌟 Key Features

* **Zero Login Required:** Jump straight into a clean canvas without creating accounts or setting up permissions.
* **Human-Readable Room Codes:** Generates memorable room handles (e.g., `touch7931`, `nano5491`, `ghost8124`) instead of random cryptic hashes.
* **Instant QR Code Generation:** Automatically generates a dynamic QR code for every room so phones can join with a single scan.
* **Full Image Control Bar:** Dedicated action buttons to **Copy** directly to system clipboard, **Refresh** room content, **Save** locally, or **Clear** the canvas.
* **Universal Clipboard Listening:** Global paste handler catches `Ctrl+V` input anywhere on the page.

---

## 📁 Project Structure

```text
airx-clipboard/
├── index.html        # Main interface and UI layout
├── style.css        # Custom styles and drag-and-drop feedback
├── script.js        # App state, room generator, clipboard logic, QR rendering
├── README.md        # Documentation and overview
└── .gitignore       # Git exclusion rules
