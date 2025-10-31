import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
  MASTER_EMAIL,
  MASTER_PASSWORD,
  MASTER_DISPLAY_NAME = "Master Admin",
} = process.env;

function ensureEnv(value, name) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

ensureEnv(FIREBASE_PROJECT_ID, "FIREBASE_PROJECT_ID");
ensureEnv(FIREBASE_CLIENT_EMAIL, "FIREBASE_CLIENT_EMAIL");
ensureEnv(FIREBASE_PRIVATE_KEY, "FIREBASE_PRIVATE_KEY");
ensureEnv(MASTER_EMAIL, "MASTER_EMAIL");
ensureEnv(MASTER_PASSWORD, "MASTER_PASSWORD");

initializeApp({
  credential: cert({
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const auth = getAuth();
const db = getFirestore();

const ISO = () => new Date().toISOString();

async function ensureMaster() {
  const existingMasters = await db
    .collection("users")
    .where("role", "==", "master")
    .limit(1)
    .get();

  if (!existingMasters.empty) {
    console.log("Master user already exists. Skipping creation.");
    return;
  }

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(MASTER_EMAIL);
    console.log("User already existed. Promoting to master...");
  } catch {
    userRecord = await auth.createUser({
      email: MASTER_EMAIL,
      password: MASTER_PASSWORD,
      displayName: MASTER_DISPLAY_NAME,
    });
    console.log(`User created: ${userRecord.uid}`);
  }

  await auth.updateUser(userRecord.uid, {
    displayName: MASTER_DISPLAY_NAME,
  });

  const userDoc = db.collection("users").doc(userRecord.uid);
  const snapshot = await userDoc.get();
  const now = ISO();

  const baseData = snapshot.exists ? snapshot.data() : {};

  await userDoc.set(
    {
      id: userRecord.uid,
      email: MASTER_EMAIL,
      displayName: MASTER_DISPLAY_NAME,
      locale: "pt",
      role: "master",
      status: "active",
      families: baseData?.families ?? [],
      billing: baseData?.billing ?? null,
      createdAt: baseData?.createdAt ?? now,
      updatedAt: now,
      lastSignInAt: now,
    },
    { merge: true },
  );

  console.log("Master profile ensured in Firestore.");
}

ensureMaster()
  .then(() => {
    console.log("Bootstrap completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Bootstrap failed:", error);
    process.exit(1);
  });
