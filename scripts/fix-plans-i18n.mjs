#!/usr/bin/env node

/**
 * Script para REMOVER campos hardcoded (name, description) dos planos
 * e deixar apenas translationKey para i18n funcionar
 * Uso: node scripts/fix-plans-i18n.mjs
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔄 Corrigindo planos para usar i18n\n');

// Carrega a credencial
const serviceAccount = JSON.parse(
    readFileSync(join(__dirname, '../listshub-firebase-adminsdk-fbsvc-b442429578.json'), 'utf8')
);

// Inicializa o Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fixPlans() {
    console.log('📦 Removendo campos hardcoded (name, description)...\n');

    const planIds = ['free', 'plus', 'premium', 'master'];

    for (const planId of planIds) {
        const planRef = db.collection('plans').doc(planId);
        const planDoc = await planRef.get();

        if (!planDoc.exists) {
            console.log(`  ⚠️  Plano ${planId} não existe, pulando...`);
            continue;
        }

        // Remove os campos hardcoded, mantém apenas translationKey
        const updates = {
            name: admin.firestore.FieldValue.delete(),
            description: admin.firestore.FieldValue.delete(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await planRef.update(updates);
        console.log(`  ✅ Plano ${planId} corrigido:`);
        console.log(`     - Removido: name (hardcoded)`);
        console.log(`     - Removido: description (hardcoded)`);
        console.log(`     - Mantido: translationKey="${planDoc.data().translationKey}"`);
        console.log(`     - i18n: usará locales/{pt,en}/common.json`);
    }

    console.log('\n✅ Todos os planos corrigidos!\n');
    console.log('Agora o app vai buscar textos de:');
    console.log('  PT: locales/pt/common.json');
    console.log('  EN: locales/en/common.json\n');
}

async function main() {
    try {
        await fixPlans();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao corrigir planos:', error);
        process.exit(1);
    }
}

main();
