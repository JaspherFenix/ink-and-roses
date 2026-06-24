const firebaseSdkVersion = "12.15.0";
const firebaseAppUrl = `https://www.gstatic.com/firebasejs/${firebaseSdkVersion}/firebase-app.js`;
const firebaseFirestoreUrl = `https://www.gstatic.com/firebasejs/${firebaseSdkVersion}/firebase-firestore.js`;

let firebaseServicesPromise = null;

export function hasFirebaseConfig(config) {
  return Boolean(config?.apiKey && config?.authDomain && config?.projectId && config?.appId);
}

async function getFirebaseServices(config) {
  if (!hasFirebaseConfig(config)) {
    return null;
  }

  if (!firebaseServicesPromise) {
    firebaseServicesPromise = Promise.all([
      import(firebaseAppUrl),
      import(firebaseFirestoreUrl),
    ]).then(([appSdk, firestoreSdk]) => {
      const app = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp(config);
      const services = {
        app,
        db: firestoreSdk.getFirestore(app),
        firestoreSdk,
      };

      return services;
    });
  }

  return firebaseServicesPromise;
}

export async function loadFirebaseConfessions(config) {
  const services = await getFirebaseServices(config);

  if (!services) {
    return [];
  }

  const confessionQuery = services.firestoreSdk.query(
    services.firestoreSdk.collection(services.db, "confessions"),
    services.firestoreSdk.orderBy("sealedAt", "desc"),
    services.firestoreSdk.limit(100),
  );
  const snapshot = await services.firestoreSdk.getDocs(confessionQuery);

  return snapshot.docs.map((documentSnapshot) => ({
    ...documentSnapshot.data(),
    id: documentSnapshot.id,
  }));
}

export async function saveFirebaseConfession(config, confession) {
  const services = await getFirebaseServices(config);

  if (!services) {
    return false;
  }

  const confessionReference = services.firestoreSdk.doc(services.db, "confessions", confession.id);

  await services.firestoreSdk.setDoc(confessionReference, {
    ...confession,
    createdAt: services.firestoreSdk.serverTimestamp(),
  });

  return true;
}
