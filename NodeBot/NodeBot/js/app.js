const args = require("minimist")(process.argv.slice(2), { string: "channelId" });
const schedule = require("./schedule");
const bot = require("./bot");

try {
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
} catch (e) {
    console.error(e);
}
