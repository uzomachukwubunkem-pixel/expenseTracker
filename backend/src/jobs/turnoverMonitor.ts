import cron from 'node-cron'
import { createTurnoverAlerts } from '../services/alertService'
import { logger } from '../utils/logger'

export const startTurnoverMonitorJob = (): void => {
  cron.schedule('0 1 * * *', async () => {
    try {
      await createTurnoverAlerts()
      logger.info('Turnover monitor job completed')
    } catch (error) {
      logger.error({ message: 'Turnover monitor job failed', error })
    }
  })
}
