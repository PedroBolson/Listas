#!/usr/bin/env node

/**
 * Script para popular o Firestore com dados iniciais
 * 
 * Uso: node scripts/seed-firestore.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs } from 'firebase/firestore';

// Configuração do Firebase (mesma do seu app)
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
    appId: process.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PLANS = [
    {
        id: "free",
        tier: "free",
        name: "Free",
        description: "Perfeito para começar e testar a plataforma",
        translationKey: "plans.free",
        monthlyPrice: 0,
        yearlyPrice: 0,
        currency: "BRL",
        limits: {
            families: 1,
            familyMembers: 3,
            listsPerFamily: 3,
            itemsPerList: 20,
            collaboratorsPerList: 2,
        },
        perks: [
            "1 família",
            "Até 3 membros",
            "3 listas por família",
            "20 itens por lista",
            "Colaboração básica"
        ],
        isUnlimited: false,
    },
    {
        id: "plus",
        tier: "plus",
        name: "Plus",
        description: "Para famílias que precisam de mais organização",
        translationKey: "plans.plus",
        monthlyPrice: 14.90,
        yearlyPrice: 149.00,
        currency: "BRL",
        limits: {
            families: 1,
            familyMembers: 8,
            listsPerFamily: 15,
            itemsPerList: 100,
            collaboratorsPerList: 5,
        },
        perks: [
            "1 família",
            "Até 8 membros",
            "15 listas por família",
            "100 itens por lista",
            "Colaboração avançada",
            "Suporte prioritário"
        ],
        isUnlimited: false,
    },
    {
        id: "premium",
        tier: "premium",
        name: "Premium",
        description: "Recursos ilimitados para organização máxima",
        translationKey: "plans.premium",
        monthlyPrice: 29.90,
        yearlyPrice: 299.00,
        currency: "BRL",
        limits: {
            families: 3,
            familyMembers: Infinity,
            listsPerFamily: Infinity,
            itemsPerList: Infinity,
            collaboratorsPerList: Infinity,
        },
        perks: [
            "Até 3 famílias",
            "Membros ilimitados",
            "Listas ilimitadas",
            "Itens ilimitados",
            "Colaboração ilimitada",
            "Suporte prioritário VIP",
            "Backup automático",
            "Histórico completo"
        ],
        isUnlimited: true,
    },
    {
        id: "master",
        tier: "master",
        name: "Master",
        description: "Acesso administrativo total à plataforma",
        translationKey: "plans.master",
        monthlyPrice: 0,
        yearlyPrice: 0,
        currency: "BRL",
        limits: {
            families: Infinity,
            familyMembers: Infinity,
            listsPerFamily: Infinity,
            itemsPerList: Infinity,
            collaboratorsPerList: Infinity,
        },
        perks: [
            "Acesso total",
            "Tudo ilimitado",
            "Gerenciar planos",
            "Gerenciar usuários",
            "Console administrativo",
            "Logs de auditoria"
        ],
        isUnlimited: true,
    },
];

async function seedPlans() {
    console.log('🌱 Iniciando seed dos planos...');

    // Verificar se já existem planos
    const plansSnap = await getDocs(collection(db, 'plans'));
    if (!plansSnap.empty) {
        console.log('⚠️  Planos já existem. Deseja sobrescrever? (Ctrl+C para cancelar)');
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    for (const plan of PLANS) {
        const planRef = doc(db, 'plans', plan.id);
        await setDoc(planRef, {
            ...plan,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        console.log(`✅ Plano "${plan.name}" criado/atualizado`);
    }

    console.log('');
    console.log('🎉 Todos os planos foram criados com sucesso!');
    console.log('');
    console.log('📊 Resumo dos planos:');
    console.log('┌─────────────┬──────────┬──────────────┬────────────────┐');
    console.log('│ Plano       │ Preço/mês│ Membros      │ Listas         │');
    console.log('├─────────────┼──────────┼──────────────┼────────────────┤');
    PLANS.forEach(plan => {
        const price = plan.monthlyPrice === 0 ? 'Grátis' : `R$ ${plan.monthlyPrice.toFixed(2)}`;
        const members = plan.limits.familyMembers === Infinity ? '∞' : plan.limits.familyMembers;
        const lists = plan.limits.listsPerFamily === Infinity ? '∞' : plan.limits.listsPerFamily;
        console.log(`│ ${plan.name.padEnd(11)} │ ${price.padEnd(8)} │ ${String(members).padEnd(12)} │ ${String(lists).padEnd(14)} │`);
    });
    console.log('└─────────────┴──────────┴──────────────┴────────────────┘');
}

async function seedSettings() {
    console.log('');
    console.log('⚙️  Criando configurações globais...');

    const settingsRef = doc(db, 'settings', 'global');
    await setDoc(settingsRef, {
        defaultPlan: 'free',
        maintenanceMode: false,
        signupEnabled: true,
        inviteOnly: false,
        features: {
            collaboration: true,
            familySharing: true,
            notifications: true,
        },
        limits: {
            maxFamiliesPerUser: 3,
            maxInvitesPerFamily: 10,
        },
        updatedAt: new Date().toISOString(),
    });

    console.log('✅ Configurações globais criadas');
}

async function main() {
    try {
        console.log('🚀 Iniciando seed do Firestore');
        console.log('');

        await seedPlans();
        await seedSettings();

        console.log('');
        console.log('✨ Seed concluído com sucesso!');
        console.log('');
        console.log('Próximos passos:');
        console.log('1. Reinicie o app para ver os planos');
        console.log('2. Crie uma conta nova (vai pegar o plano Free automaticamente)');
        console.log('3. Promova sua conta a Master seguindo MASTER_SETUP.md');
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao fazer seed:', error);
        process.exit(1);
    }
}

main();
