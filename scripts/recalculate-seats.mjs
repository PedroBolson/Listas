import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

// Carrega as credenciais do arquivo
const serviceAccount = JSON.parse(
    readFileSync('./listshub-firebase-adminsdk-fbsvc-b442429578.json', 'utf8')
);

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function recalculateSeats() {
    console.log('🔧 Recalculando seats baseado nos planos do Firestore...\n');

    try {
        // 1. Busca todos os planos
        const plansSnapshot = await db.collection('plans').get();
        const planLimits = {};

        plansSnapshot.forEach(doc => {
            const data = doc.data();
            planLimits[data.tier] = data.limits?.familyMembers || 3;
            console.log(`📋 Plano ${data.tier}: ${data.limits?.familyMembers} membros`);
        });

        console.log('\n' + '='.repeat(60) + '\n');

        // 2. Busca todos os usuários titulares
        const usersSnapshot = await db.collection('users')
            .where('role', '==', 'titular')
            .get();

        console.log(`📊 Encontrados ${usersSnapshot.size} usuários titulares\n`);

        let fixed = 0;
        let skipped = 0;

        for (const doc of usersSnapshot.docs) {
            const userData = doc.data();
            const userId = doc.id;
            const planId = userData.billing?.planId || 'free';

            console.log(`\n👤 ${userData.displayName || userData.email}`);
            console.log(`   Plano: ${planId}`);

            // Busca o limite correto do plano
            const correctTotal = planLimits[planId] || 3;
            const currentTotal = userData.billing?.seats?.total;
            const currentUsed = userData.billing?.seats?.used || 1;

            console.log(`   Seats atual: total=${currentTotal}, used=${currentUsed}`);
            console.log(`   Seats correto: total=${correctTotal}`);

            // Verifica se precisa corrigir
            if (currentTotal === correctTotal) {
                console.log(`   ✅ Já está correto`);
                skipped++;
                continue;
            }

            // Conta membros reais na família primária
            let realUsed = 1;
            if (userData.primaryFamilyId) {
                const familyDoc = await db.collection('families').doc(userData.primaryFamilyId).get();
                if (familyDoc.exists) {
                    const familyData = familyDoc.data();
                    realUsed = Object.keys(familyData.members || {}).length;
                }
            }

            const newSeats = {
                total: correctTotal,
                used: realUsed
            };

            // Atualiza
            await doc.ref.update({
                'billing.seats': newSeats
            });

            console.log(`   🔄 ATUALIZADO para: total=${newSeats.total}, used=${newSeats.used}`);
            fixed++;
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMO:');
        console.log(`   ✅ Corrigidos: ${fixed}`);
        console.log(`   ⏭️  Já corretos: ${skipped}`);
        console.log(`   📝 Total: ${usersSnapshot.size}`);
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('❌ Erro:', error);
        throw error;
    }
}

// Executa
recalculateSeats()
    .then(() => {
        console.log('✅ Script concluído!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Falhou:', error);
        process.exit(1);
    });
