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
	

End of file.