#!/usr/bin/env node

/**
 * Script para popular o Firestore usando Admin SDK
 * Uso: node scripts/seed-admin.mjs
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Iniciando seed do Firestore com Admin SDK\n');

// Carrega a credencial
const serviceAccount = JSON.parse(
    readFileSync(join(__dirname, '../listshub-firebase-adminsdk-fbsvc-b442429578.json'), 'utf8')
);

// Inicializa o Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Planos (sem textos hardcoded - usa translation keys)
const PLANS = [
    {
        id: "free",
        tier: "free",
        translationKey: "plans.free",
        monthlyPrice: 0,
        yearlyPrice: 0,
        currency: "BRL",
        isUnlimited: false,
        order: 0,
        limits: {
            families: 1,
            familyMembers: 3,
            listsPerFamily: 3,
            itemsPerList: 50,
            collaboratorsPerList: 2,
        },
        perks: ["basic_features", "single_family"],
    },
    {
        id: "plus",
        tier: "plus",
        translationKey: "plans.plus",
        monthlyPrice: 14.90,
        yearlyPrice: 149.00,
        currency: "BRL",
        isUnlimited: false,
        order: 1,
        limits: {
            families: 1,
            familyMembers: 5,
            listsPerFamily: 10,
            itemsPerList: 100,
            collaboratorsPerList: 5,
        },
        perks: ["all_basic", "more_members", "more_lists"],
    },
    {
        id: "premium",
        tier: "premium",
        translationKey: "plans.premium",
        monthlyPrice: 29.90,
        yearlyPrice: 299.00,
        currency: "BRL",
        isUnlimited: false,
        order: 2,
        limits: {
            families: 3,
            familyMembers: 50,
            listsPerFamily: 200,
            itemsPerList: 500,
            collaboratorsPerList: 20,
        },
        perks: ["multiple_families", "unlimited_lists", "unlimited_items", "priority_support"],
    },
    {
        id: "master",
        tier: "master",
        translationKey: "plans.master",
        monthlyPrice: 0,
        yearlyPrice: 0,
        currency: "BRL",
        isUnlimited: true,
        order: 3,
        limits: {
            families: 999999,
            familyMembers: 999999,
            listsPerFamily: 999999,
            itemsPerList: 999999,
            collaboratorsPerList: 999999,
        },
        perks: ["admin_access", "full_control", "unlimited_everything"],
    },
];

// Settings
const SETTINGS = {
    id: "global",
    defaultPlan: "free",
    maintenanceMode: false,
    signupEnabled: true,
    inviteOnly: false,
    features: {
        collaboration: true,
        familySharing: true,
        notifications: false,
    },
    limits: {
        maxFamiliesPerUser: 15,
        maxInvitesPerFamily: 50,
    },
};

async function seedPlans() {
    console.log('📦 Criando planos...');

    for (const plan of PLANS) {
        const planData = {
            ...plan,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await db.collection('plans').doc(plan.id).set(planData);
        console.log(`  ✅ Plano ${plan.id} criado`);
    }

    console.log('✅ Todos os planos criados!\n');
}

async function seedSettings() {
    console.log('⚙️  Criando configurações globais...');

    const settingsData = {
        ...SETTINGS,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('settings').doc('global').set(settingsData);
    console.log('✅ Configurações criadas!\n');
}

async function main() {
    try {
        await seedPlans();
        await seedSettings();

        console.log('🎉 Seed concluído com sucesso!\n');
        console.log('Verifique no Firebase Console:');
        console.log('- Coleção "plans" deve ter 4 documentos');
        console.log('- Coleção "settings" deve ter 1 documento\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao fazer seed:', error);
        process.exit(1);
    }
}

main();
