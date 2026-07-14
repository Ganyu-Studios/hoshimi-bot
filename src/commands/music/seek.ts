import { Command, createStringOption, Declare, type GuildCommandContext, Options } from "seyfert";
import { TimeFormat } from "../../utils/time.js";

const options = {
    position: createStringOption({
        description: "Position to seek (e.g. 1m30s, 30000 for ms).",
        required: true,
    }),
};

@Declare({
    name: "seek",
    description: "Seek to a specific position in the current track.",
    aliases: ["forward", "rewind"],
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
})
@Options(options)
export default class SeekCommand extends Command {
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

        if (!player.queue.current) return ctx.editOrReply({ content: "No track is currently playing." });

        const position = TimeFormat.toMs(options.position);
        if (Number.isNaN(position) || position < 0)
            return ctx.editOrReply({ content: "Invalid position format. Use something like `1m30s` or milliseconds." });

        await player.seek(position);

        await ctx.editOrReply({
            content: `Seeked to **${TimeFormat.toHumanize(position)}**.`,
        });
    }
}
