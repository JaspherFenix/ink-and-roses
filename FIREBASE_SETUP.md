# Firebase setup

The repository is connected to the `ink-and-roses` Firebase project.

Required Firebase console settings:

1. Create a Cloud Firestore database.
2. The Web app configuration is stored in `firebase-config.js`.

Deploy Hosting and Firestore rules with:

```bash
firebase deploy
```

Full letters are stored in the `confessions` collection. Search summaries are stored
separately in `confessionIndex` with only the recipient, normalized recipient, and
sealed date. Sketches use normalized stroke points, not image data.

The homepage does not read Firestore. Search results load eight small index documents
per page. Opened letters fetch only the selected full confession. Firestore rules block
all collection queries against full messages and sketches.
