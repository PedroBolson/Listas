#!/usr/bin/env node

/**
 * Script para promover um usuário para Master
 * Uso: node scripts/promote-to-master.mjs <email_do_usuario>
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const userEmail = process.argv[2];

if (!userEmail) {
    console.error('❌ Uso: node scripts/promote-to-master.mjs <email_do_usuario>');
    process.exit(1);
}

console.log(`🔐 Promovendo ${userEmail} para Master...\n`);

// Carrega a credencial
const serviceAccount = JSON.parse(
    readFileSync(join(__dirname, '../listshub-firebase-adminsdk-fbsvc-b442429578.json'), 'utf8')
);

// Inicializa o Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function promoteToMaster() {
    try {
        // Busca o usuário pelo email
        const usersSnap = await db.collection('users').where('email', '==', userEmail).get();

        if (usersSnap.empty) {
            console.error(`❌ Usuário com email ${userEmail} não encontrado`);
            process.exit(1);
        }

        const userDoc = usersSnap.docs[0];
        const userId = userDoc.id;
        const userData = userDoc.data();

        console.log(`✅ Usuário encontrado: ${userData.displayName} (${userId})\n`);

        // Atualiza o usuário para Master
        await db.collection('users').doc(userId).update({
            role: 'master',
            billing: {
                planId: 'master',
                status: 'active',
                seats: {
                    total: 999999,
                    used: 0,
                },
                invites: {
                    total: 999999,
                    used: 0,
                },
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log('✅ Usuário promovido para Master com sucesso!\n');
        console.log('Mudanças aplicadas:');
        console.log('  - role: master');
        console.log('  - billing.planId: master');
        console.log('  - billing.status: active');
        console.log('  - seats: 999999');
        console.log('  - invites: 999999\n');

        console.log('🎉 O usuário agora tem acesso total ao Master Console!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao promover usuário:', error);
        process.exit(1);
    }
}

promoteToMaster();
