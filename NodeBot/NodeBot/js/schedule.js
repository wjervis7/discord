const discord = require("discord.js");
const moment = require("moment");
const RedditClient = require("snoowrap");
const { schedules } = require("../configs/schedules.json");

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
} = require("../configs/config.json");

const sleep = ms => new Promise((resolve) => {
    setTimeout(resolve, ms);
});

const getRedditPost = async (redditClient, schedule) => {
    const posts = await redditClient.getSubreddit(subReddit).search({
        query: schedule.query,
        time: schedule.time,
        sort: "new"
    });
    for (const post of posts) {
        const createDate = moment.unix(post.created).utc();
        const now = moment.utc();
        if (createDate.isSame(now, schedule.time)) {
            return post;
        }
    }
    console.info("Unable to find reddit post.  Waiting a minute.");
    await sleep(60000);
    return getRedditPost(schedule);
};

const executeSchedule = async (args) => {
    const schedule = schedules.filter(s => s.name === args.schedule)[0];

    const redditClient = new RedditClient({
        userAgent,
        clientId,
        clientSecret,
        refreshToken
    });

    const redditPost = getRedditPost(redditClient, schedule);

    const client = new discord.Client();
    await client.login(token);
    const server = client.guilds.get(serverId);
    const channel = server.channels.get(channelId);

    channel.send(redditPost.url);

    client.destroy();
};

module.exports = { executeSchedule };
