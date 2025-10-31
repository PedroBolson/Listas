#!/usr/bin/env node
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
    readFileSync(join(__dirname, '../listshub-firebase-adminsdk-fbsvc-b442429578.json'), 'utf8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkPlans() {
    const plansSnap = await db.collection('plans').get();
    
    console.log('📦 Planos no Firestore:\n');
    
    plansSnap.docs.forEach(doc => {
        const data = doc.data();
        console.log(`ID: ${doc.id}`);
        console.log(`  - order: ${data.order}`);
        console.log(`  - name: ${data.name}`);
        console.log(`  - description: ${data.description}`);
        console.log(`  - translationKey: ${data.translationKey}`);
        console.log('');
    });
    
    process.exit(0);
}

checkPlans();
