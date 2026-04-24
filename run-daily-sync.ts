import { runDailyTennisSync } from './lib/tennisEngine';
import { runDailyFootballSync } from './lib/footballEngine';

async function main() {
  console.log('Iniciando sincronización forzada manual...');
  try {
    const [tennis, football] = await Promise.all([
      runDailyTennisSync(),
      runDailyFootballSync(),
    ]);

    console.log('\n✅ RESULTADOS DE SINCRONIZACIÓN:');
    console.log('TENIS:', tennis);
    console.log('FÚTBOL:', football);
  } catch (error) {
    console.error('Error durante la sincronización:', error);
  }
}

main();
