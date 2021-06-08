
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
const WorldChunks = new Instance("Folder", Workspace);
WorldChunks.Name = "WorldChunks";
// const WorldChunks = Workspace.WaitForChild("WorldChunks") as Folder;

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

	CenterOnVoxelLattice: true
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

	topLayerPartsArray: Part[];

	chunkSize: number;

	centerPartsWithVoxelLattice: boolean;

	chunkHeightMap: number[];

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

		this.topLayerPartsArray = [];
		this.partsArray = [];
		this.partsModel = new Instance("Model", WorldChunks);
		this.partsModel.Name = `Chunk${this.id}`;
		
		this.centerPartsWithVoxelLattice = Chunk.DefaultedCenterPartsWithVoxelLattice;

		this.chunkSize = worldgenGlobals.ChunkSize;
		this.chunkHeightMap = [];
		this.relativeHeightMap = [];
		this.temporaryHeightMap = [];

		Chunk.GlobalList.push(this);
	}

	create_initial_toplayer_parts() {
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

				this.topLayerPartsArray.push(part);
				this.partsArray.push(part);
			}
		}

		// print(`Parts Array size = ${this.partsArray.size()}`);
	}

	position_parts() {
		this.position_heightmap_top_parts();
		
		for (let x = 0; x < this.chunkSize; x += 1) {
			for (let z = 0; z < this.chunkSize; z += 1) {
				const partIndex = x * this.chunkSize + z;
				this.fill_in_vertical_gap_at_index(partIndex);
			}
		}
	}


	/**
	 * 
	 * @param partIndex 
	 * @returns 0 if NOT on the internal chunk boundary
	 * @returns 1 N - if sitting on North row
	 * @returns 2 E - if sitting on East col
	 * @returns 4 S - if sitting on South row
	 * @returns 8 W - if sitting on West col
	 * @returns 3 NE - if sitting on North-East corner; a corner-case.
	 * @returns 6 SE - if sitting on South-East corner; a corner-case.
	 * @returns 9 NW - if sitting on North-West corner; a corner-case.
	 * @returns 12 SW - if sitting on South-West corner; a corner-case.
	 */
	check_if_part_is_on_chunk_boundary(partIndex: number): number {

		// i wrote these down in general mathematical form, meaning array indexing starts at 1, not 0, like in LUA.
		// therefore, you'll see many minus-ones

		/**
		 * North = top row
		 * East = right col
		 * South = bottom row
		 * West = left col
		 */

		const north = 0 <= partIndex && partIndex <= (this.chunkSize - 1);
		const east  = ((partIndex + 1) % this.chunkSize === 0);
		const south = (((this.chunkSize - 1) * this.chunkSize) + 1 - 1) <= partIndex && partIndex <= ((this.chunkSize * this.chunkSize) - 1);
		const west  = (partIndex % this.chunkSize === 0);

		if (north || east || south || west) {
			// print(`true`);
			// is on the internal chunk boundary
			
			if (north && east) return 3;
			else if (south && east) return 6;
			else if (north && west) return 9;
			else if (south && west) return 12;
			else if (north) return 1;
			else if (east) return 2;
			else if (south) return 4;
			else if (west) return 8;
			else {
				print("this should not be called upon");
				return 0;
			}

		} else {
			// print(`false`);
			// is not on the boundary
			return 0;
		}

		return 0;
	}
	get_chunk_heightmap() {
		const chunkSize = this.chunkSize;
		const blockSize = worldgenGlobals.BlockSize;
		const chunkPositionOffset = new Vector3(
			this.posX * chunkSize,
			0,
			this.posZ * chunkSize
		);

		this.chunkHeightMap = [];
		for (let i=0; i < (this.chunkSize * this.chunkSize); i+=1) {
			this.chunkHeightMap.push(0);
		}

		for (let x = 0; x < this.chunkSize; x += 1) {
			for (let z = 0; z < this.chunkSize; z += 1) {
				const posX = x * blockSize + blockSize * 0.5 + blockSize * chunkPositionOffset.X;
				const posZ = z * blockSize + blockSize * 0.5 + blockSize * chunkPositionOffset.Z
				const heightMap_val = octave(
					posX / this.chunkSize,
					posZ / this.chunkSize,
					worldgenGlobals.Octaves
				);
				this.chunkHeightMap[x * chunkSize + z] = heightMap_val;
			}
		}
	}
	position_heightmap_top_parts() {

		this.get_chunk_heightmap();

		for (let x = 0; x < this.chunkSize; x += 1) {
			for (let z = 0; z < this.chunkSize; z += 1) {

				const partIndex = x * this.chunkSize + z;
				// print(`part index = ${partIndex}`);

				const part = this.topLayerPartsArray[partIndex];
				
				const posX = part.Position.X;
				const posZ = part.Position.Z;

				const heightMap_val = this.chunkHeightMap[x * this.chunkSize + z];
				let newPosY = worldgenGlobals.OffsetWorldHeight + (heightMap_val * worldgenGlobals.BlockSize * ReplicatedStorage_Dev.MaximumWorldHeight.Value);
				if (this.centerPartsWithVoxelLattice  || worldgenGlobals.CenterOnVoxelLattice ) {
					newPosY = math.ceil(newPosY / worldgenGlobals.BlockSize) * worldgenGlobals.BlockSize - worldgenGlobals.BlockSize * 0.5;
				}

				part.Position = new Vector3(
					posX,
					newPosY,
					posZ
				);
			}
		}

		// const delta = this.partsArray.size() - (this.chunkSize * this.chunkSize);
		// if (delta && delta > 0) {
		// 	for (let i = 0; i < delta; i += 1) {
		// 		const pt = this.partsArray[i];
		// 		pt.Position = this.partsArray[0].Position;
		// 		pt.Destroy();
		// 		this.partsArray.remove((this.chunkSize * this.chunkSize));
		// 	}
		// }

		this.get_relative_block_heights();
		
	}

	get_relative_block_heights() {
		// let min = worldgenGlobals.MaximumWorldHeight * 0.5;
		// let max = worldgenGlobals.MaximumWorldHeight * 0.5;
		// for (let part of this.partsArray) {
		// 	if (part.Position.Y < min) {
		// 		min = part.Position.Y;
		// 	}
		// 	if (part.Position.Y > max) {
		// 		max = part.Position.Y;
		// 	}
		// }

		let knownHeights = new Set<number>();
		this.partsArray.forEach((part) => {
			knownHeights.add(part.Position.Y);
		});

		const sorted = (function(){
			const thing = knownHeights;
			const thingval = [... thing];
			thingval.sort();
			return thingval;
		})();
		
		let relativeHeights: {[key: string]: number} = {};
		let i = 1;
		for (let heightval of sorted) {
			// should be smallest to largest
			relativeHeights[tostring(i)] = heightval;
			i = i + 1;
		}

		let relativeHeightMap: number[] = [];

		for (let part of this.partsArray) {
			const y = part.Position.Y;
			let chosenkey = "";
			for (let [key, val] of pairs(relativeHeights)) {
				if (y === val) {
					chosenkey = key as string;
					break;
				}
			}
			if (chosenkey !== "") {
				const numberform = tonumber(chosenkey);
				if (numberform) {
					relativeHeightMap.push(numberform);
				} else {
					print("ERRRRRRORRRRRR!!!!");
				}
			} else {
				print("Error!!!!!!!!!!!!!!!!!");
			}
		}

		this.relativeHeightMap = relativeHeightMap;
		// print(this.relativeHeightMap.join(" , "));
	}


	fill_in_vertical_gap_at_index(partIndex: number) {

		const currentPart = this.topLayerPartsArray[partIndex];
		const boundaryIndicator = this.check_if_part_is_on_chunk_boundary(partIndex);
		if ([3, 6, 9 ,12].includes(boundaryIndicator)) {
			currentPart.Color = Color3.fromRGB(255, 0, 0);
		} 
		else if (boundaryIndicator === 1) currentPart.Color = Color3.fromRGB(255, 70, 150);
		else if (boundaryIndicator === 2) currentPart.Color = Color3.fromRGB(255, 255, 90);
		else if (boundaryIndicator === 4) currentPart.Color = Color3.fromRGB(85, 255, 127);
		else if (boundaryIndicator === 8) currentPart.Color = Color3.fromRGB(85, 170, 255);
		else if (boundaryIndicator !== 0) {
			// it's on the internal chunk boundary
			currentPart.Color = Color3.fromRGB(235, 122, 56);
		} else {
			currentPart.Color = Color3.fromRGB(163, 162, 165);
		}


		if (boundaryIndicator === 0) {
			const neighbours = [
				// North
				this.topLayerPartsArray[partIndex - this.chunkSize],
				
				// East
				this.topLayerPartsArray[partIndex + 1],

				// South
				this.topLayerPartsArray[partIndex + this.chunkSize],

				// West
				this.topLayerPartsArray[partIndex - 1]
			];
			const maximumY = currentPart.Position.Y;
			let minimumY = math.huge;
			// now find the greatest negative displacement from current block to any of the neighbour-blocks
			for (let partBlock of neighbours) {
				if (partBlock.Position.Y < minimumY) {
					minimumY = partBlock.Position.Y;
				}
			}
			print(`MinimumY = ${minimumY}`);
			
			const deltaY = maximumY - minimumY;
			const deltaY_blockScale = deltaY / 4;
			const floored_deltaY_blockScale = math.floor(deltaY_blockScale);

			for (let i=0; i < floored_deltaY_blockScale; i+=1) {
				const newPart = new Instance("Part", this.partsModel);
				this.partsArray.push(newPart);
				newPart.Anchored = true;
				newPart.CanCollide = true;
				newPart.Material = Enum.Material.SmoothPlastic;
				newPart.Size = new Vector3(worldgenGlobals.BlockSize, worldgenGlobals.BlockSize, worldgenGlobals.BlockSize);
				newPart.Position = new Vector3(
					currentPart.Position.X,
					currentPart.Position.Y - ((i + 1) * worldgenGlobals.BlockSize),
					currentPart.Position.Z
				);
			}

		}

		// switch(boundaryIndicator) {
			
		// 	case 1:
		// 		// North
		// 		break;
		// 	case 2:
		// 		// East
		// 		break;
		// 	case 4:
		// 		// South
		// 		break;
		// 	case 8:
		// 		// West
		// 		break;
		// 	case 3:
		// 		// North East
		// 		break;
		// 	case 6:
		// 		// South East
		// 		break;
		// 	case 9:
		// 		// North West
		// 		break;
		// 	case 12:
		// 		// South West
		// 		break;


		// 	case 0:
		// 	default:
		// 		// default with zero
		// 		break;
		// }


		return 1;
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
		this.create_initial_toplayer_parts();
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




// let abcd = [];
// for (let i1 = -2; i1 < 2; i1 += 1) {
// 	for (let i2 = -2; i2 < 2; i2 += 1) {
// 		abcd.push([i1, i2]);
// 	}
// }
// abcd.forEach((subarr) => {
// 	const newChunk = new Chunk(subarr[0], subarr[1]);
// 	newChunk.init();
// });




const bob = new Chunk(1, 1);
bob.init();

const sam = new Chunk(1, 2);
sam.init();

// wait(2);
// bob.destroy();



ReplicatedStorage_Events.Regenerate.OnServerEvent.Connect((player: Player, _params) => {

	World.UponRegenerateRequest();
	// WorldGen.init();
});


// WorldGen.init();









export {};