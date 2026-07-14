import { Command, createIntegerOption, Declare, type GuildCommandContext, Options } from "seyfert";

const options = {
    position: createIntegerOption({
        description: "The position of the track to remove.",
        required: true,
        min_value: 1,
    }),
};

@Declare({
    name: "remove",
    description: "Remove a track from the queue by position.",
    aliases: ["rm", "delete"],
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
})
@Options(options)
export default class RemoveCommand extends Command {
    override async run(ctx: GuildCommandContext<typeof options>) {
        const { client, options } = ctx;

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

        const index = options.position - 1;
        if (index < 0 || index >= player.queue.size)
            return ctx.editOrReply({ content: `Invalid position. Queue has **${player.queue.size}** tracks.` });

        const [track] = await player.queue.splice(index, 1);

        await ctx.editOrReply({
            content: `Removed **${track.info.title}** from the queue.`,
        });
    }
}
