
import Object from "@rbxts/object-utils";
import {
	ReplicatedStorage,
	RunService,
	Workspace,
	Players
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

	
	static Settings = {
		// RenderDistance, the number of Chunks visible in a straight line, in front of a Player, before Chunk Disposal occurs
		// Render Distance measured in number of Chunks.
		RenderDistance: 5
	};

	static ChunkGenerationCoroutine: (thread | undefined) = undefined;
	static ChunkDeletionCoroutine: (thread | undefined) = undefined;
	static ChunkGenerationIsPaused: boolean = false;

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

	static GetAllPlayersCurrentChunkLocations() {
		let playerChunkPositionsMap = new Map<Player["UserId"], Vector3>();
		for (let player of Players.GetPlayers()) {
			const char = player.Character! as Model;
			const playerPosition = char.GetPrimaryPartCFrame().Position;
			const normalisedChunkPosition = World.ConvertWorldCoordinateToChunkCoordinate(playerPosition);
			print(`${player.Name} is at Chunk(${normalisedChunkPosition.X}, ${normalisedChunkPosition.Z}).`);
			playerChunkPositionsMap.set(player.UserId, normalisedChunkPosition);
		}
		return playerChunkPositionsMap;
	}

	static CheckIfChunkAtCoordinateAlreadyExists(x: number, z: number): boolean {
		const abc = !!(Chunk.GlobalList.find((queryChunk) => {
			return queryChunk.positionId === `${x},${z}`;
		}));
		return abc;
	}
	static ConvertWorldCoordinateToChunkCoordinate(worldPos: Vector3): Vector3 {
		const normalisedChunkPosition = new Vector3(
			math.floor(worldPos.X / (worldgenGlobals.ChunkSize * worldgenGlobals.BlockSize)),
			math.floor(worldPos.Y / (worldgenGlobals.ChunkSize * worldgenGlobals.BlockSize)),
			math.floor(worldPos.Z / (worldgenGlobals.ChunkSize * worldgenGlobals.BlockSize))
		);
		return normalisedChunkPosition;
	}
	static GenerateChunksAtChunkPosition(pos: Vector3) {
		const x = pos.X;
		const z = pos.Z;

		let temporaryCoordinateStore = [];
		for (let ix = x-1; ix < x+2; ix += 1) {
			for (let iz = z-1; iz < z+2; iz += 1) {
				temporaryCoordinateStore.push(  [ix, iz]  );
			}
		}
		temporaryCoordinateStore.forEach((coord) => {
			if (! World.CheckIfChunkAtCoordinateAlreadyExists(coord[0], coord[1])) {
				const newChunk = new Chunk(coord[0], coord[1]);
				newChunk.init();
			}
		});
	}
	static GenerateChunksAroundWorldPosition(pos: Vector3) {
		const normalisedChunkPosition = this.ConvertWorldCoordinateToChunkCoordinate(pos);
		this.GenerateChunksAtChunkPosition(normalisedChunkPosition);
	}


	static DisposeOfChunksNotInRangeOfPlayers() {
		Chunk.DisposeOfChunksNotInRangeOfPlayers();
	}



	static Begin_ChunkLoops() {
		World.ChunkGenerationCoroutine = coroutine.create(function(){
			while(true) {
				const map_playerChunkPositions = World.GetAllPlayersCurrentChunkLocations();
				map_playerChunkPositions.forEach((chunkPos, playerUserId) => {
					World.GenerateChunksAtChunkPosition(chunkPos);
				});
				if (World.ChunkGenerationIsPaused) {
					break;
					// must manually resume the coroutine when un-pausing.
				}
				wait(5);
			}
			coroutine.yield();
		});
		World.ChunkDeletionCoroutine = coroutine.create(function(){
			while(true) {
				World.DisposeOfChunksNotInRangeOfPlayers();
				if (World.ChunkGenerationIsPaused) {
					break;
					// must manually resume the coroutine when un-pausing.
				}
				wait(10);
			}
			coroutine.yield();
		});


		coroutine.resume(World.ChunkGenerationCoroutine);
		coroutine.resume(World.ChunkDeletionCoroutine);
	}

	static init() {
		World.Begin_ChunkLoops();
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









class Chunk {

	static RunningId: number = 1;
	static GlobalList: (Chunk)[] = [];
	static DefaultedCenterPartsWithVoxelLattice: boolean = false;
	static GetChunkWithPositionId(positionId: string) {
		return this.GlobalList.find((queryChunk) => {
			return queryChunk.positionId === positionId;
		});
	}
	static DisposeOfChunksNotInRangeOfPlayers() {
		let normalisedPlayerPositions: Vector3[] = [];
		let playerPositions: Vector3[] = [];
		const players = Players.GetPlayers();
		if (players.size() <= 0) return;

		for (let player of players) {
			const char = player.Character! as Model;
			const playerPosition = char.GetPrimaryPartCFrame().Position;
			normalisedPlayerPositions.push(
				World.ConvertWorldCoordinateToChunkCoordinate(playerPosition)
			);
			playerPositions.push(playerPosition);
		}

		const chunksToBeDisposed = Chunk.GlobalList.filter((queryChunk) => {
			// get closest player to this queryChunk, first
			
			// let distances1: number[] = [];
			// distances1 = normalisedPlayerPositions.map((normalPos) => {
			// 	const deltaX = queryChunk.posX - normalPos.X;
			// 	const deltaZ = queryChunk.posZ - normalPos.Z;
			// 	return ((deltaX * deltaX) + (deltaZ * deltaZ)) ** 0.5;
			// });

			// const closestPlayerDelta1 = math.min(...distances1);
			// if (closestPlayerDelta1 > World.Settings.RenderDistance) {
			// 	// assigned for termination...
			// 	return true;
			// }

			let distances2: number[] = [];
			const tempMultiplier = worldgenGlobals.ChunkSize * worldgenGlobals.BlockSize;
			distances2 = playerPositions.map((playerPos) => {
				const deltaX = (queryChunk.posX * tempMultiplier + (tempMultiplier * 0.5) ) - playerPos.X;
				const deltaZ = (queryChunk.posZ * tempMultiplier + (tempMultiplier * 0.5) ) - playerPos.Z;
				return ((deltaX * deltaX) + (deltaZ * deltaZ)) ** 0.5;
			});
			const closestPlayerDistance2 = math.min(...distances2);
			if (closestPlayerDistance2 > World.Settings.RenderDistance * tempMultiplier) {
				// assign for termination
				return true;
			}


			return false;
		});

		chunksToBeDisposed.forEach((chunk) => {
			chunk.destroy();
		});

	}

	id: number;
	posX: number;
	posZ: number;
	positionId: string;

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
		this.positionId = `${this.posX},${this.posZ}`;

		this.topLayerPartsArray = [];
		this.partsArray = [];
		this.partsModel = new Instance("Model", WorldChunks);
		this.partsModel.Name = `Chunk${this.id}_${this.positionId}`;
		
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

		interface NeighbouringChunkDefinition {
			"north": (Chunk | undefined);
			"east": (Chunk | undefined);
			"south": (Chunk | undefined);
			"west": (Chunk | undefined);
		};
		let neighbourChunks: NeighbouringChunkDefinition = {
			"north": undefined,
			"east": undefined,
			"south": undefined,
			"west": undefined
		};
		let neighbourBlocks = [];

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
			// no need to worry about any of the neighbours not existing, because... they DO in fact exist.
			// because this block is not a boundaryblock.

			neighbourBlocks = [
				// North
				this.topLayerPartsArray[partIndex - this.chunkSize],
				
				// East
				this.topLayerPartsArray[partIndex + 1],

				// South
				this.topLayerPartsArray[partIndex + this.chunkSize],

				// West
				this.topLayerPartsArray[partIndex - 1]
			];

		} else {
			// if there's a possibility that some neighbours may not exist in THIS chunk
			// therefore, get the chunk in the cardinal direction required, put that to the side

			const verbose = false;

			if ([9, 1, 3].includes(boundaryIndicator)) {
				// any direction containing North
				const northChunk = Chunk.GetChunkWithPositionId(`${this.posX},${this.posZ-1}`);
				if (northChunk) neighbourChunks["north"] = northChunk;
				else if (verbose) print(`Error, northChunk does not exist.`);
			}
			if ([3, 2, 6].includes(boundaryIndicator)) {
				// any direction containing East
				const eastChunk = Chunk.GetChunkWithPositionId(`${this.posX+1},${this.posZ}`);
				if (eastChunk) neighbourChunks["east"] = eastChunk;
				else if (verbose) print(`Error, eastChunk does not exist.`);
			}
			if ([6, 4, 12].includes(boundaryIndicator)) {
				// any direction containing South
				const southChunk = Chunk.GetChunkWithPositionId(`${this.posX},${this.posZ+1}`);
				if (southChunk) neighbourChunks["south"] = southChunk;
				else if (verbose) print(`Error, southChunk does not exist.`);
			}
			if ([12, 8, 9].includes(boundaryIndicator)) {
				// any direction containing West
				const westChunk = Chunk.GetChunkWithPositionId(`${this.posX-1},${this.posZ}`);
				if (westChunk) neighbourChunks["west"] = westChunk;
				else if (verbose) print(`Error, westChunk does not exist.`);
			}
			// if there was South East, it'd be picked up by the 2nd and 3rd if blocks, hence both South and East are accounted for.


			// if, in the Neighbouring Chunks object, any of the cardinal directions are defined
			// then that means that the mentioned chunk in that direction has to be grabbed-from

			
			if (neighbourChunks["north"]) {
				// unconfirmed, must see if it works
				const northChunk = neighbourChunks["north"];
				const northBlock = northChunk.topLayerPartsArray[ (northChunk.chunkSize * northChunk.chunkSize) - northChunk.chunkSize + partIndex ];
				neighbourBlocks.push(northBlock);
			} else {
				neighbourBlocks.push(this.topLayerPartsArray[partIndex - this.chunkSize]);
			}

			if (neighbourChunks["east"]) {
				const eastChunk = neighbourChunks["east"];
				const eastBlock = eastChunk.topLayerPartsArray[ partIndex - (eastChunk.chunkSize - 1) ];
				neighbourBlocks.push(eastBlock);
			} else {
				neighbourBlocks.push(this.topLayerPartsArray[partIndex + 1]);
			}

			if (neighbourChunks["south"]) {
				const southChunk = neighbourChunks["south"];
				const southBlock = southChunk.topLayerPartsArray[ partIndex % southChunk.chunkSize ];
				neighbourBlocks.push(southBlock);
			} else {
				neighbourBlocks.push(this.topLayerPartsArray[partIndex + this.chunkSize]);
			}

			if (neighbourChunks["west"]) {
				const westChunk = neighbourChunks["west"];
				const westBlock = westChunk.topLayerPartsArray[ math.floor(partIndex / westChunk.chunkSize) * westChunk.chunkSize + westChunk.chunkSize - 1 ];
				neighbourBlocks.push(westBlock);
			} else {
				neighbourBlocks.push(this.topLayerPartsArray[partIndex - 1]);
			}
		}

		// print(`Neighbour Blocks size = ${neighbourBlocks.size()}`);

		const maximumY = currentPart.Position.Y;
		let minimumY = math.huge;
		// now find the greatest negative displacement from current block to any of the neighbour-blocks
		for (let partBlock of neighbourBlocks) {
			if (partBlock.Position.Y < minimumY) {
				minimumY = partBlock.Position.Y;
			}
		}
		// print(`MinimumY = ${minimumY}`);
		
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


	destroy_parts() {
		this.topLayerPartsArray = [];
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
		const prevPosId = this.positionId;
		this.destroy_parts();

		// [ Chunk.GlobalList[this.id], Chunk.GlobalList[Chunk.GlobalList.size() - 1] ] = [ Chunk.GlobalList[Chunk.GlobalList.size() - 1], Chunk.GlobalList[this.id] ];
		// Chunk.GlobalList.pop();

		Chunk.GlobalList.remove(this.id - 1);

		// Chunk.GlobalList = Chunk.GlobalList.filter((chunk) => chunk.id !== this.id);

		print(`Destroyed Chunk #${id}. ${prevPosId}`);
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




// const bob = new Chunk(1, 1);
// bob.init();

// const sam = new Chunk(1, 2);
// sam.init();

// wait(2);
// bob.destroy();


// wait(5);

// (()=>{
// 	const map_playerChunkPositions = World.GetAllPlayersCurrentChunkLocations();
// 	map_playerChunkPositions.forEach((chunkPos, playerUserId) => {
// 		World.GenerateChunksAtChunkPosition(chunkPos);
// 	});
// 	World.DisposeOfChunksNotInRangeOfPlayers();
// })();



ReplicatedStorage_Events.Regenerate.OnServerEvent.Connect((player: Player, _params) => {

	World.UponRegenerateRequest();
	// WorldGen.init();
});


// WorldGen.init();







World.init();

export {};