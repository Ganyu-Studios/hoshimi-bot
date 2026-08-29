import { mkdir } from "node:fs/promises";
import type { NodeOptions, Omit, PlayerJSON, PlayerStructure } from "hoshimi";
import MeowDB from "meowdb";
import type { MakeRequired, RestOrArray } from "seyfert/lib/common/index.js";
import { Constants } from "../constants.js";
import { ms } from "../utils/time.js";
import { omitKeys } from "../utils/utils.js";

/**
 * Lavalink node options without the `sessionId`.
 */
//i don't know how to name this type, so i just called like this
type NonResumableNodeOptions = Omit<NodeOptions, "sessionId">;

/**
 * The player json with the required properties.
 */
type RequiredPlayerJson = MakeRequired<PlayerJSON>;

/**
 * The directory where the cache is stored.
 * @type {string}
 */
const dir: string = Constants.SessionsPath();

// Create the directory if it doesn't exist
await mkdir(dir, { recursive: true });

/**
 * The name of the sessions file without the `.json` extension.
 * @type {string}
 */
const name: string = Constants.SessionsFile.replace(/\.json$/i, "");

/**
 * The storage for player sessions.
 * @type {MeowDB}
 */
const storage: MeowDB = new MeowDB({ dir, name });

/**
 * The session ids of the nodes.
 * @type {Map<string, string>}
 */
const ids: Map<string, string> = new Map<string, string>(
    Object.values<RequiredPlayerJson>(storage.all())
        .filter(
            (session): session is RequiredPlayerJson =>
                typeof session.node === "object" && typeof session.node.id === "string" && typeof session.node.sessionId === "string",
        )
        .map((session) => [session.node.id, session.node.sessionId!]),
);

/**
 * Utility to manage Lavalink node sessions.
 */
export const Sessions = {
    /**
     *
     * Set the session of the player.
     * @param {string} id The id of the session
     * @param {string} value The value of the session.
     * @returns {void} Saves the session to storage.
     */
    set<T>(id: string, value: T): void {
        storage.set<T>(id, value);
        return;
    },
    /**
     * Get the session of the player.
     * @param {string} id The id of the session.
     * @returns {T | undefined} The value of the session.
     */
    get<T>(id: string): T | undefined {
        return storage.get<T>(id);
    },
    /**
     * Delete the session of the player.
     * @param {string} id The id of the session.
     * @returns {boolean} Whether the session was deleted or not.
     */
    delete(id: string): boolean {
        // this throws an error if there's no session with the id.
        return storage.exists(id) && storage.delete(id);
    },
    /**
     * Resolves the  node options to include the session id.
     * @param {RestOrArray<NonResumableNodeOptions>} nodes The nodes to resolve.
     * @returns {LavalinkNodeOptions[]} The resolved nodes.
     */
    resolve(...nodes: RestOrArray<NonResumableNodeOptions>): NodeOptions[] {
        nodes = nodes.flat();

        if (nodes.some((node) => "sessionId" in node && typeof node.sessionId === "string"))
            throw new Error("The 'sessionId' property is not allowed in the node options.");

        return nodes.map((node) => {
            // default settings, if not set by the user.
            node.id ??= `${node.host}:${node.port}`;
            node.retryAmount ??= 25;
            node.retryDelay ??= ms("25s");

            return {
                ...node,
                sessionId: ids.get(node.id),
            };
        });
    },
    /**
     *
     * Snapshot a player into its persisted session, so it can be recreated after a restart, node resume or a 24/7
     * autoreconnect. Mirrors the shape read back by `resumeListener` and the destroy autoreconnect. Callers gate
     * this on `config.sessions.enabled`.
     * @param {PlayerStructure} player The player to persist.
     * @returns {Promise<void>} A promise that resolves once the session is written.
     */
    async save(player: PlayerStructure): Promise<void> {
        const newPlayerJson: PlayerJSON = player.toJSON();
        const newJson = omitKeys(newPlayerJson, [
            "ping",
            "createdTimestamp",
            "lastPositionUpdate",
            "paused",
            "playing",
            "queue",
            "filters",
        ]);

        const requester = player.queue.current?.requester ?? {};
        const autoplay = await player.data.get("enabledAutoplay");
        const lyrics = await player.data.get("enabledLyrics");
        const lyricsId = await player.data.get("lyricsId");

        this.set(player.guildId, {
            ...newJson,
            requester,
            enabledAutoplay: autoplay,
            enabledLyrics: lyrics,
            lyricsId: lyricsId,
            messageId: player.textId,
            node: {
                id: player.node.id,
                sessionId: player.node.sessionId,
            },
        });
    },
};
