import { EventNames } from "hoshimi";
import { Constants } from "../../constants.js";
import { createLavalinkEvent } from "../../manager/events.js";
import { Sessions } from "../../manager/sessions.js";

export default createLavalinkEvent({
    name: EventNames.PlayerUpdate,
    async run(client, newPlayer) {
        await Sessions.save(newPlayer);

        if (Constants.Debug)
            client.debugger?.info(`Session: ${newPlayer.guildId} | Updated Session: ${JSON.stringify(Sessions.get(newPlayer.guildId))}`);
    },
});
