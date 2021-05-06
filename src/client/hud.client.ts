
import {
	Workspace,
	ReplicatedStorage,
	Players,
	CollectionService
} from "@rbxts/services";
import * as customtypes from "shared/customtypes";
import * as Utility from "shared/utility";
const ReplicatedStorage_Events = ReplicatedStorage.WaitForChild("Events") as customtypes.ReplicatedStorage_Events;



interface FormControlNumberInput_ButtonMemory {
	lastButtonName: string;
	mouseIsDown: boolean,

	looping: boolean,

	delayDurationSeconds: number,
	initialPressDownTimestamp: number,
	releaseTimestamp: number,
	
	passivePressDownDurationMilli: number,
	passivePressDownDurationSeconds: number,
	
	activePressDownDurationMilli: number,
	activePressDownDurationSeconds: number,

	completeDurationMilli: number,
	completeDurationSeconds: number
};
enum FormControlType {
	NumberInput = "NumberInput",
	BooleanInput = "BooleanInput"
};
class FormControl {
	id: string;
	_ufcid: number;
	className: string;
	name: string;
	titleText: string;
	frame: (Frame | undefined);

	static ufcid = 1;
	static GlobalList: Map<FormControl["_ufcid"], FormControl> = new Map();

	constructor(titleText: string) {
		this.id = Utility.generate_id();
		this._ufcid = FormControl.ufcid++;
		this.className = "FormControl";
		this.name = "FormControl";
		this.titleText = titleText;

		FormControl.GlobalList.set(this._ufcid, this);
	}

	get_basic_markup(): Frame {
		const frame = new Instance("Frame");
		frame.Name = `FormControlNumberInput_${this.id}_${this.name}`;
		frame.BackgroundColor3 = Color3.fromRGB(27, 27, 27);
		frame.BackgroundTransparency = 0.1;
		frame.BorderSizePixel = 0;
		frame.Size = new UDim2(1, 0, 0, 100);

		const UIListLayout = new Instance("UIListLayout", frame);
		UIListLayout.FillDirection = Enum.FillDirection.Horizontal;
		UIListLayout.HorizontalAlignment = Enum.HorizontalAlignment.Left;
		UIListLayout.SortOrder = Enum.SortOrder.LayoutOrder;
		UIListLayout.VerticalAlignment = Enum.VerticalAlignment.Center;

		const UIPadding = new Instance("UIPadding", frame);
		UIPadding.PaddingBottom = new UDim(0.1, 0);
		UIPadding.PaddingLeft = new UDim(0.05, 0);
		UIPadding.PaddingRight = new UDim(0.05, 0);
		UIPadding.PaddingTop = new UDim(0.1, 0);

		const title = new Instance("TextLabel", frame);
		title.Name = "title";
		title.BackgroundColor3 = new Color3(0, 0, 0);
		title.BackgroundTransparency = 1;
		title.BorderSizePixel = 1;
		title.LayoutOrder = 1;
		title.Size = new UDim2(0.5, 0, 1, 0);
		title.Font = Enum.Font.SourceSans;
		title.Text = this.titleText;
		title.TextColor3 = new Color3(1, 1, 1);
		title.TextScaled = false;
		title.TextSize = 20;
		title.TextTruncate = Enum.TextTruncate.AtEnd;
		title.TextWrapped = true;
		title.TextXAlignment = Enum.TextXAlignment.Left;
		title.TextYAlignment = Enum.TextYAlignment.Center;
		const UITextSizeConstraint = new Instance("UITextSizeConstraint", title);
		UITextSizeConstraint.MaxTextSize = 40;
		UITextSizeConstraint.MinTextSize = 20;
		


		return frame;
	}

	set_name(name: string) {
		this.name = "FormControl_" + name;
		return this;
	}
	assign_tag() {
		if (this.frame) {
			CollectionService.AddTag(this.frame, "FormControl_Frame");
			this.frame.SetAttribute("FormControl_FrameId", this._ufcid);
			this.frame.SetAttribute("FormControl_Name", this.name);
		}
	}

	destroy() {
		if (this.frame) {
			if (CollectionService.HasTag(this.frame, "FormControl_Frame")) {
				CollectionService.RemoveTag(this.frame, "FormControl_Frame");
			}
		}
		this.frame?.Destroy();
		this.frame = undefined;
		FormControl.GlobalList.delete(this._ufcid);
	}
}
class FormControlNumberInput extends FormControl {
	static DefaultValue = 0;

	value: number;
	tempValue: string;
	frame: customtypes.FormControlNumberInputFrame;
	frameTemp: (Frame | undefined);
	placeholderString: string;

	defaultValue: (number | undefined);
	minValue: number;
	maxValue: number;

	buttonMemory: FormControlNumberInput_ButtonMemory;

	callbackWhenChanged: ((()=>void) | undefined)

	constructor(titleText: string, provided_default_value: (number), callback_when_changed: ((()=>void) | undefined ) = undefined) {
		super(titleText);
		this.value = FormControlNumberInput.DefaultValue;
		this.placeholderString = "Number";
		this.tempValue = "";

		// this.defaultValue = (provided_default_value !== undefined) ? (this.lock_value_to_range_minmax(provided_default_value)) : (FormControlNumberInput.DefaultValue);
		this.defaultValue = 1;
		this.minValue = 1;
		this.maxValue = 9999;
		this.buttonMemory = {
			lastButtonName: "",
			mouseIsDown: false,

			looping: false,

			delayDurationSeconds: 1,
			initialPressDownTimestamp: 0,
			releaseTimestamp: 0,
			
			passivePressDownDurationMilli: 0,
			passivePressDownDurationSeconds: 0,
			
			activePressDownDurationMilli: 0,
			activePressDownDurationSeconds: 0,

			completeDurationMilli: 0,
			completeDurationSeconds: 0
		};
		this.callbackWhenChanged = callback_when_changed;

		this.frameTemp = undefined;
		this.frame = this.get_markup();
		this.assign_tag();
		this.setup_hooks();
	}

	get_markup(): customtypes.FormControlNumberInputFrame {
		this.frameTemp = this.get_basic_markup();

		const control = new Instance("Frame", this.frameTemp);
		control.Name = "control";
		control.BackgroundColor3 = Color3.fromRGB(71, 71, 71);
		control.BackgroundTransparency = 1;
		control.BorderSizePixel = 0;
		control.LayoutOrder = 2;
		control.Size = new UDim2(0.5, 0, 1, 0);

		const UIPadding = new Instance("UIPadding", control);
		UIPadding.PaddingBottom = new UDim(0, 0);
		UIPadding.PaddingLeft = new UDim(0, 10);
		UIPadding.PaddingRight = new UDim(0, 0);
		UIPadding.PaddingTop = new UDim(0, 0);

		const textBox = new Instance("TextBox", control);
		textBox.AnchorPoint = new Vector2(0, 0.5);
		textBox.BackgroundColor3 = Color3.fromRGB(44, 44, 44);
		textBox.BackgroundTransparency = 0;
		textBox.BorderColor3 = Color3.fromRGB(70, 70, 70);
		textBox.BorderSizePixel = 1;
		textBox.Position = new UDim2(0, 0, 0.5, 0);
		textBox.Size = new UDim2(1, -20, 0.5, 0);
		textBox.TextEditable = true;
		textBox.Font = Enum.Font.SourceSans;
		textBox.PlaceholderColor3 = Color3.fromRGB(178, 178, 178);
		textBox.PlaceholderText = this.placeholderString;
		textBox.Text = "";
		textBox.TextColor3 = new Color3(1, 1, 1);
		textBox.TextScaled = false;
		textBox.TextSize = 20;
		textBox.TextStrokeColor3 = new Color3(0, 0, 0);
		textBox.TextTruncate = Enum.TextTruncate.AtEnd;
		textBox.TextXAlignment = Enum.TextXAlignment.Left;
		textBox.TextYAlignment = Enum.TextYAlignment.Center;
		
		const UIPadding2 = new Instance("UIPadding", textBox);
		UIPadding2.PaddingBottom = new UDim(0, 0);
		UIPadding2.PaddingLeft = new UDim(0, 5);
		UIPadding2.PaddingRight = new UDim(0, 0);
		UIPadding2.PaddingTop = new UDim(0, 0);

		const button_container = new Instance("Frame", textBox);
		button_container.Name = "button_container";
		button_container.BackgroundColor3 = new Color3(0, 0, 0);
		button_container.BackgroundTransparency = 0;
		button_container.BorderColor3 = Color3.fromRGB(70, 70, 70);
		button_container.BorderMode = Enum.BorderMode.Middle;
		button_container.BorderSizePixel = 2;
		button_container.Position = new UDim2(1, 0, 0, 0);
		button_container.Size = new UDim2(0, 20, 1, 0);

		const button_up = new Instance("ImageButton", button_container);
		button_up.Name = "button_up";
		button_up.AnchorPoint = new Vector2(0.5, 0.5);
		button_up.BackgroundColor3 = Color3.fromRGB(44, 44, 44);
		button_up.BackgroundTransparency = 0;
		button_up.BorderSizePixel = 0;
		button_up.Position = new UDim2(0.5, 0, 0.25, 0);
		button_up.Size = new UDim2(1, 0, 0.5, 0);
		button_up.Image = "http://www.roblox.com/asset/?id=4897435048";
		button_up.ImageColor3 = new Color3(1, 1, 1);
		button_up.ScaleType = Enum.ScaleType.Fit;

		const button_down = button_up.Clone();
		button_down.Name = "button_down";
		button_down.AnchorPoint = new Vector2(0.5, 0.5);
		button_down.Position = new UDim2(0.5, 1, 0.75, -1);
		button_down.Rotation = 180;
		button_down.Parent = button_container;

		return this.frameTemp as customtypes.FormControlNumberInputFrame;
	}

	set_callbackwhenchanged(callback: ((()=>void) | undefined)) {
		this.callbackWhenChanged = callback;
		return this;
	}

	lock_value_to_range_minmax(num_b: (number | undefined) = undefined): number {
		print(`num_b = ${num_b}, provided default val = ${this.defaultValue}`);
		const parameterProvided = (num_b !== undefined);
		let num = 0;
		if (parameterProvided) {
			print(`A number was given`);
			num = num_b!;
			print(`${num} -- ${type(num)}`);
		} else {
			print(`number not given, internal value used`);
			num = this.value;
		}

		print(`---\nnum = ${num} , type = ${type(num)}`);
		print(`minval = ${this.minValue} , type = ${type(this.minValue)}`);
		if (num < this.minValue) {
			num = this.minValue;
		}
		if (num > this.maxValue) {
			num = this.maxValue;
		}

		if (parameterProvided) {
			num_b! = num!;
			return num_b;
		} else {
			this.value = num;
			return this.value;
		}
	}
	display_value() {
		this.frame.control.TextBox.Text = `${this.value}`;
	}

	setup_long_pressed_subbuttons_mouseDown(nameOfButton: string, callback_when_active: ((()=>void) | undefined) = undefined) {
		this.buttonMemory.lastButtonName = nameOfButton;
		const memory = this.buttonMemory;

		if (! memory.mouseIsDown) {
			memory.mouseIsDown = true;
			memory.looping = true;
			memory.initialPressDownTimestamp = DateTime.now().UnixTimestampMillis;
		}

		while (memory.looping) {
			const currentMilli = DateTime.now().UnixTimestampMillis;
			const delta = currentMilli - memory.initialPressDownTimestamp;
			memory.passivePressDownDurationMilli = delta;
			memory.passivePressDownDurationSeconds = memory.passivePressDownDurationMilli / 1000;

			if (memory.passivePressDownDurationSeconds >= memory.delayDurationSeconds) {
				memory.activePressDownDurationMilli = memory.passivePressDownDurationMilli - (memory.delayDurationSeconds * 1000);
				memory.activePressDownDurationSeconds = memory.activePressDownDurationMilli / 1000;

				if (callback_when_active) {
					callback_when_active();
				}
			}

			if (! memory.looping) {
				break;
			}

			wait();
		}

		return memory as FormControlNumberInput_ButtonMemory;
	}
	setup_long_pressed_subbuttons_mouseUp(nameOfButton: string) {
		this.buttonMemory.lastButtonName = nameOfButton;
		const provided_memory = this.buttonMemory;

		// only occurs if mouse is up, opposite of down, hence no check needed
		provided_memory.mouseIsDown = false;
		provided_memory.looping = false;
		provided_memory.releaseTimestamp = DateTime.now().UnixTimestampMillis;

		provided_memory.completeDurationMilli = provided_memory.releaseTimestamp - provided_memory.initialPressDownTimestamp;
		provided_memory.completeDurationSeconds = provided_memory.completeDurationMilli / 1000;
		
		wait();
	}


	setup_hooks() {
		
		this.frame.control.TextBox.FocusLost.Connect(()=>{
			this.tempValue = this.frame.control.TextBox.Text;
			const cleaned = this.tempValue.gsub("%D+", "");
			const string_converted_number = tonumber(cleaned[0]);
			if (string_converted_number) {
				this.value = string_converted_number;
				this.lock_value_to_range_minmax();
			} else {
				this.value = this.defaultValue!;
			}
			this.display_value();
		});
		this.frame.control.TextBox.button_container.button_up.MouseButton1Click.Connect(()=>{
			// this.value = this.value + 1;
			// this.lock_value_to_range_minmax();
			// this.display_value();
			this.set_value(this.value + 1);
			ReplicatedStorage_Events.PlaySound.Fire("MuffledSlapWaterPopNoise", 0.5);
		});
		this.frame.control.TextBox.button_container.button_down.MouseButton1Click.Connect(()=>{
			// this.value = this.value - 1;
			// this.lock_value_to_range_minmax();
			// this.display_value();
			this.set_value(this.value - 1);
			ReplicatedStorage_Events.PlaySound.Fire("MuffledSlapWaterPopNoise", 0.5);
		});
		

		this.frame.control.TextBox.button_container.button_up.MouseButton1Down.Connect((x,y) => {
			this.setup_long_pressed_subbuttons_mouseDown("button_up", ()=>{
				// this.value = this.value + 1;
				// this.lock_value_to_range_minmax();
				// this.display_value();
				this.set_value(this.value + 1);
				ReplicatedStorage_Events.PlaySound.Fire("MuffledSlapWaterPopNoise", 0.5);
			});
		});
		this.frame.control.TextBox.button_container.button_up.MouseButton1Up.Connect((x,y) => {
			this.setup_long_pressed_subbuttons_mouseUp("button_up");
		});

		this.frame.control.TextBox.button_container.button_down.MouseButton1Down.Connect((x,y) => {
			this.setup_long_pressed_subbuttons_mouseDown("button_down", ()=>{
				// this.value = this.value - 1;
				// this.lock_value_to_range_minmax();
				// this.display_value();
				this.set_value(this.value - 1);
				ReplicatedStorage_Events.PlaySound.Fire("MuffledSlapWaterPopNoise", 0.5);
			});
		});
		this.frame.control.TextBox.button_container.button_down.MouseButton1Up.Connect((x,y) => {
			this.setup_long_pressed_subbuttons_mouseUp("button_down");
		});

	}

	set_value(num: number) {
		this.value = num;
		this.lock_value_to_range_minmax();
		this.display_value();
		if (this.callbackWhenChanged) {
			this.callbackWhenChanged();
		}
		return this;
	}
}
class FormControlBooleanInput extends FormControl {
	static DefaultValue = false;

	value: boolean;
	checked: boolean;
	frame: customtypes.FormControlBooleanInputFrame;
	frameTemp: (Frame | undefined);
	tickImageURL: string;

	constructor(titleText: string) {
		super(titleText);
		this.value = FormControlBooleanInput.DefaultValue;
		this.checked = this.value;

		this.tickImageURL = "http://www.roblox.com/asset/?id=2882275637";

		this.frameTemp = undefined;
		this.frame = this.get_markup();
		this.assign_tag();
		this.setup_hooks();
	}

	get_markup(): customtypes.FormControlBooleanInputFrame {
		this.frameTemp = this.get_basic_markup();

		(this.frameTemp.FindFirstChild("title") as TextLabel).Size = new UDim2(0.75, 0, 1, 0);

		const control = new Instance("Frame", this.frameTemp);
		control.Name = "control";
		control.BackgroundColor3 = Color3.fromRGB(71, 71, 71);
		control.BackgroundTransparency = 1;
		control.BorderSizePixel = 0;
		control.LayoutOrder = 2;
		control.Size = new UDim2(0.25, 0, 1, 0);

		const UIPadding = new Instance("UIPadding", control);
		UIPadding.PaddingBottom = new UDim(0, 0);
		UIPadding.PaddingLeft = new UDim(0, 10);
		UIPadding.PaddingRight = new UDim(0, 0);
		UIPadding.PaddingTop = new UDim(0, 0);

		const UIListLayout = new Instance("UIListLayout", control);
		UIListLayout.Padding = new UDim(0, 0);
		UIListLayout.FillDirection = Enum.FillDirection.Horizontal;
		UIListLayout.HorizontalAlignment = Enum.HorizontalAlignment.Right;
		UIListLayout.SortOrder = Enum.SortOrder.LayoutOrder;
		UIListLayout.VerticalAlignment = Enum.VerticalAlignment.Center;

		const container = new Instance("Frame", control);
		container.Name = "container";
		container.AnchorPoint = new Vector2(0, 0);
		container.BackgroundColor3 = Color3.fromRGB(27, 27, 27);
		container.BackgroundTransparency = 0;
		container.BorderColor3 = Color3.fromRGB(71, 71, 71);
		container.BorderMode = Enum.BorderMode.Inset;
		container.BorderSizePixel = 2;
		container.Size = new UDim2(0.5, 0, 0.5, 0);
		container.SizeConstraint = Enum.SizeConstraint.RelativeYY;
		container.Visible = true;

		const ImageButton = new Instance("ImageButton", container);
		ImageButton.Active = true;
		ImageButton.AnchorPoint = new Vector2(0.5, 0.5);
		ImageButton.AutoButtonColor = true;
		ImageButton.BackgroundColor3 = Color3.fromRGB(27, 27, 27);
		ImageButton.BackgroundTransparency = 0;
		ImageButton.BorderColor3 = Color3.fromRGB(70, 70, 70);
		ImageButton.BorderSizePixel = 0;
		ImageButton.Position = new UDim2(0.5, 0, 0.5, 0);
		ImageButton.Size = new UDim2(1, 0, 1, 0);
		ImageButton.SizeConstraint = Enum.SizeConstraint.RelativeYY;
		ImageButton.Visible = true;

		const ImageLabel = new Instance("ImageLabel", ImageButton);
		ImageLabel.Active = false;
		ImageLabel.AnchorPoint = new Vector2(0.5, 0.5);
		ImageLabel.BackgroundTransparency = 1;
		ImageLabel.BorderSizePixel = 0;
		ImageLabel.Position = new UDim2(0.5, 0, 0.5, 0);
		ImageLabel.Size = new UDim2(0.75, 0, 0.75, 0);
		ImageLabel.Visible = true;
		ImageLabel.Image = this.tickImageURL;
		ImageLabel.ImageColor3 = Color3.fromRGB(73, 230, 0);
		ImageLabel.ScaleType = Enum.ScaleType.Stretch;
		ImageLabel.SliceScale = 1;

		return this.frameTemp as customtypes.FormControlBooleanInputFrame;
	}

	display_value() {
		if (this.checked) {
			this.frame.control.container.ImageButton.ImageLabel.Visible = true;
		} else {
			this.frame.control.container.ImageButton.ImageLabel.Visible = false;
		}
	}

	setup_hooks() {
		if (this.checked) {
			this.frame.control.container.ImageButton.ImageLabel.Visible = true;
		} else {
			this.frame.control.container.ImageButton.ImageLabel.Visible = false;
		}
		this.frame.control.container.ImageButton.MouseButton1Click.Connect(()=>{
			if (this.checked) {
				this.value = false;
				this.checked = false;
			} else {
				this.value = true;
				this.checked = true;
			}
			this.display_value();
			ReplicatedStorage_Events.PlaySound.Fire("MuffledSlapWaterPopNoise", 0.5);
		});
	}

	set_value(b: boolean) {
		this.value = b;
		this.checked = b;
		this.display_value();
		return this;
	}

}


wait(2);
const PlayerGui = Players.LocalPlayer.WaitForChild("PlayerGui") as PlayerGui;
const ScreenGui_Editor = PlayerGui.WaitForChild("ScreenGui_Editor") as customtypes.ScreenGui_Editor;

const editor_controls = [
	["Scale", 1],
	["Persistence", 4],
	["Lacunarity", 2],
	["Octaves", 4],
	["Exponentiation", 3],
	["Height", 10]
];

interface temp {
	[key: string]: number;
}
class EditorHud {

	static editorValues: temp = {
		scale: 1,
		persistence: 4,
		lacunarity: 2,
		octaves: 4,
		exponentiation: 3,
		height: 10
	};

	static send_generate_request() {
		ReplicatedStorage_Events.Regenerate.FireServer(this.editorValues);
	}
	static init() {

		for (let attributepair of editor_controls) {

			print(attributepair);
			print(`0: ${attributepair[0]}, 1: ${attributepair[1]}`);
			const fc = new FormControlNumberInput(attributepair[0] as string, attributepair[1] as number, ()=>{
				EditorHud.editorValues[(attributepair[0] as string).lower()] = fc.value;
				EditorHud.send_generate_request();
			});
			fc.frame.Parent = ScreenGui_Editor.background.ScrollingFrame;

		}

	}
};



EditorHud.init();












export {};