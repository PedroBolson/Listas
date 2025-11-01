#!/usr/bin/env node

/**
 * Script para corrigir os limites de membros dos planos
 * FREE: 3 membros (titular + 2)
 * PLUS: 5 membros (titular + 4)
 * PREMIUM: 50 membros (titular + 49)
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔄 Corrigindo limites de membros dos planos\n');

// Carrega a credencial
const serviceAccount = JSON.parse(
    readFileSync(join(__dirname, '../listshub-firebase-adminsdk-fbsvc-b442429578.json'), 'utf8')
);

// Inicializa o Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Limites corretos
const correctLimits = {
    free: {
        familyMembers: 3, // Titular + 2
    },
    plus: {
        familyMembers: 5, // Titular + 4
    },
    premium: {
        familyMembers: 50, // Titular + 49
    },
    master: {
        familyMembers: Number.POSITIVE_INFINITY, // Ilimitado
    },
};

async function fixPlanLimits() {
    console.log('📦 Atualizando limites de membros...\n');

    for (const [planId, limits] of Object.entries(correctLimits)) {
        const planRef = db.collection('plans').doc(planId);
        const planDoc = await planRef.get();

        if (!planDoc.exists) {
            console.log(`  ⚠️  Plano ${planId} não existe, pulando...`);
            continue;
        }

        const currentData = planDoc.data();

        await planRef.update({
            'limits.familyMembers': limits.familyMembers,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`  ✅ Plano ${planId} atualizado:`);
        console.log(`     - familyMembers: ${currentData.limits?.familyMembers} → ${limits.familyMembers}`);
    }

    console.log('\n✅ Todos os limites corrigidos!\n');
}

async function main() {
    try {
        await fixPlanLimits();

        console.log('🎉 Correção concluída com sucesso!\n');
        console.log('Limites corretos:');
        console.log('- FREE: 3 membros (titular + 2)');
        console.log('- PLUS: 5 membros (titular + 4)');
        console.log('- PREMIUM: 50 membros (titular + 49)');
        console.log('- MASTER: Ilimitado\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao corrigir limites:', error);
        process.exit(1);
    }
}

main();
