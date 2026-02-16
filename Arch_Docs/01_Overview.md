1. Overview
Problem Statement:
Up Bank's native mobile app lacks a web/desktop version, and users want to:

Track spending across multiple categories simultaneously
See "Spendable" balance after accounting for upcoming bills
Monitor saver goals with progress tracking
View detailed spending insights on larger screens

Solution:
Vantura is a local-first PWA that syncs with Up Bank's API and provides:

✅ Desktop-optimized interface (13"-27"+ screens)
✅ All data stored locally (SQLite in browser)
✅ Multi-category spending trackers
✅ Spendable balance with prorated upcoming charges
✅ Saver goal tracking with auto-transfer monitoring
✅ Weekly/monthly spending insights
✅ Dark/Light theme
✅ No hosting costs (GitHub Pages)
✅ Privacy-first: API token encrypted with a key derived from a user passphrase (passphrase never stored; token cannot be decrypted without it). Data stored in SQLite in the browser (IndexedDB); the token is never visible or accessible after first entry without the user's passphrase.