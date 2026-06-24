# Firebase setup

1. Create a Firebase project and register a Web app.
2. Create a Cloud Firestore database.
3. Enable Anonymous authentication in Firebase Authentication.
4. Copy the Web app configuration into `firebase-config.js`.
5. Deploy `firestore.rules` from the Firebase console or with:

```bash
firebase deploy --only firestore:rules
```

New confessions are stored in the `confessions` collection. Sketches use normalized
stroke points, not image data. If Firebase is unavailable or not configured, the
site continues to use browser local storage.
