import { Command, Declare, type GuildCommandContext } from "seyfert";

@Declare({
    name: "previous",
    description: "Play the previous track.",
    aliases: ["prev", "back"],
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
})
export default class PreviousCommand extends Command {
    override async run(ctx: GuildCommandContext) {
        const { client } = ctx;

        const state = await ctx.member.voice();
        if (!state.channelId)
            return ctx.editOrReply({
                content: "You need to be in a voice channel to use this command.",
            });

        const me = await ctx.me();
        const bot = await me.voice();

        if (bot && bot.channelId !== state.channelId) return ctx.editOrReply({ content: "I'm already in a voice channel." });

        const player = client.manager.getPlayer(ctx.guildId);
        if (!player) return ctx.editOrReply({ content: "No player found." });

        const previous = await player.queue.previous(true);
        if (!previous) return ctx.editOrReply({ content: "No previous track found." });

        await player.queue.unshift(previous);
        await player.skip();

        await ctx.editOrReply({
            content: `Now playing previous track: **${previous.info.title}**.`,
        });
    }
}
