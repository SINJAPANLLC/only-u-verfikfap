#!/usr/bin/env node
const { Firestore } = require('@google-cloud/firestore');

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('FIREBASE_SERVICE_ACCOUNT(JSON) を設定してください');
  process.exit(1);
}

const creds = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const db = new Firestore({ projectId: creds.project_id, credentials: creds });

(async () => {
  const threshold = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const sessionsSnap = await db
    .collection('liveSessions')
    .where('status', '==', 'ended')
    .where('updatedAt', '<', new Date(threshold))
    .get();

  for (const doc of sessionsSnap.docs) {
    console.log('Cleaning live session', doc.id);
    await doc.ref.delete();
  }

  const requestsSnap = await db
    .collection('matchRequests')
    .where('status', 'in', ['approved', 'rejected'])
    .where('updatedAt', '<', new Date(threshold))
    .get();

  for (const doc of requestsSnap.docs) {
    console.log('Cleaning match request', doc.id);
    await doc.ref.delete();
  }
})();
