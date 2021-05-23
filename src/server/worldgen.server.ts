
import Object from "@rbxts/object-utils";
import {
	ReplicatedStorage,
	RunService,
	Workspace

} from "@rbxts/services";
import * as customtypes from "shared/customtypes";
const ReplicatedStorage_Events = ReplicatedStorage.WaitForChild("Events") as customtypes.ReplicatedStorage_Events;
const ReplicatedStorage_Dev = ReplicatedStorage.WaitForChild("Dev") as customtypes.ReplicatedStorage_Dev;

const blocksFolder = new Instance("Folder", Workspace);
wait(15);


let worldgenGlobals = {
	ChunkSize: 16,
	MaximumChunkLoadingDistance: 64,
	BlockSize: 4,
	Seed: 0,
	Persistance: 0.5,
	Lacunarity: 2,
	MaximumWorldHeight: 256,
	MinimumWorldHeight: 0,

	CanvasX: 16,
	CanvasZ: 16,

	OffsetWorldHeight: 4
};

class World {
	static WhenInspectorChanged() {
		resize_canvas();
		print("You changed something!");
	}
};

ReplicatedStorage_Dev.ClearAllChildren();
for (let key of Object.keys(worldgenGlobals)) {
	let val = worldgenGlobals[key];
	if (type(val) === "number") {
		const numValue = new Instance("NumberValue", ReplicatedStorage_Dev);
		numValue.Name = `${key}`;
		numValue.Value = val;
		numValue.GetPropertyChangedSignal("Value").Connect(()=>{
			worldgenGlobals[key] = numValue.Value;
			World.WhenInspectorChanged();
		});
	}
}




let _perlinNoise = math.randomseed(4);
function map(val: number, smin: number, smax: number, emin: number, emax: number): number {
	const t = (val - smin) / (smax - smin);
	return (emax - emin) * t + emin;
}
function noise(nx: number, ny: number) {
	return map(math.noise(nx, ny), -1, 1, 0, 1);
}

// stack noisefields

function octave(nx: number, ny: number, octaves: number) {
	let val = 0;
	let frequency = 1;
	let max = 0;
	let amplitude = 1;

	for (let i=0; i<octaves; i+=1) {
		val += noise(nx * frequency, ny * frequency) * amplitude;
		max += amplitude;
		amplitude = amplitude / 2;
		frequency = frequency * 2;
	}

	return val / max;
}




let kx = 0;
let kz = 0;
let valid = true;
let timesRan = 0;
// let heightModifier = ReplicatedStorage_Dev.HeightModifier;
let chunkSize = ReplicatedStorage_Dev.ChunkSize;
let canvasX = ReplicatedStorage_Dev.CanvasX;
let canvasZ = ReplicatedStorage_Dev.CanvasZ;


function resize_canvas() {
	blocksFolder.ClearAllChildren();
	for (let ix = 0; ix < math.floor(canvasX.Value); ix += 1) {
		for (let iz = 0; iz < math.floor(canvasZ.Value); iz += 1) {
			const part = new Instance("Part", blocksFolder);
			part.Size = new Vector3(4, 4, 4);
			part.Anchored = true;
			part.CanCollide = true;
			part.Position = new Vector3(ix, 4, iz);
		}
	}
}
// canvasX.GetPropertyChangedSignal("Value").Connect(()=>{
	
// });
// canvasZ.GetPropertyChangedSignal("Value").Connect(()=>{
// 	resize_canvas();
// });
chunkSize.GetPropertyChangedSignal("Value").Connect(()=>{
	// resize_canvas();
	position_blocks(math.floor(canvasX.Value), math.floor(canvasZ.Value));
});

function position_blocks(deltaX: number, deltaZ: number) {
	const children = blocksFolder.GetChildren() as Part[];
	let index = 0;
	let ix = 0;
	let iz = 0;

	for (index = 0; index < children.size(); index += 1) {

		const part = children[index];
		part.Position = new Vector3(
			ix * 4,
			octave(
				(deltaX + ix) / chunkSize.Value, 
				(deltaZ + iz) / chunkSize.Value, 
				16
			) * 4 * ReplicatedStorage_Dev.MaximumWorldHeight.Value,
			iz * 4
		);


		ix = ix + 1;
		if (ix >= canvasX.Value) {
			ix = 0;
			iz = iz + 1;
		}
		if (iz >= canvasZ.Value) {
			iz = 0;
			// something
		}
	}
}

let abc = coroutine.wrap(function(){
	resize_canvas();

	RunService.Heartbeat.Connect(()=>{
		kx = kx + 0.05;

		position_blocks(kx, kz);

		timesRan = timesRan + 1;
		if (timesRan > 2000) {
			coroutine.yield();
		}
	});
	
});
abc();








class Chunk {
	posX: number;
	posZ: number;

	partsArray: Part[];
	partsModel: Model;

	constructor(posX: number, posZ: number) {
		// note, X and Z, neither of them face directly upwards.
		// the Y axis is for "direct up".

		this.posX = posX;
		this.posZ = posZ;

		this.partsArray = [];
		this.partsModel = new Instance("Model", Workspace); 
	}

	create_parts() {
		const blockSize = worldgenGlobals.BlockSize;
		const chunkSize = worldgenGlobals.ChunkSize;
		const halfChunkSize = chunkSize / 2;
		const chunkSizeSquared = chunkSize * chunkSize;

		const chunkPositionOffset = new Vector3(
			this.posX * chunkSize,
			0,
			this.posZ * chunkSize
		)

		for (let x = 0; x < chunkSize; x += 1) {
			for (let z = 0; z < chunkSize; z += 1) {
				const part = new Instance("Part", this.partsModel);
				part.Size = new Vector3(
					blockSize,
					blockSize,
					blockSize
				);
				part.Anchored = true;
				part.CanCollide = true;
				part.Material = Enum.Material.SmoothPlastic;
				
				// set default position
				part.Position = new Vector3(
					x * blockSize + chunkPositionOffset.X - halfChunkSize,
					worldgenGlobals.OffsetWorldHeight,
					z * blockSize + chunkPositionOffset.Z - halfChunkSize
				);

				this.partsArray.push(part);
			}
		}
	}
	position_parts() {

	}


};








ReplicatedStorage_Events.Regenerate.OnServerEvent.Connect((player: Player, _params) => {

	
	// WorldGen.init();
});


// WorldGen.init();









export {};