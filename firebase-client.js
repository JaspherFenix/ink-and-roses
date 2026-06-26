const firebaseSdkVersion = "12.15.0";
const firebaseAppUrl = `https://www.gstatic.com/firebasejs/${firebaseSdkVersion}/firebase-app.js`;
const firebaseFirestoreUrl = `https://www.gstatic.com/firebasejs/${firebaseSdkVersion}/firebase-firestore.js`;

let firebaseServicesPromise = null;

export function hasFirebaseConfig(config) {
  return Boolean(config?.apiKey && config?.authDomain && config?.projectId && config?.appId);
}

export function normalizeRecipientSearch(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("en")
    .replace(/\s+/g, " ")
    .slice(0, 80);
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

export async function searchFirebaseConfessions(
  config,
  {
    searchTerm = "",
    pageSize = 8,
    startAfterDocument = null,
  } = {},
) {
  const normalizedSearch = normalizeRecipientSearch(searchTerm);

  if (!normalizedSearch) {
    return {
      items: [],
      hasMore: false,
      nextCursor: null,
    };
  }

  const services = await getFirebaseServices(config);

  if (!services) {
    return {
      items: [],
      hasMore: false,
      nextCursor: null,
    };
  }

  const constraints = [
    services.firestoreSdk.where("recipientSearch", ">=", normalizedSearch),
    services.firestoreSdk.where("recipientSearch", "<=", `${normalizedSearch}\uf8ff`),
    services.firestoreSdk.orderBy("recipientSearch", "asc"),
  ];

  if (startAfterDocument) {
    constraints.push(services.firestoreSdk.startAfter(startAfterDocument));
  }

  constraints.push(services.firestoreSdk.limit(pageSize + 1));

  const confessionQuery = services.firestoreSdk.query(
    services.firestoreSdk.collection(services.db, "confessionIndex"),
    ...constraints,
  );
  const snapshot = await services.firestoreSdk.getDocs(confessionQuery);
  const visibleDocuments = snapshot.docs.slice(0, pageSize);
  const hasMore = snapshot.docs.length > pageSize;

  return {
    items: visibleDocuments.map((documentSnapshot) => ({
      ...documentSnapshot.data(),
      id: documentSnapshot.id,
    })),
    hasMore,
    nextCursor: hasMore ? visibleDocuments[visibleDocuments.length - 1] : null,
  };
}

export async function loadFirebaseConfession(config, confessionId) {
  const services = await getFirebaseServices(config);

  if (!services || !confessionId) {
    return null;
  }

  const confessionReference = services.firestoreSdk.doc(services.db, "confessions", confessionId);
  const snapshot = await services.firestoreSdk.getDoc(confessionReference);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    ...snapshot.data(),
    id: snapshot.id,
  };
}

export async function saveFirebaseConfession(config, confession) {
  const services = await getFirebaseServices(config);

  if (!services) {
    return false;
  }

  const confessionReference = services.firestoreSdk.doc(services.db, "confessions", confession.id);
  const createdAt = services.firestoreSdk.serverTimestamp();

  await services.firestoreSdk.setDoc(confessionReference, {
    ...confession,
    status: "pending",
    createdAt,
  });

  return true;
}
