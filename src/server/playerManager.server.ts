
import {
	Workspace,
	Players
} from "@rbxts/services";
import * as customtypes from "shared/customtypes";


function when_player_added(player: Player) {

	player.CharacterAdded.Connect((ch) => {
		when_character_added(ch as customtypes.Dummy_Character);
	});
	player.CharacterRemoving.Connect((ch) => {
		when_character_removed(ch);
	});

	print(`${player.Name} joined the game!`);
}

function when_player_removing(player: Player) {
	print(`${player.Name} is leaving the game.`);
}

function when_character_added(ch: customtypes.Dummy_Character) {

	ch.Humanoid.BodyHeightScale.Value = 1.75;

	print(`${ch.Name} added to workspace`);
}

function when_character_removed(ch: Model) {
	print(`${ch.Name} removed from workspace.`);
}

Players.PlayerAdded.Connect((pl) => {
	when_player_added(pl);
});
Players.PlayerRemoving.Connect((pl) => {
	when_player_removing(pl);
});




export {};