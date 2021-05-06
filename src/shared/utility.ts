


export const alphabet = "abcdefghijklmnopqrstuvwxyz";
export const numbers = "0123456789";

export function generate_id(characterLimit: number = 8): string {
	const a1 = (alphabet + numbers).split("");
	let output = "";
	for (let i=0; i<characterLimit; i+=1) {
		output += a1[math.floor(math.random() * alphabet.size())];
	}
	return output;
}






