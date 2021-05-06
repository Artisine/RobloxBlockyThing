import {
	ReplicatedStorage,
	Workspace

} from "@rbxts/services";
import * as customtypes from "shared/customtypes";
const ReplicatedStorage_Events = ReplicatedStorage.WaitForChild("Events") as customtypes.ReplicatedStorage_Events;

const blocksFolder = new Instance("Folder", Workspace);
wait(5);


















interface WorldGenParameters {
	scale: number;
	persistence: number;
	lacunarity: number;
	octaves: number;
	exponentiation: number;
	height: number;
};

class WorldGen {

	static parameters = {
		scale: 376,
		persistence: 4,
		lacunarity: 2,
		octaves: 4,
		exponentiation: 3,
		height: 10
	}
	static update_paramaters(new_parameters: WorldGenParameters) {
		this.parameters = new_parameters;
		return this;
	}
	

	static noiseMap = new Map<string, number>();

	static blockSize = new Vector3(4, 4, 4);
	static chunkSize = new Vector3(16, 16, 16);

	static init() {

		blocksFolder.ClearAllChildren();

		for (let x = 0; x < 100; x += 1) {
			for (let z = 0; z < 100; z += 1) {
				this.noiseMap.set(`${x}.${z}`, this.compute_fbm(x, z));
			}
		}

		for (let [key, heightVal] of this.noiseMap) {
			const part = new Instance("Part", blocksFolder);
			part.Size = new Vector3(1, 1, 1);
			part.Anchored = true;
			part.CanCollide = true;
			part.Material = Enum.Material.SmoothPlastic;
			part.Color = new Color3(0, 0, 0).Lerp(new Color3(1, 1, 1), heightVal / this.parameters.height);
			part.Position = new Vector3(
				tonumber(key.split(".")[0]),
				heightVal,
				tonumber(key.split(".")[1])
			);
		}
	}

	static compute_fbm(x: number, y: number) {
		const x_scale = x /  this.parameters.scale;
		const y_scale = y /  this.parameters.scale;

		const G = 2 ** (- this.parameters.persistence);
		let amplitude = 1;
		let frequency = 1;
		let normalisation = 0;
		let total = 0;

		for (let octave = 0; octave <  this.parameters.octaves; octave += 1) {
			const noiseValue = math.noise(x_scale * frequency, y_scale * frequency) * 0.5 + 0.5;
			total += noiseValue * amplitude;
			normalisation += amplitude;
			amplitude *= G;
			frequency *=  this.parameters.lacunarity;
		}
		total /= normalisation;

		return math.pow(total,  this.parameters.exponentiation) *  this.parameters.height;
	}



};




ReplicatedStorage_Events.Regenerate.OnServerEvent.Connect((player: Player, _params) => {
	const params = _params as WorldGenParameters;
	
	WorldGen.init();
});


WorldGen.init();









export {};