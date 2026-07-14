import { LoopMode } from "hoshimi";
import { Command, Declare, Embed, type GuildCommandContext } from "seyfert";
import { EmbedColors, Formatter } from "seyfert/lib/common/index.js";
import { TimeFormat } from "../../utils/time.js";

const loopLabels: Record<LoopMode, string> = {
    [LoopMode.Track]: "Track",
    [LoopMode.Queue]: "Queue",
    [LoopMode.Off]: "Off",
};

@Declare({
    name: "nowplaying",
    description: "Show the currently playing track.",
    aliases: ["np", "current"],
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
})
export default class NowPlayingCommand extends Command {
    override async run(ctx: GuildCommandContext) {
        const { client } = ctx;

        const player = client.manager.getPlayer(ctx.guildId);
        if (!player) return ctx.editOrReply({ content: "No player found." });

        const current = player.queue.current;
        if (!current) return ctx.editOrReply({ content: "No track is currently playing." });

        const requester = current.requester;
        const duration = TimeFormat.toHumanize(current.info.length) || "Unknown";

        const embed = new Embed()
            .setTitle(current.info.title)
            .setURL(current.info.uri)
            .setThumbnail(current.info.artworkUrl ?? undefined)
            .addFields(
                {
                    name: "Author",
                    value: current.info.author,
                    inline: true,
                },
                {
                    name: "Duration",
                    value: duration,
                    inline: true,
                },
                {
                    name: "Position",
                    value: `${TimeFormat.toDotted(player.position)} / ${TimeFormat.toDotted(player.position)}`,
                    inline: true,
                },
                {
                    name: "Volume",
                    value: `${player.volume}%`,
                    inline: true,
                },
                {
                    name: "Loop",
                    value: loopLabels[player.loop],
                    inline: true,
                },
                {
                    name: "Requester",
                    value: Formatter.userMention(requester.id),
                    inline: true,
                },
            )
            .setFooter({ text: `Node: ${player.node.id}` })
            .setColor(player.paused ? EmbedColors.Yellow : EmbedColors.Green);

        if (player.paused) embed.setDescription("**⏸ Paused**");

        await ctx.editOrReply({ embeds: [embed] });
    }
}
