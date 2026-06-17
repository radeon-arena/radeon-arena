// Seed Firestore with the real InferStation RDNA benchmark dataset.
//
// Requires Firebase Admin credentials, provided via either:
//   GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json   pnpm seed
//   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'      pnpm seed
//
// Without credentials the site still serves the same real dataset directly
// from loadInferStationBenchmarks() (no backend required).
import { initializeApp, cert, applicationDefault, type Credential } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { loadInferStationBenchmarks } from "../src/lib/inferstationData";

function credential(): Credential | null {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (inline) {
    try {
      return cert(JSON.parse(inline));
    } catch (e) {
      console.error("Invalid FIREBASE_SERVICE_ACCOUNT JSON:", e);
      return null;
    }
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return applicationDefault();
  return null;
}

async function main() {
  const cred = credential();
  if (!cred) {
    console.error("No Firebase Admin credentials found. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT.");
    process.exit(1);
  }

  initializeApp({ credential: cred, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
  const db = getFirestore();

  const benchmarks = loadInferStationBenchmarks();
  console.log(`Seeding ${benchmarks.length} benchmarks into Firestore…`);

  let batch = db.batch();
  let n = 0;
  for (const b of benchmarks) {
    batch.set(db.collection("benchmarks").doc(b.id), b);
    n++;
    if (n % 400 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }
  await batch.commit();
  console.log(`Done. Wrote ${benchmarks.length} documents to /benchmarks.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
