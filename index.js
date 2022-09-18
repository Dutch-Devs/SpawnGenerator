// Welcome to hell 🔥🔥🔥🔥🔥🔥🔥

const fs = require("fs");

const SETTINGS = {
	"North": "32.00 12.00 -3.00",
	"South": "32.00 12.00 35.00",
	"East": "51.00 12.00 16.00",
	"West": "13.00 12.00 16.00",
	"globalNBT": "Team: \"mobs\""
};

const log = console.log; // lazy lol

// Top level await wasn't working, didn't bother trying to figure out why :D
(async () => {
	const csv = require("csvtojson");

	// CONVERT MOBS.CSV TO JASON :D
	const mobsArrayCsv = await csv().fromFile("./mobs.csv");
	const mobsArrayParsed = {};

	for (const mob of mobsArrayCsv) {
		if (mob["Has baby"] === "true") {
			const copy = Object.assign({}, mob);
			copy.MobType = "baby_" + copy.MobType;
			copy["Has baby"] = "false";

			mobsArrayCsv.push(copy);
		}

		const mobLevel = mob.Level.slice(-1) !== "s" ? `_${mob.Level.slice(-1)}` : "";
		const jockey = mob.Name.toLowerCase().match("jockey") ? "_jockey" : "";
		const mobName = mob.MobType + jockey + mobLevel;

		let mobNBT = SETTINGS.globalNBT + "," + mob.NBT;
		if (mob.HP !== "") {
			mobNBT = SETTINGS.globalNBT + "," + `Attributes:[{Name:"generic.max_health",Base:${mob.HP}}],Health:${mob.HP},` + mob.NBT;
		}

		mobsArrayParsed[mobName] = {
			mobType: mob.MobType,
			nbt: mobNBT
		}
	}

	// CONVERT ROUNDS TO MCFUNCTION POGGERS
	const roundsArrayCsv = await csv().fromFile("./rounds.csv");

	for (const round of roundsArrayCsv) {
		const commands = [];
		let count = 0;

		["North", "South", "East", "West"].forEach(v => {
			if (round[v] === '') return;

			const coords = SETTINGS[v];
			const mobsToSpawn = round[v].split("\n")


			mobsToSpawn.forEach(mob => {
				const amount = mob.match(/\d* /)?.[0].replace(" ", "") ?? 1;
				count += +amount;
				if (mob.match(/bat|jockey/g)) count++;
				const mobName = mob.replace(/\d* /, "");
				if (!mobName) return;

				// ALL MOBS
				if (mobName === "all_mobs") {
					count = 0;
					let coords = SETTINGS.North

					Object.keys(mobsArrayParsed).forEach(mob => {
						const amount = mob.match(/\d* /)?.[0].replace(" ", "") ?? 1;
						count += amount;

						const mobbie = mobsArrayParsed[mob];
						if (mobbie.mobType === "wither") return;

						if (mobbie.mobType.match("baby")) {
							mobbie.mobType = mobbie.mobType.replace("baby_", "");
							mobbie.nbt = mobbie.nbt + ",IsBaby:true";
						}

						mobbie.nbt = mobbie.nbt.replace(/,+/g, ",");

						commands.push(`execute as @e[limit=${amount}] run summon minecraft:${mobbie.mobType} ${coords} {${mobbie.nbt}}`);
						coords = coords == SETTINGS.North ? SETTINGS.South : coords == SETTINGS.South ? SETTINGS.East : coords == SETTINGS.East ? SETTINGS.West : coords == SETTINGS.West ? SETTINGS.North : "lol";
					})

					return;
				}

				// BATS
				if (mobName.match("bat")) {
					const mobbie = mobsArrayParsed[mobName.replace("bat_", "")]
					if (mobbie.mobType.match("baby")) {
						mobbie.mobType = mobbie.mobType.replace("baby_", "");
						mobbie.nbt = mobbie.nbt + ",IsBaby:true";
					}

					mobbie.nbt = mobbie.nbt.replace(/,+/g, ",");

					commands.push(`execute as @e[limit=${amount}] run summon minecraft:bat ${coords} {Passengers:[{id:"minecraft:${mobbie.mobType}",${mobbie.nbt}}]}`)
					return;
				};

				const mobbie = mobsArrayParsed[mobName];
				if (mobbie.mobType.match("baby")) {
					mobbie.mobType = mobbie.mobType.replace("baby_", "");
					mobbie.nbt = mobbie.nbt + ",IsBaby:true";
				}

				mobbie.nbt = mobbie.nbt.replace(/,+/g, ",");
				let fixWeirdBug = mobbie.nbt.replace(/(Passengers:\[\{id: \"\w*\",)/g, `$1${SETTINGS.globalNBT},`); // genuinely no idea

				commands.push(`execute as @e[limit=${amount}] run summon minecraft:${mobbie.mobType} ${coords} {${fixWeirdBug}}`);
			})
		})

		commands.push(`scoreboard players set dt max_mobs ${count}`);
		commands.push(`function cd:round/loadvalues`);

		fs.writeFileSync(`./functions/${round.Round}.mcfunction`, commands.join("\r\n"))
	}

})()