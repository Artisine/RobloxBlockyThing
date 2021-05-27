
import Object from "@rbxts/object-utils";

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



/**
 * 
 * @param stringToSearch The string you want to find something inside
 * @param substringQuery The thing to query for
 */
 export function is_substring_within_string(stringToSearch: string, substringQuery: string) {
	const found = stringToSearch.find(substringQuery);
	if (found[0] !== -1) {
		// successfully found
		return true;
	} else {
		return false;
	}
}

/**
 * 
 * @param objectToSearch The object (keys) to search through
 * @param queryKeyString The query string
 * @returns Boolean, true or false.
 */
export function is_query_in_object_keys(objectToSearch: object, queryKeyString: string) {
	if ((Object.keys(objectToSearch) as string[]).includes(queryKeyString)) {
		return true;
	} else {
		return false;
	}
}



/**
 * Fisher Yates' Card-shuffling algorithm.
 * @param array 
 * @returns An array where all its elements are randomly shuffled amongst themselves. O(n) time complexity.
 */
export function fisherYatesShuffleArray(array: Array<unknown>) {
	let m: number = array.size();
	let temp: unknown;
	let i: number;

	while(m > 0) {
		// Pick a remaining element of array
		i = math.floor(math.random() * m--);

		// Then swap it with the current element
		temp = array[m];
		array[m] = array[i];
		array[i] = temp;

		// // Couldn't this be done easily with destructuring assignment? ES6
		// [array[m], array[i]] = [array[i], array[m]];
	}

	return array;
}


/**
 * Will return a value within a range, 0 inclusive max_i exclusive.
 * @param what_i A number
 * @param max_i Another number
 * @returns Your what_i constrained between 0 inclusive and max_i exclusive.
 */
export function i_constraint(what_i: number, max_i: number) {
	if (what_i < 0) {
		return max_i - math.abs(what_i);
	}
	if (what_i >= max_i) {
		return what_i - max_i;
	}
	return what_i;
};






