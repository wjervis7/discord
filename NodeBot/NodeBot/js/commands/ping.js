module.exports = {
    name: "ping",
    description: "ping!",
    execute(message) {
        message.channel.send("Pong.");
    }
};
