import { Command, Declare, type GuildCommandContext, type MessageStructure, type WebhookMessageStructure } from "seyfert";

@Declare({
    name: "test",
    description: "A simple test command.",
    aliases: ["t"],
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
})
export default class TestCommand extends Command {
    public override async run(ctx: GuildCommandContext): Promise<MessageStructure | WebhookMessageStructure | void> {
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

        if (!player.playing && !player.queue.current) return ctx.editOrReply({ content: "No track is currently playing." });

        await player.data.set("enabledAutoplay", false);
        await player.stop({ clearQueue: true, destroy: false });

        await ctx.editOrReply({ content: "Stopping the player and clearing the queue..." });
    }
}
