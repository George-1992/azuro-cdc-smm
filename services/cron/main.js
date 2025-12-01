import { contentTasks } from '@/services/scheduledTasks/tasks';
import cronManager from '@/services/cron/vars.js';

let started = false;

const startCron = () => {
    if (started) return;
    started = true;

    // cron.schedule('* * * * *', () => {
    //     contentTasks();
    // });
    if (!cronManager.exists("contentJob")) {
        console.log("Cron started");
        cronManager.create("contentJob", "* * * * *", () => {
            contentTasks();
        });
    }


};

export default startCron();