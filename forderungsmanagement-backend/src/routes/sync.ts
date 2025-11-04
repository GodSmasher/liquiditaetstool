import { Router, Request, Response } from 'express';
import { triggerManualSync } from '../jobs/syncJob';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /api/sync/trigger
 * Löst eine manuelle Synchronisation aus
 */
router.post('/trigger', async (req: Request, res: Response) => {
  try {
    logger.info('Manual sync triggered via API');
    const result = await triggerManualSync();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Sync completed successfully',
        data: result.data,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Sync failed',
        error: result.error,
      });
    }
  } catch (error) {
    logger.error('Error in POST /api/sync/trigger:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

