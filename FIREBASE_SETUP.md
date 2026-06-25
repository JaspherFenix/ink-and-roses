# Firebase setup

The repository is connected to the `ink-and-roses` Firebase project.

Required Firebase console settings:

1. Create a Cloud Firestore database.
2. The Web app configuration is stored in `firebase-config.js`.

Deploy Hosting and Firestore rules with:

```bash
firebase deploy
```

New confessions are stored in the `confessions` collection. Sketches use normalized
stroke points, not image data. Firestore is the sole confession data source; the
rules allow validated anonymous creates, public reads, and no client updates or deletes.

The homepage does not read confession documents. Search results use the normalized
`recipientSearch` field and load eight documents per page, while opened letters fetch
only the selected confession document.
