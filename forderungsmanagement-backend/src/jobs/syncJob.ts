import cron from 'node-cron';
import syncService from '../services/syncService';
import logger from '../utils/logger';

export const startCronJobs = () => {
  // Default: Täglich um 2:00 Uhr morgens
  const schedule = process.env.SYNC_CRON_SCHEDULE || '0 2 * * *';
  
  logger.info(`📅 Cronjob scheduled: ${schedule}`);

  // Hauptsync-Job
  cron.schedule(schedule, async () => {
    logger.info('⏰ Cronjob triggered: Starting sync...');
    
    try {
      const result = await syncService.syncAllData();
      logger.info(`✅ Cronjob completed: ${result.invoices} invoices, ${result.payments} payments synced`);
    } catch (error) {
      logger.error('❌ Cronjob failed:', error);
    }
  });

  // Optionaler sofortiger Sync beim Start (für Development)
  if (process.env.NODE_ENV === 'development') {
    logger.info('🚀 Running initial sync in development mode...');
    setTimeout(async () => {
      try {
        await syncService.syncAllData();
      } catch (error) {
        logger.error('❌ Initial sync failed:', error);
      }
    }, 3000); // 3 Sekunden Verzögerung nach Server-Start
  }
};

// Manueller Trigger für Sync (kann über API aufgerufen werden)
export const triggerManualSync = async (): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    logger.info('🔧 Manual sync triggered');
    const result = await syncService.syncAllData();
    return { success: true, data: result };
  } catch (error: any) {
    logger.error('❌ Manual sync failed:', error);
    return { success: false, error: error.message };
  }
};

