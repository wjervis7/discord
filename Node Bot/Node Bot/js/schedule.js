const discord = require("discord.js");
const moment = require("moment");
const RedditClient = require("snoowrap");
const { schedules } = require("../schedules.json");

const token = process.env.TOKEN_DISCORD;
const clientSecret = process.env.SECRET;
const refreshToken = process.env.TOKEN_REDDIT;

if (!token) {
    throw Error("Token is null");
}
const {
    channelId,
    guildId: serverId,
    userAgent,
    clientId,
    subReddit
} = require("../config.json");

const sleep = ms => new Promise((resolve) => {
    setTimeout(resolve, ms);
});

const getRedditPost = async (schedule) => {
    const r = new RedditClient({
        userAgent,
        clientId,
        clientSecret,
        refreshToken
    });
    const posts = await r.getSubreddit(subReddit).search({
        query: schedule.query,
        time: schedule.time,
        sort: "new"
    });
    for (const post of posts) {
        const createDate = moment.unix(post.created).utc();
        const now = moment.utc();
        if (createDate.isSame(now, "day")) {
            return post;
        }
    }
    return undefined;
};

const executeSchedule = async (args) => {
    const schedule = schedules.filter(s => s.name === args.schedule)[0];

    let redditPost;

    do {
        redditPost = await getRedditPost(schedule); // eslint-disable-line no-await-in-loop
        if (redditPost) {
            break;
        }
        await sleep(60000); // eslint-disable-line no-await-in-loop
        // ReSharper disable once ConditionIsAlwaysConst
    } while (!redditPost);

    const client = new discord.Client();
    await client.login(token);
    const server = client.guilds.get(serverId);
    const channel = server.channels.get(channelId);

    channel.send(redditPost.url);

    client.destroy();
};

module.exports = { executeSchedule };
