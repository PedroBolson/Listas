#!/usr/bin/env node

/**
 * Script para atualizar planos existentes com campos order, name e description
 * Uso: node scripts/update-plans.mjs
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔄 Atualizando planos no Firestore\n');

// Carrega a credencial
const serviceAccount = JSON.parse(
    readFileSync(join(__dirname, '../listshub-firebase-adminsdk-fbsvc-b442429578.json'), 'utf8')
);

// Inicializa o Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Traduções hardcoded (PT-BR)
const translations = {
    free: {
        name: 'Grátis',
        description: 'Perfeito para uso pessoal',
    },
    plus: {
        name: 'Plus',
        description: 'Para pequenas famílias e times',
    },
    premium: {
        name: 'Premium',
        description: 'Para grandes famílias e usuários avançados',
    },
    master: {
        name: 'Master',
        description: 'Acesso ilimitado a tudo',
    },
};

// Order dos planos
const planOrder = {
    free: 0,
    plus: 1,
    premium: 2,
    master: 3,
};

async function updatePlans() {
    console.log('📦 Atualizando planos com order, name e description...\n');

    const planIds = ['free', 'plus', 'premium', 'master'];

    for (const planId of planIds) {
        const planRef = db.collection('plans').doc(planId);
        const planDoc = await planRef.get();

        if (!planDoc.exists) {
            console.log(`  ⚠️  Plano ${planId} não existe, pulando...`);
            continue;
        }

        const updates = {
            order: planOrder[planId],
            name: translations[planId].name,
            description: translations[planId].description,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await planRef.update(updates);
        console.log(`  ✅ Plano ${planId} atualizado:`);
        console.log(`     - order: ${updates.order}`);
        console.log(`     - name: ${updates.name}`);
        console.log(`     - description: ${updates.description}`);
    }

    console.log('\n✅ Todos os planos atualizados!\n');
}

async function main() {
    try {
        await updatePlans();

        console.log('🎉 Atualização concluída com sucesso!\n');
        console.log('Verifique no Firebase Console:');
        console.log('- Cada plano deve ter: order, name, description\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao atualizar planos:', error);
        process.exit(1);
    }
}

main();
