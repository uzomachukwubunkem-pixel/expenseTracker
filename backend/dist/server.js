import { app } from './app';
import { connectDatabase } from './config/database';
import { env, getEmailTransportMode, isEmailVerificationConfigured } from './config/env';
import { startTurnoverMonitorJob } from './jobs/turnoverMonitor';
import { logger } from './utils/logger';
const start = async () => {
    await connectDatabase();
    const emailTransportMode = getEmailTransportMode();
    logger.info({
        message: 'Email transport mode detected',
        mode: emailTransportMode,
        emailEnabled: env.emailEnabled,
    });
    if (!isEmailVerificationConfigured) {
        logger.warn({
            message: 'Email verification is not configured; verification emails will not be sent until SMTP or Gmail OAuth env vars are provided',
        });
    }
    startTurnoverMonitorJob();
    app.listen(env.port, () => {
        logger.info(`Backend listening on port ${env.port}`);
    });
};
start().catch((error) => {
    logger.error({ message: 'Server startup failed', error });
    process.exit(1);
});
