import fs from "fs";
import spawns from "./spawns.json" assert { type: "json" };
import mobs from "./mobs.json" assert { type: "json" };
if (!fs.existsSync("./functions")) fs.mkdirSync("./functions");

for (const round of Object.entries(spawns.rounds)) {
	const commands = [];
	const mobsToSpawn = round[1];

	["north", "south", "east", "west"].forEach(v => {
		const coords = spawns.settings[v];

		for (const [nickname, amount] of Object.entries(mobsToSpawn[v])) {
			const mobData = mobs[nickname];
			const mobType = mobData.mobType;
			const NBT = mobData.nbt

			commands.push(`execute as @e[limit=${amount}] run summon minecraft:${mobType} ${coords} {${NBT}}`);
		}
	})

	fs.writeFileSync(`./functions/${round[0]}.mcfunction`, commands.join("\r\n"))
}