const moment = require("moment-timezone");
const spacetime = require("spacetime");
const fs = require("fs");

let savedUsersFileExists = true;
try {
    require.resolve("../../data/users.json");
} catch (_) {
    savedUsersFileExists = false;
}
const savedUsers = savedUsersFileExists ? require("../../data/users.json") : [];

const set = (userId, timezone) => {
    savedUsers.push({ userId, timezone });
    fs.writeFile("./data/users.json", JSON.stringify(savedUsers), "utf8", (e) => {
        if (e) return console.log(e);
        return 0;
    });

    return `Your timezone has been saved as ${savedUsers.filter(savedUser => savedUser.userId === userId).map(savedUser => savedUser.timezone)[0]}`;
};

const messageEnd = `Want your timezone added? Use the following command: !time --setzone={timezone}.  
Timezone can be the IANA timezone name or timezone abbreviation.
Examples: \`!time --setzone=America/Los_Angeles\` or \`!time --setzone=PST\``;

const parseTime = (time, zone) => {
    let timeParts = time.split(/[:\s]/);
    let hour;
    let min;
    let abb;
    if (timeParts.length === 3) {
        // HH:MM ABB | HH MM ABB
        [hour, min, abb] = timeParts;
    } else if (timeParts.length === 2 && timeParts[0].length > 2) {
        // HHMM ABB | HMM ABB
        [, abb] = timeParts;
        timeParts = timeParts[0].split("");
        min = timeParts.splice(-2).join("");
        hour = timeParts.join("");
    } else if (timeParts.length === 2 && Number.isNaN(timeParts[1])) {
        // HH ABB
        [hour, abb] = timeParts;
        min = 0;
    } else if (timeParts.length === 2) {
        // HH MM
        [hour, min] = timeParts;
    } else if (timeParts[0].length > 2) {
        // HHMM
        timeParts = timeParts[0].split("");
        min = timeParts.splice(-2).join("");
        hour = timeParts.join("");
    } else {
        // HH
        [hour] = timeParts;
        min = 0;
    }
    if (abb === "AM" && hour === 12) {
        hour = 0;
    } else if (abb === "PM") {
        hour = +hour + 12;
    }

    let date = spacetime.now(zone);
    date = date.hour(hour);
    date = date.minute(min);
    return moment(date.epoch).tz(date.tz);
};

const formatTime = (time, timezone) => {
    const s = spacetime(time.format()).goto(timezone);
    const m = moment(s.epoch).tz(s.tz);
    return m.format("L LT z");
};

const displayTime = (userId, userTime) => {
    const formattedTimes = new Set();
    const userZone = savedUsers.filter(savedUser => savedUser.userId === userId).map(savedUser => savedUser.timezone)[0];
    if (!userZone) {
        return `You have not set a timezone yet!  ${messageEnd}`;
    }
    const timeZones = new Set(savedUsers.filter(savedUser => savedUser.timezone !== userZone).map(savedUser => savedUser.timezone));
    const time = parseTime(userTime.toString(), userZone);
    for (const timezone of timeZones) {
        formattedTimes.add(formatTime(time.clone(), timezone));
    }
    return formattedTimes.length === 0
        ? `There are no other timezones set by users, so here's your time formatted in your timezones local format: ${time.format("L LT z")}.\n${messageEnd}`
        : `${userTime} in your set timezone is:\n${[...formattedTimes].join("\n")}\n${messageEnd}`;
};

module.exports = {
    name: "time",
    execute(message, args) {
        let reply = "";
        if (args.setzone) {
            reply = set(message.member.id, args.setzone);
        } else {
            reply = displayTime(message.member.id, args._.slice(1).join(" "));
        }
        message.reply(reply);
    }
};
