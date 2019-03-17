const args = require("minimist")(process.argv.slice(2));
const schedule = require("./schedule");
const bot = require("./bot");

if (args && args.schedule) {
    (async () => {
        await schedule.executeSchedule(args);
    })();
} else {
    bot.executeBot();
}
