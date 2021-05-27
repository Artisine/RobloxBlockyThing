

export interface Dummy_Character extends Model {
	"Body Colors": BodyColors;
	Humanoid: Humanoid & {
		HumanoidDescription: HumanoidDescription;
		BodyDepthScale: NumberValue;
		BodyHeightScale: NumberValue;
		BodyProportionScale: NumberValue;
		BodyTypeScale: NumberValue;
		BodyWidthScale: NumberValue;
		HeadScale: NumberValue;
		Status: Model;
		Animator: Animator;
	};
	HumanoidRootPart: Part;

	Head: (Part | MeshPart) & {
		Neck: Motor6D;
	};
	UpperTorso: MeshPart & {
		Waist: Motor6D;
	};

	RightUpperArm: MeshPart & {
		RightShoulder: Motor6D;
	};
	RightLowerArm: MeshPart & {
		RightElbow: Motor6D;
	};
	RightHand: MeshPart & {
		RightWrist: Motor6D;
	};

	LeftUpperArm: MeshPart & {
		LeftShoulder: Motor6D;
	};
	LeftLowerArm: MeshPart & {
		LeftElbow: Motor6D;
	};
	LeftHand: MeshPart & {
		LeftWrist: Motor6D;
	};

	LowerTorso: MeshPart & {
		Root: Motor6D;
	};

	RightUpperLeg: MeshPart & {
		RightHip: Motor6D;
	};
	RightLowerLeg: MeshPart & {
		RightKnee: Motor6D;
	};
	RightFoot: MeshPart & {
		RightAnkle: Motor6D;
	};

	LeftUpperLeg: MeshPart & {
		LeftHip: Motor6D;
	};
	LeftLowerLeg: MeshPart & {
		LeftKnee: Motor6D;
	};
	LeftFoot: MeshPart & {
		LeftAnkle: Motor6D;
	};


};


export interface ReplicatedStorage_Events extends Folder {
	PlaySound: BindableEvent;
	Regenerate: RemoteEvent;
};
export interface ReplicatedStorage_Dev extends Folder {
	MaximumWorldHeight: NumberValue;
	MinimumWorldHeight: NumberValue;
	BlockSize: NumberValue;
	ChunkSize: NumberValue;
	CanvasX: NumberValue;
	CanvasZ: NumberValue;
	Seed: NumberValue;
	Persistance: NumberValue;
	Lacunarity: NumberValue;
	MaximumChunkLoadingDistance: NumberValue;
	OffsetWorldHeight: NumberValue;
};


export interface FormControlNumberInputFrame extends Frame {
	title: TextLabel;
	control: Frame & {
		TextBox: TextBox & {
			button_container: Frame & {
				button_up: ImageButton;
				button_down: ImageButton;
			};
		};
	};
};
export interface FormControlBooleanInputFrame extends Frame {
	title: TextLabel;
	control: Frame & {
		container: Frame & {
			ImageButton: ImageButton & {
				ImageLabel: ImageLabel;
			};
		};
	};
};


export interface ScreenGui_Editor extends ScreenGui {
	background: Frame & {
		ScrollingFrame: ScrollingFrame;
		submitButton: TextButton;
	};
};





export interface ReplicatedStorage_Sounds extends Folder {
	WindowsError: Sound;
	SuccessNoise: Sound;
	TickClackNoise: Sound;
	ChickenEggPlopNoise: Sound;
	BubblePopPlopNoise: Sound;
	LightErrorNoise: Sound;
	MuffledSlapWaterPopNoise: Sound;
	FadeOutNotificationNoise: Sound;
	NotificationChimeNoise: Sound;
};

