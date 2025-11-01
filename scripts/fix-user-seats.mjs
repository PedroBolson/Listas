#!/usr/bin/env node

/**
 * Script para adicionar o campo seats em usuários titulares que não têm
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Inicializa o Firebase Admin
const serviceAccount = JSON.parse(
    readFileSync(join(__dirname, '../serviceAccountKey.json'), 'utf8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fixUserSeats() {
    console.log('🔍 Buscando usuários titulares sem seats...\n');

    const usersSnapshot = await db.collection('users').where('role', '==', 'titular').get();

    let fixed = 0;
    let skipped = 0;

    for (const doc of usersSnapshot.docs) {
        const userData = doc.data();
        const userId = doc.id;

        // Verifica se já tem seats
        if (userData.billing?.seats) {
            console.log(`⏭️  ${userData.displayName || userId}: já tem seats`);
            skipped++;
            continue;
        }

        // Determina o plano e seats
        const planId = userData.billing?.planId || 'free';
        let seats = { total: 5, used: 1 }; // Free plan default

        if (planId === 'basic') {
            seats = { total: 10, used: 1 };
        } else if (planId === 'premium') {
            seats = { total: 999, used: 1 };
        }

        // Conta quantos membros ativos tem na família
        if (userData.primaryFamilyId) {
            const familyDoc = await db.collection('families').doc(userData.primaryFamilyId).get();
            if (familyDoc.exists) {
                const familyData = familyDoc.data();
                const activeMembers = Object.values(familyData.members || {}).filter(
                    (m) => m.status === 'active'
                ).length;
                seats.used = activeMembers;
            }
        }

        // Atualiza o usuário
        await doc.ref.update({
            'billing.seats': seats,
            updatedAt: admin.firestore.Timestamp.now(),
        });

        console.log(`✅ ${userData.displayName || userId}: seats adicionados (${seats.used}/${seats.total})`);
        fixed++;
    }

    console.log(`\n📊 Resumo:`);
    console.log(`   ✅ Corrigidos: ${fixed}`);
    console.log(`   ⏭️  Pulados: ${skipped}`);
    console.log(`   📝 Total: ${usersSnapshot.size}`);
}

fixUserSeats()
    .then(() => {
        console.log('\n✨ Script concluído com sucesso!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erro ao executar script:', error);
        process.exit(1);
    });
