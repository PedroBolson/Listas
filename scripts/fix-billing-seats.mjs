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

async function fixBillingSeats() {
    console.log("🔧 Iniciando correção de billing.seats...\n");

    try {
        // Busca todos os usuários com billing mas sem seats
        const usersSnapshot = await db.collection("users").get();

        let fixedCount = 0;
        let skippedCount = 0;

        for (const doc of usersSnapshot.docs) {
            const userData = doc.data();
            const userId = doc.id;

            // Verifica se tem billing mas não tem seats
            if (userData.billing && !userData.billing.seats) {
                const planId = userData.billing.planId || "free";

                // Define seats baseado no plano
                let seats = { total: 3, used: 1 }; // Free plan padrão

                if (planId === "plus") {
                    seats = { total: 5, used: 1 };
                } else if (planId === "premium") {
                    seats = { total: 50, used: 1 };
                } else if (planId === "master") {
                    seats = { total: 999999, used: 1 };
                }

                console.log(`📝 Corrigindo usuário ${userData.displayName || userId}`);
                console.log(`   - planId: ${planId}`);
                console.log(`   - seats: ${JSON.stringify(seats)}`);

                await db.collection("users").doc(userId).update({
                    "billing.seats": seats,
                    updatedAt: new Date().toISOString(),
                });

                fixedCount++;
            } else {
                skippedCount++;
            }
        }

        console.log("\n✅ Migração concluída!");
        console.log(`   - Corrigidos: ${fixedCount} usuários`);
        console.log(`   - Ignorados: ${skippedCount} usuários (já tinham seats)`);

    } catch (error) {
        console.error("❌ Erro na migração:", error);
        process.exit(1);
    }
}

fixBillingSeats()
    .then(() => {
        console.log("\n🎉 Script finalizado com sucesso!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n💥 Erro fatal:", error);
        process.exit(1);
    });
