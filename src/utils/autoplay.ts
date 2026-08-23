import {
    type PlayerStructure,
    type QueryResult,
    SearchSources,
    SourceNames,
    type TrackResolvableStructure,
    type TrackStructure,
} from "hoshimi";

/**
 * The maximum number of tracks to be added to the queue.
 * @type {number}
 * @default 10
 */
const max: number = 10;

/**
 *
 * The autoplay function for the player.
 * @param {PlayerStructure} player The player for the autoplay function.
 * @param {TrackResolvableStructure | null} lastTrack The last track that was played.
 * @returns {Promise<void>} The promise for the autoplay function.
 */
export async function autoplayFn(player: PlayerStructure, lastTrack: TrackResolvableStructure | null): Promise<void> {
    if (!lastTrack) return;

    const isEnabled: boolean = !!(await player.data.get("enabledAutoplay")) || player.manager.options.queueOptions.autoPlay;
    if (!isEnabled) return;

    /**
     *
     * Filter the tracks to remove the last track and the previous tracks.
     * @param {TrackStructure[]} tracks The tracks to filter.
     * @returns {TrackStructure[]} The filtered tracks.
     */
    const filter = (tracks: TrackStructure[]): TrackStructure[] =>
        tracks.filter(
            (track): boolean =>
                !(
                    player.queue.history.some((t) => t.info.identifier === track.info.identifier) ||
                    lastTrack.info.identifier === track.info.identifier
                ),
        );

    switch (lastTrack.info.sourceName) {
        case SourceNames.Spotify: {
            if (!lastTrack.info.identifier) return;

            const query = await player.search({
                query: lastTrack.info.identifier,
                source: SearchSources.SpotifyTrackMix,
                requester: lastTrack.requester,
            });

            if (query.tracks.length) {
                const index: number = Math.floor(Math.random() * query.tracks.length);

                const track = filter(query.tracks)[index];
                if (!track) return;

                await player.queue.add(track);
            }

            break;
        }

        case SourceNames.Youtube:
        case SourceNames.YoutubeMusic: {
            if (!lastTrack.info.identifier) return;

            const query: QueryResult = await player.search({
                query: `https://www.youtube.com/watch?v=${lastTrack.info.identifier}&list=RD${lastTrack.info.identifier}`,
                requester: lastTrack.requester,
            });

            if (query.tracks.length) {
                const random: number = Math.floor(Math.random() * query.tracks.length);
                const tracks: TrackStructure[] = filter(query.tracks).slice(random, random + max);

                await player.queue.add(tracks);
            }
        }
    }
}
