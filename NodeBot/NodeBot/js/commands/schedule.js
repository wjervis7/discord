const cron = require("node-cron");
const scheduleRunner = require("../schedule");

module.exports = {
    name: "schedule",
    execute(message, { cron: cronExpr, name: schedule }) {
        cron.schedule(cronExpr, async () => {
            await scheduleRunner.executeSchedule({ schedule });
        });
        message.reply(`Schedule a new job for ${schedule}`);
    }
};
