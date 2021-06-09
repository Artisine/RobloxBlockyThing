# Changelog

### List list list list list list list list list list list list list list list list list list list list 

1. What's a list?

28052021. 28/05/2021 - Friday 28 May 2021 - Commit 6<br>
	- Changed the `README.md` to reflect the fact that there's now a `Changelog.md` file.<br>
	- Altered the `README.md` to add in the "Compiling from Source" section.<br>
	- Markdown is fun.

08062021. 08/06/2021 - Tuesday 08 June 2021 - Commit 7<br>
	- Have now implemented "block filling", for underneath the top-layered blocks in each Chunk.<br>
	This means that once the top layered blocks are generated and positioned, more blocks will be created to fill in the gaps left underneath the top layered blocks (caused by the random fluctuations which is inherent to noise).<br>
	- Drawn up on a piece of paper somewhere is a schematic for this so-called "Chunk Internal Boundary Detector" (already implemented), which is a method(s) which takes in an index, 0 through 255, and spits out a number coresponding to a cardinal direction, which is then used in filling the gaps for the top-layer-block at the provided index.<br>
	Gap filling is only currently being applied to non-boundary blocks, meaning inner blocks only. I'll get around to boundary blocks, in order to complete the illusion of seamless blocky terrain.<br>
	- This was a month or two... or three... in the making. I've finally done it?<br>
	There must be a more efficient solution compared to the hobjob I've scrappily semi-intelligently written up. If _you_ know of a way, inform me!
	
09062021. 09/06/2021 - Wednesday 09 June 2021 - Commit 8<br>
	- Infinite Terrain is now here! I'm getting any Player's Chunk Position and generating new chunks around said position, refraining if there's already existing chunks there. When there are no Players nearby, or within a certain distance, to a Chunk then Chunk Disposal occurs. It's like garbage collection, but for masses of Parts. It does cause some noticable frame-drops when creating and deleting; must research how to spread over multiple frames/computation-cycles/CSG-unions.<br>
	- Remember Chunk Gap-filling? It's now upgraded to look around for neigbouring chunks and use their parts when calculating deltaY blocks to fill, leading to (in most cases) seamless transitions between Chunks. There are certain edge-cases (haha punny) where a noticable _fat gap_ is left in the wake of a Chunk IF it was generated _after_ another Chunk, hence it could not compute the edge, because there physically was no chunk to look at. Must research how to systemically prevent gap-fill-bugs, perhaps by looping over all chunks within an area to fill gaps? But wouldn't that just add extra blocks on top of already generated gap-fillers?<br>
	- I'd like to add Block Editing next. Oh boy, this will be... hard. It's not like I've got a list of blocks to loop over if a raycast hits one, no, they're all Parts vaguely bound together in a Model whilst being referenced in a separate Array... Welp, that's for future me to work on. I'm tired.

09062021. 09/06/2021 - Wednesday 09 June 2021 - Commit 0.9.0<br>
	- Made a change to the `World::CheckIfChunkAtCoordinateAlreadyExists` where instead of using the `find` method, it'll use `filter` and return the (size > 0) bool. This was a precautionary measure to try and fix Chunk duplication / Chunk overlaying, as described in recently opened Issue "[Chunk Disposal occasionally fails, due to duplicated chunks?](https://github.com/Artisine/RobloxBlockyThing/issues/2#issue-916327572)".<br>
	- I'm now jumping ship from not-very-helpful single number versioning, to _Semantic Versioning_, as seen in today's title; this means that commits from this point forward will be structured Semantically. This helps me because I have to make small commits for small bug fixes without having to write a new Changelog entry. The Changelog will still be added-to if it's a Minor or Major update, however!

End of file.