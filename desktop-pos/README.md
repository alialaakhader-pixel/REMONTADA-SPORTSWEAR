# REMONTADA POS

Windows desktop point-of-sale app for REMONTADA SPORTSWEAR.

## Current capabilities
- Windows 10 and Windows 11 installer and portable build.
- Local SQLite database stored in the current Windows user's application-data folder.
- Product and variant catalog cached locally.
- Offline sales, receipts, and stock receiving are saved locally in SQLite.
- Every sale/restock creates a unique sync event; the queue retries when the admin session and internet connection are available.
- Central inventory changes are atomic and idempotent when synced.
- Model codes are assigned centrally and remain stable: one short number per product/design/color (for example `102`), with size suffixes such as `102-S`, `102-M`, `102-L`.
- Search supports product name, model number, and full size code.
- Standard Windows printing is available through the print dialog. A USB barcode scanner can be used later as keyboard input; dedicated receipt-printer support is a follow-up.

## First setup
1. Install and open REMONTADA POS while the shop PC is online.
2. Sign in with the existing REMONTADA administrator account. This first online sign-in activates the local offline workspace.
3. The app saves a salted password hash locally (not the raw password) for offline unlock.
4. Press **مزامنة** and wait until the catalog and stock are loaded.
5. After this initial setup, sales and stock receiving can be recorded without internet. Pending movements sync when connectivity returns.

## Important stock behavior
The shop PC is the local offline record while disconnected. The website cannot see a shop sale until the PC reconnects and syncs it. To avoid selling the same stock twice, the website's online checkout is enabled only while the shop POS has checked in recently; if the POS is offline, website checkout pauses until the POS reconnects. Online orders and connected POS sales reserve stock centrally.

Keep the shop PC and its Windows user account protected. The offline workspace is intended for the shop computer and should not be used on a shared public PC.

## Build
From this folder:
```bash
npm install
npm run dist:win
```
The build produces an NSIS installer and a portable EXE under `release/`.
