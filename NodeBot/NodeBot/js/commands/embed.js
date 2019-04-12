const discord = require("discord.js");

const updateEmbeddedMessage = (channel, args) => {
    const fileName = args.file || channel.name;

    const { title, description, fields } = require(`../../embeds/${fileName}`); // eslint-disable-line global-require

    const embed = new discord.RichEmbed()
        .setTitle(title)
        .setDescription(description);

    for (const { title: fieldTitle, links } of fields) {
        embed.addField(fieldTitle, links.join("\r\n"));
    }

    channel.send(embed);
};

module.exports = {
    name: "embed",
    execute(message, args) {
        updateEmbeddedMessage(message.channel, args);
        message.delete();
    }
};
