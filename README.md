
# Blocky Thing
### (A Roblox Game)


<br>

## What is this?
Using:

- [Visual Studio Code][vscode]
- [Typescript][typescript]
- [Roblox-Ts][robloxts]

Creating a Minecraft-esque game because I felt like it.
This came about because my friends couldn't run Minecraft modpacks, so I sought out to create a literal clone and emulate various mods (with permission) to create an enjoyable experience that can run on lower-spec machines via the Roblox Game Engine.

[RGE][robloxtech]

This is not an intended replacement for our favourite Blocky Game, nor will it accompany it in any way, and needless to say, I am not affiliated with _Microsoft_ or _Mojang AB_ in any way.

<br>

## Future Progress Updates
In the Root folder there'll be a file named  `Changelog.md`, where the commits will have a more in-depth explanation to them and where pondering questions and solutions will be presented, in a dated format.

<br>

## Compiling from Source
If you plan to compile the source code on your machine, be sure to:
- Install the [Rojo extension][rojo] for [Visual Studio Code][vscode]
- Setup the Roblox-Ts environment using these commands:
```
user ~/NewFolder/$ rbxtsc init

? Select template » - Use arrow-keys. Return to submit.
>	_game_
	model
	plugin
	package
√ Select template » game

? Configure Git » (Y/n)
√ Configure Git ... yes

? Configure ESLint » (Y/n)
√ Configure ESLint ... no

? Configure VSCode Project Settings » (Y/n)
√ Configure VSCode Project Settings ... yes

Initializing.. ( xxxx ms )
Building.. ( yyyy ms )

user ~/NewFolder/$ _
```
Additional help can be found at [Roblox-Ts' Setup Guide][robloxts_setupguide]

Also be sure to include these additional packages:
- [@rbxts/services][robloxts_services]
- [@rbxts/object-utils][robloxts_objectutils]
```
user ~/NewFolder/$ npm i --save @rbxts/services @rbxts/object-utils
```
There may have been some things I've forgotten to include in initial setup. Take a peek at the code and you'll gain an intuition for it.

To do a proper compilation, run command
```
user ~/NewFolder/$ rbxtsc -w

[xx:yy:zz] Starting compilation in watch mode...
[xx:yy:zz] Found 0 errors. Watching for file changes.
```


[vscode]: https://code.visualstudio.com/
[typescript]: https://typescriptlang.org/
[robloxts]: https://roblox-ts.com/
[robloxtech]: https://corp.roblox.com/technology/
[robloxts_services]: https://www.npmjs.com/package/@rbxts/services/
[robloxts_objectutils]: https://www.npmjs.com/package/@rbxts/object-utils/
[rojo]: https://marketplace.visualstudio.com/items?itemName=evaera.vscode-rojo/
[robloxts_setupguide]: https://roblox-ts.com/docs/setup-guide/
