const discord = require("discord.js");
const moment = require("moment");
const RedditClient = require("snoowrap");
const { retrySeconds } = require("../configs/config.json");
const { schedules } = require("../configs/schedules.json");

const token = process.env.TOKEN_DISCORD;
const clientSecret = process.env.SECRET;
const refreshToken = process.env.TOKEN_REDDIT;

if (!token) {
    throw Error("Token is null");
}
const {
    channelId: defaultChannelId,
    guildId: serverId,
    userAgent,
    clientId,
    subReddit
} = require("../configs/config.json");

const sleep = ms => new Promise((resolve) => {
    setTimeout(resolve, ms);
});

const getRedditPost = async (redditClient, { query, postTitle, time }) => {
    const posts = await redditClient.getSubreddit(subReddit).search({
        query,
        time,
        sort: "new"
    });
    for (const post of posts) {
        if (post.title === postTitle) {
            return post;
        }

        console.log(`Wrong post :(\r\nExpected ${postTitle}\r\nGot ${post.title}`);
    }
    console.log("Unable to find reddit post.  Waiting a minute.");
    await sleep(retrySeconds * 1000);
    return getRedditPost(redditClient, { query, postTitle, time });
};

const executeSchedule = async (args) => {
    const schedule = schedules.filter(s => s.name === args.schedule)[0];
    const channelId = args.channelId ? args.channelId : defaultChannelId;
    const now = moment.utc();
    schedule.postTitle = schedule.postTitle.replace("{date}", now.format(schedule.dateFormat));
    console.log(`Executing schedule ${schedule.name}.  Using query ${schedule.query} over the last ${schedule.time}.`);
    const client = new discord.Client();
    const promises = [
        client.login(token).then(() => {
            client.user.setPresence({ game: { name: `Getting latest ${schedule.activity}` }, status: "online" });
        })
    ];

    const redditClient = new RedditClient({
        userAgent,
        clientId,
        clientSecret,
        refreshToken
    });

    promises.push(getRedditPost(redditClient, schedule));
    const [, redditPost] = await Promise.all(promises);
    console.log(`Found reddit post for ${schedule.name}: ${redditPost.url}.\r\nPosting to Discord channel ${channelId} on server ${serverId}.`);

    const server = client.guilds.get(serverId);
    const channel = server.channels.get(channelId);

    channel.send(redditPost.url);
    console.log("Posted to discord.  Scheduled task completed.");

    client.user.setPresence({ game: { name: "" }, status: "idle" });
    client.destroy();
};

module.exports = { executeSchedule };
