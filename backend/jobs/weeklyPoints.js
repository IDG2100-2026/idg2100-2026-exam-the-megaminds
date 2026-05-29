import cron from 'node-cron';
import { User } from '../models/users.js';

export function scheduleWeeklyPoints() {
    // Runs every Monday at 00.00
    cron.schedule('0 0 * * 1', async () => {
        console.log('Weekly points job: adding 100 points to all users...');
        await User.updateMany({}, { $inc: { points: 100 } });
        console.log('Done');
    });
}

export default (
    scheduleWeeklyPoints
);