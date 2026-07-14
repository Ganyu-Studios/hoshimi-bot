import { Command, createIntegerOption, Declare, type GuildCommandContext, Options } from "seyfert";

const options = {
    from: createIntegerOption({
        description: "The current position of the track.",
        required: true,
        min_value: 1,
    }),
    to: createIntegerOption({
        description: "The target position to move the track to.",
        required: true,
        min_value: 1,
    }),
};

@Declare({
    name: "move",
    description: "Move a track to a different position in the queue.",
    aliases: ["mv"],
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
})
@Options(options)
export default class MoveCommand extends Command {
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

        if (player.queue.isEmpty()) return ctx.editOrReply({ content: "The queue is empty." });

        const fromIndex = options.from - 1;
        const toIndex = options.to - 1;

        if (fromIndex < 0 || fromIndex >= player.queue.size)
            return ctx.editOrReply({ content: `Invalid **from** position. Queue has **${player.queue.size}** tracks.` });

        if (toIndex < 0 || toIndex >= player.queue.size)
            return ctx.editOrReply({ content: `Invalid **to** position. Queue has **${player.queue.size}** tracks.` });

        const track = player.queue.tracks[fromIndex];
        await player.queue.move(track, options.to);

        await ctx.editOrReply({
            content: `Moved **${track.info.title}** to position **${options.to}**.`,
        });
    }
}
