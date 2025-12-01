const cron = require('node-cron');

const jobs = {};

const create = (name, expression, fn) => {
    if (jobs[name]) {
        throw new Error(`Job "${name}" already exists`);
    }

    const job = cron.schedule(expression, fn, { scheduled: false });
    jobs[name] = job;

    return job;
};

const start = (name) => {
    const job = jobs[name];
    if (!job) throw new Error(`Job "${name}" not found`);
    if (!job.running) job.start();
};

const stop = (name) => {
    const job = jobs[name];
    if (!job) throw new Error(`Job "${name}" not found`);
    if (job.running) job.stop();
};

const destroy = (name) => {
    const job = jobs[name];
    if (!job) throw new Error(`Job "${name}" not found`);
    job.destroy();
    delete jobs[name];
};

const exists = (name) => !!jobs[name];

const isRunning = (name) => jobs[name]?.running ?? false;


export default {
    create,
    start,
    stop,
    destroy,
    exists,
    isRunning,
}