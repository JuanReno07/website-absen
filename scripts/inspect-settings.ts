import { prisma } from '../src/lib/db';

async function inspectSettings() {
  const settings = await prisma.systemSettings.findMany();
  console.log('Current System Settings in Turso DB:', JSON.stringify(settings, null, 2));

  const latestLog = await prisma.auditLog.findFirst({
    where: { action: 'UPDATE_SYSTEM_SETTINGS' },
    orderBy: { created_at: 'desc' },
  });
  console.log('Latest System Settings Audit Log:', JSON.stringify(latestLog, null, 2));

  await prisma.$disconnect();
}

inspectSettings();
