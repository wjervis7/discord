const args = require("minimist")(process.argv.slice(2));
const schedule = require("./schedule");
const bot = require("./bot");

switch (args.action) {
case "schedule":
    (async () => {
        await schedule.executeSchedule(args);
    })();
    break;
case "bot":
    bot.executeBot();
    break;
default:
    throw Error("Action not found");
}
