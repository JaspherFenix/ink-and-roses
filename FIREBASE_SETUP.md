# Firebase setup

The repository is connected to the `ink-and-roses` Firebase project.

Required Firebase console settings:

1. Create a Cloud Firestore database.
2. Enable Anonymous authentication in Firebase Authentication.
3. The Web app configuration is stored in `firebase-config.js`.

Deploy Hosting and Firestore rules with:

```bash
firebase deploy
```

New confessions are stored in the `confessions` collection. Sketches use normalized
stroke points, not image data. If Firebase is unavailable or not configured, the
site continues to use browser local storage.
