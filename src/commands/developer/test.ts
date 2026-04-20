import { Command, Declare, type GuildCommandContext, type MessageStructure, type WebhookMessageStructure } from "seyfert";
import { ms } from "../../utils/time";
import { wait } from "../../utils/utils";

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

        const requester = {
            id: ctx.author.id,
            username: ctx.author.username,
            tag: ctx.author.tag,
        };

        const tracks = await Promise.allSettled([
            await player.search({ query: "starting soon tiasu", requester }),
            await player.search({ query: "aishite aishite ado", requester }),
        ]).then((results) => results.filter((result) => result.status === "fulfilled").map((result) => result.value.tracks[0]));

        await player.queue.add(tracks);

        if (!player.isPlaying()) await player.play();

        await wait(ms("5s"));
        await player.skip();

        await wait(ms("5s"));
        const previous = await player.queue.previous();
        if (previous) await player.queue.unshift(previous);

        await player.skip();
    }
}
