import fs from "fs";
import spawns from "./spawns.json" assert { type: "json" };
if (!fs.existsSync("./functions")) fs.mkdirSync("./functions");

for (const round of Object.entries(spawns.rounds)) {
	const commands = [];
	const mobs = round[1];

	["north", "south", "east", "west"].forEach(v => {
		const coords = spawns.settings[v];

		mobs[v].forEach(mob => {
			commands.push(`summon minecraft:${mob} ${coords}`);
		})

	})

	fs.writeFileSync(`./functions/${round[0]}.mcfunction`, commands.join("\r\n"))
}