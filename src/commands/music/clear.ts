import { Command, Declare, type GuildCommandContext } from "seyfert";

@Declare({
    name: "clear",
    description: "Clear all tracks from the queue.",
    aliases: ["cq"],
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
})
export default class ClearCommand extends Command {
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

        if (player.queue.isEmpty()) return ctx.editOrReply({ content: "The queue is already empty." });

        await player.queue.clear();

        await ctx.editOrReply({ content: "Cleared all tracks from the queue." });
    }
}
