import { Command, createIntegerOption, Declare, type GuildCommandContext, Options } from "seyfert";

const options = {
    volume: createIntegerOption({
        description: "Volume level (0-1000).",
        min_value: 0,
        max_value: 1000,
    }),
};

@Declare({
    name: "volume",
    description: "Set or check the player volume.",
    aliases: ["vol", "v"],
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
})
@Options(options)
export default class VolumeCommand extends Command {
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

        if (options.volume !== undefined) {
            await player.setVolume(options.volume);

            return ctx.editOrReply({ content: `Volume set to **${options.volume}%**.` });
        }

        return ctx.editOrReply({ content: `Current volume is **${player.volume}%**.` });
    }
}
