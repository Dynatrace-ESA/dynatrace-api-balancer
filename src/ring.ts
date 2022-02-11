export class Ring<T = any> {

    private i = -1;

    /**
     * 
     * @param array Array of objects to cycle through.
     */
    constructor(private array: Array<T> = []) {}

    /**
     * Get the next item in the Ring.
     * @returns Next item on the ring.
     */
    next(): T {
        if (this.array.length === 0)
            return null;

        if (this.i < this.array.length - 1)
            this.i++;
        else
            this.i = 0;

        return this.array[this.i];
    }

    /**
     * Performs the specified action for each element in an array.

     * @param callback A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     * @returns Original array.
     */
    forEach(callback: (item: T, index?: number) => any, thisArg?: any): Array<T> | void {
        return this.array.forEach(callback, thisArg);
    }
    
    /**
     * @param predicate A function that accepts up to three arguments. The some method calls the predicate function for each element in the array until the predicate returns a value which is coercible to the Boolean value true, or until the end of the array.
     * @param thisArg An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value.
     * @returns Returns true if at least one element tests true.
     */
    some(test: (item: T, index?: number) => boolean, thisArg?: any): boolean {
        return this.array.some(test, thisArg);
    }

    /**
     * @param predicate A function that accepts up to three arguments. The some method calls the predicate function for each element in the array until the predicate returns a value which is coercible to the Boolean value true, or until the end of the array.
     * @param thisArg An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value.
     * @returns Returns true if all elements tests return true.
     */
    every(test: (item: T, index?: number) => boolean, thisArg?: any): boolean {
        return this.array.every(test, thisArg);
    }

    /**
     * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
     * @param callback - A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
     * @param initVal - If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
     * @returns 
     */
    reduce(callback: (initialResult: T, nextItem: T, index?: number) => T, initVal): T {
        return this.array.reduce(callback, initVal);
    }

    /**
     * Get number of items in the ring.
     */
    get length(): number {
        return this.array.length;
    }

    /**
     * @param i Index to view.
     * @returns Item in ring at Index.
     */
    at (i: number): T {
        return this.array[i];
    }
}
