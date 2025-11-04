import { Router, Request, Response } from 'express';
import receivablesService from '../services/receivablesService';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/receivables
 * Gibt alle Forderungen zurück, optional gefiltert nach Status
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const receivables = await receivablesService.getAllReceivables(status as string);
    
    // Format response wie gewünscht
    const formatted = receivables.map(invoice => ({
      invoice_id: invoice.invoice_number,
      customer: invoice.customer_name,
      amount: invoice.amount,
      due_date: invoice.due_date.toISOString().split('T')[0],
      status: invoice.status,
      reminder_level: invoice.reminder_level,
    }));
    
    res.json(formatted);
  } catch (error) {
    logger.error('Error in GET /api/receivables:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/receivables/status
 * Gibt eine Übersicht über alle Forderungen zurück
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await receivablesService.getReceivablesStatus();
    res.json(status);
  } catch (error) {
    logger.error('Error in GET /api/receivables/status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/receivables/:id
 * Gibt eine einzelne Forderung zurück
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const receivable = await receivablesService.getReceivableById(id);
    
    if (!receivable) {
      return res.status(404).json({ error: 'Receivable not found' });
    }
    
    res.json(receivable);
  } catch (error) {
    logger.error('Error in GET /api/receivables/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

