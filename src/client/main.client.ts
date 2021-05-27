
import * as customtypes from "shared/customtypes";
import {
	ReplicatedStorage,
	Workspace
} from "@rbxts/services";

const ReplicatedStorage_Events = ReplicatedStorage.WaitForChild("Events") as customtypes.ReplicatedStorage_Events;
const ReplicatedStorage_Sounds = ReplicatedStorage.WaitForChild("Sounds") as customtypes.ReplicatedStorage_Sounds;
const Workplace_Sounds = Workspace.WaitForChild("Sounds", 20) as Folder;

function play_sound(sound_to_play: Sound, volume: number, callback: (((...args: unknown[]) => unknown) | undefined) = undefined ) {
	
	let stp = Workplace_Sounds.FindFirstChild(sound_to_play.Name) as (Sound | undefined);
	if (! stp) {
		const cloned_sound = sound_to_play.Clone();
		cloned_sound.Parent = Workplace_Sounds;
		cloned_sound.Looped = false;
		stp = cloned_sound;
	}
	stp.Volume = volume;

	if (callback !== undefined) {
		let conn: (undefined | RBXScriptConnection) = undefined;
		conn = stp.Ended.Connect(()=>{
			callback();
			conn?.Disconnect();
			conn = undefined;
		});
	}
	stp.Play();
}
ReplicatedStorage_Events.PlaySound.Event.Connect((sound_resolvable: (string | Sound), volume: number = 0.5) => {
	let sound: (Sound | undefined) = undefined;
	if (typeIs(sound_resolvable, "string")) {
		sound = ReplicatedStorage_Sounds.FindFirstChild(sound_resolvable) as (Sound | undefined);
	} else {
		if (sound_resolvable.IsA("Sound")) {
			sound = sound_resolvable;
		}
	}
	if (sound) {
		play_sound(sound, volume, undefined);
	} else {
		print(`Failed to play sound, ${sound_resolvable}`);
	}
});



export {};