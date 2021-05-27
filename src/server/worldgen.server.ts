
import Object from "@rbxts/object-utils";
import {
	ReplicatedStorage,
	RunService,
	Workspace

} from "@rbxts/services";
import * as customtypes from "shared/customtypes";
import * as Utility from "shared/utility";
const ReplicatedStorage_Events = ReplicatedStorage.WaitForChild("Events") as customtypes.ReplicatedStorage_Events;
const ReplicatedStorage_Dev = ReplicatedStorage.WaitForChild("Dev") as customtypes.ReplicatedStorage_Dev;

const blocksFolder = new Instance("Folder", Workspace);
blocksFolder.Name = "BlocksFolder";

wait(1);
const WorldChunks = Workspace.WaitForChild("WorldChunks") as Folder;

wait(5);

interface WorldgenGlobals {
	"ChunkSize": number;
	"MaximumChunkLoadingDistance": number;
	"BlockSize": number;
	"Seed": number;
	"Persistance": number;
	"Lacunarity": number;
	"MaximumWorldHeight": number;
	"MinimumWorldHeight": number;
	"Octaves": number;
	"CanvasX": number;
	"CanvasZ": number;
	"OffsetWorldHeight": number;
	"CenterOnVoxelLattice": boolean;
	[key: string]: (number | boolean);
};
let worldgenGlobals: WorldgenGlobals = {
	ChunkSize: 16,
	MaximumChunkLoadingDistance: 64,
	BlockSize: 4,
	Seed: 0,
	Persistance: 1.15,
	Lacunarity: 0.78,
	MaximumWorldHeight: 256,
	MinimumWorldHeight: 0,
	Octaves: 16,

	CanvasX: 16,
	CanvasZ: 16,

	OffsetWorldHeight: 4,

	CenterOnVoxelLattice: false
};


class World {
	static WhenInspectorChanged() {
		// resize_canvas();

		Chunk.GlobalList.forEach((chunk) => {
			chunk.position_parts();
		});

		print("You changed something!");
	}


	static UponRegenerateRequest() {
		Chunk.GlobalList.forEach((chunk) => {
			chunk.position_parts();
		});
	}
};

type abc = keyof WorldgenGlobals;

ReplicatedStorage_Dev.ClearAllChildren();
for (let key of (Object.keys(worldgenGlobals) as string[] as unknown[] as abc[] )) {
	let val = worldgenGlobals[key]! as (boolean | number);
	if (type(val) === "number") {
		const numValue = new Instance("NumberValue", ReplicatedStorage_Dev);
		numValue.Name = `${key}`;
		numValue.Value = val as number;
		numValue.GetPropertyChangedSignal("Value").Connect(()=>{
			worldgenGlobals[key]! = numValue.Value!;
			World.WhenInspectorChanged();
		});
	} else if (type(val) === "boolean") {
		const boolValue = new Instance("BoolValue", ReplicatedStorage_Dev);
		boolValue.Name = `${key}`;
		boolValue.Value = val as boolean;
		boolValue.GetPropertyChangedSignal("Value").Connect(()=>{
			worldgenGlobals[key]! = boolValue.Value!;
			World.WhenInspectorChanged();
		});
	}
}




let _perlinNoise = math.randomseed(4);

/**
 * 
 * @param val The provided value to alter.
 * @param smin The original expected minimum.
 * @param smax The original expected maximum.
 * @param emin Alteration's expected minimum.
 * @param emax Alteration's expected maximum.
 * @returns The inputted value mapped to range defined by emin and emax.
 */
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

	const epsillon = 0.002 * (math.random() * 2 - 1);
	for (let i=0; i<octaves; i+=1) {
		val += noise((nx + epsillon) * frequency, (ny + epsillon) * frequency) * amplitude;
		max += amplitude;
		// amplitude = amplitude / 2;
		amplitude *= worldgenGlobals.Persistance;
		
		// frequency = frequency * 2;
		frequency *= worldgenGlobals.Lacunarity;

		// ^ change these dynamically in-editor to see changes take effect
		// by default
		// Persistance value = 0.5
		// Lacunarity  value = 2;

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


let abc = coroutine.wrap(function(){
	resize_canvas();

	RunService.Heartbeat.Connect(()=>{
		kx = kx + 0.05;

		// position_blocks(kx, kz);

		timesRan = timesRan + 1;
		if (timesRan > 2000) {
			coroutine.yield();
		}
	});
	
});
// abc();







class Chunk {

	static RunningId: number = 1;
	static GlobalList: (Chunk)[] = [];
	static DefaultedCenterPartsWithVoxelLattice: boolean = false;

	id: number;
	posX: number;
	posZ: number;

	partsArray: Part[];
	partsModel: Model;

	chunkSize: number;

	centerPartsWithVoxelLattice: boolean;

	/**
	 * A relative heightmap for the blocks in this chunk.
	 * 0 is base level blocks,
	 * higher numbers mean higher altitude blocks.
	 * Blocks on the same Y-elevation will have the same relative height.
	 * Relative heights have delta of 1, whereas Absolute height can have disparity of any number of studs.
	 * 
	 * This _should_ be a Number Matrix (2d array).
	 */
	relativeHeightMap: number[];
	temporaryHeightMap: Array<Array<unknown>>;

	constructor(posX: number, posZ: number) {
		// note, X and Z, neither of them face directly upwards.
		// the Y axis is for "direct up".
		this.id = Chunk.RunningId++;
		
		this.posX = posX;
		this.posZ = posZ;

		this.partsArray = [];
		this.partsModel = new Instance("Model", WorldChunks);
		this.partsModel.Name = `Chunk${this.id}`;
		
		this.centerPartsWithVoxelLattice = Chunk.DefaultedCenterPartsWithVoxelLattice;

		this.chunkSize = worldgenGlobals.ChunkSize;
		this.relativeHeightMap = [];
		this.temporaryHeightMap = [];

		Chunk.GlobalList.push(this);
	}

	create_parts() {
		const blockSize = worldgenGlobals.BlockSize;
		const chunkSize = this.chunkSize;
		const halfChunkSize = chunkSize / 2;
		const chunkSizeSquared = chunkSize * chunkSize;

		const chunkPositionOffset = new Vector3(
			this.posX * chunkSize,
			0,
			this.posZ * chunkSize
		);

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

					x * blockSize + blockSize * 0.5 + blockSize * chunkPositionOffset.X,
					worldgenGlobals.OffsetWorldHeight,
					z * blockSize + blockSize * 0.5 + blockSize * chunkPositionOffset.Z
				);

				this.partsArray.push(part);
			}
		}
	}
	position_parts() {

		for (let x = 0; x < this.chunkSize; x += 1) {
			for (let z = 0; z < this.chunkSize; z += 1) {
				const part = this.partsArray[x * this.chunkSize + z];
				
				const posX = part.Position.X, posZ = part.Position.Z;

				let newPosY = worldgenGlobals.OffsetWorldHeight + octave(
					posX / this.chunkSize,
					posZ / this.chunkSize,
					worldgenGlobals.Octaves
				) * worldgenGlobals.BlockSize * ReplicatedStorage_Dev.MaximumWorldHeight.Value;
				if (this.centerPartsWithVoxelLattice  || worldgenGlobals.CenterOnVoxelLattice ) {
					newPosY = math.ceil(newPosY / worldgenGlobals.BlockSize) * worldgenGlobals.BlockSize - worldgenGlobals.BlockSize * 0.5;
				}

				
				// this.temporaryHeightMap.push(
				// 	[part, math.round(map(newPosY, 0, worldgenGlobals.MaximumWorldHeight, 0, worldgenGlobals.MaximumWorldHeight * worldgenGlobals.BlockSize))]
				// );


				part.Position = new Vector3(
					posX,
					newPosY,
					posZ
				);
			}
		}

		// let min = worldgenGlobals.MaximumWorldHeight * 2;
		// let max = worldgenGlobals.MaximumWorldHeight * 2;
		// this.relativeHeightMap = this.temporaryHeightMap.map((subarr) => {
		// 	const sub1 = subarr[1] as number;
		// 	min = (sub1 < min) ? sub1 : min;
		// 	max = (sub1 > max) ? sub1 : max;
		// 	return min++;
		// }).map((val) => val - (max - min));

		// print(this.relativeHeightMap.join(" , "));
	}



	destroy_parts() {
		this.partsArray = [];
		this.partsModel.Destroy();
		// let model handle cleanup of all parts children
		
	}


	init() {

		this.partsModel.SetAttribute("CenterPartsWithVoxelLattice", Chunk.DefaultedCenterPartsWithVoxelLattice);
		this.partsModel.GetAttributeChangedSignal("CenterPartsWithVoxelLattice").Connect(()=>{
			this.centerPartsWithVoxelLattice = this.partsModel.GetAttribute("CenterPartsWithVoxelLattice") as boolean;
			this.position_parts();
		});

		// wait(1);
		this.create_parts();
		// wait(2);
		this.position_parts();
		print(`New Chunk #${this.id} at position XZ(${this.posX} , ${this.posZ})`);
		wait(0.2);
	}

	destroy() {
		const id = this.id;
		this.destroy_parts();
		[ Chunk.GlobalList[this.id], Chunk.GlobalList[Chunk.GlobalList.size() - 1] ] = [ Chunk.GlobalList[Chunk.GlobalList.size() - 1], Chunk.GlobalList[this.id] ];
		Chunk.GlobalList.pop();
		print(`Destroyed Chunk #${id}.`);
	}
};



// wait(4);




let abcd = [];
for (let i1 = -2; i1 < 2; i1 += 1) {
	for (let i2 = -2; i2 < 2; i2 += 1) {
		abcd.push([i1, i2]);
	}
}
abcd.forEach((subarr) => {
	const newChunk = new Chunk(subarr[0], subarr[1]);
	newChunk.init();
});




// const bob = new Chunk(1, 1);
// bob.init();

// const sam = new Chunk(1, 2);
// sam.init();

// wait(2);
// bob.destroy();



ReplicatedStorage_Events.Regenerate.OnServerEvent.Connect((player: Player, _params) => {

	World.UponRegenerateRequest();
	// WorldGen.init();
});


// WorldGen.init();









export {};