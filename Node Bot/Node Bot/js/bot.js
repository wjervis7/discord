const discord = require("discord.js");
const fs = require("fs");
const { prefix } = require("../config.json");

const executeBot = () => {
    const token = process.env.TOKEN_DISCORD;

    if (!token) {
        throw Error("Token is null");
    }

    const client = new discord.Client();
    client.commands = new discord.Collection();

    const commandFiles = fs.readdirSync("./js/commands").filter(file => file.endsWith(".js"));
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`); // eslint-disable-line global-require
        client.commands.set(command.name, command);
    }

    client.once("ready", () => {
        console.log(`Logged in as ${client.user.tag}!`);
    });

    client.on("message", (message) => {
        if (!message.content.startsWith(prefix) || message.author.bot) {
            return;
        }

        const args = message.content.slice(prefix.length).split(/ +/);
        const commandName = args.shift().toLowerCase();

        if (!client.commands.has(commandName)) {
            return;
        }

        const command = client.commands.get(commandName);

        try {
            command.execute(message, args);
        } catch (error) {
            console.error(error);
            message.reply(`There was an error trying to execute that command: ${error.message}`);
        }
    });

    client.login(token);
};

module.exports = { executeBot };
