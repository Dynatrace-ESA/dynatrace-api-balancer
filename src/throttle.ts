/** 
 *  The Throttle rate-limits access to a resource over a moving time window
 *  using a 'leaky bucket' algorithm.
 */
export class Throttle {
    private queue = [];
    private size = null;
    private rate = null;
    private fill = null;
    private last = null;

    /**   
     * Resolves next promise in the queue and keeps emptying it.
     * @private
     */
    private next(): void {
        if (this.queue.length === 0) return;
        setInterval(this.next, this.waitTime); // Keep emptying the queue.
        this.fill--;                // Consume a drop from the bucket.
        this.queue.shift()();       // Call next 'resolve()' in the queue.
    }

    /**
     * Creates a throttle.
     * @constructor
     * @param limit  - Number of requests allowed.
     * @param window - Per this time window (in ms).
     */
    constructor(limit: number, window: number) {
        // Window is a timespan (ms) to which the limit appplies.
        this.size = limit;          // The bucket size is the maximum requests per timespan.
        this.rate = window / limit; // Drip rate: if limit = 30 req/min, add 1 drop every 2s. 
        this.fill = 0;              // Number of drops in the bucket.
        this.last = 0;              // Time we last added more drops.
    }

    /** Resets the throttle to maximum capacity. */
    reset(): void {
        this.last = (new Date()).getTime();
        this.fill = this.size;
    }

    /** 
     * Returns how much capacity is left for this time window. This value is useful
     * for selecting the least constricted resource among a pool of throttled resources. 
     */
    get remainder(): number {
        return this.fill;
    }

    /** 
     * Returns the time (ms) until the throttle opens again (plus 1ms). 
     * Note that this getter just returns the delay - it does not update the throttle. 
     */
    get nextSlot(): number {
        const now = (new Date()).getTime();
        return (this.last + this.rate + 1) - now;
    }

    /** 
     * Returns the time (ms) until a next request can be honored (plus 1ms if there's a wait).
     * This is useful in case multiple throttles need to be checked before a request can be
     * consumed. Note that this getter updates the throttle's state before it produces a value.
     */
    get waitTime(): number {
        // First refill the bucket proportional to the time elapsed since the last refill.
        const now = (new Date()).getTime();
        const added = Math.floor((now - this.last) / this.rate);      // How many drops should be added?
        this.fill = Math.min(this.size, this.fill + added);         // Don't exceed bucket capacity.
        this.last = Math.min(now, this.last + (added * this.rate)); // Update the refill timestamp.

        // The bucket has been updated. Return 0 if there are drops, or the time until the next drop drips.
        return this.fill > 0 ? 0 : (this.last + this.rate + 1) - now;
    }

    /** 
     * Consumes one unit of capacity. Should only be called if {@link Throttle#waitTime waitTime} > 0. 
     * @example
     * function doSomething() {
     *     const delay = myThrottle.waitTime;
     *     if (delay > 0)
     *         return "I can't do this right now, but in " + delay + "ms I can.";
     * 
     *     myThrottle.consume();
     *     // Do it.
     *     return "I did it";
     * }
     */
    consume(): void {
        this.fill--;
    }

    /**
     * Returns a promise that is guaranteed to resolve (in FIFO order), but not sooner
     * than the throttle allows. For certain use cases this provides a more convenient
     * alternative compared to using the {@link Throttle#waitTime waitTime} and 
     * {@link Throttle#consume consume()} pair. 
     * @example
     * async function doSomething() {
     *     await myThrottle.permit();   // Resolves immediately or as soon as possible.
     *     // Do it.
     *     return "I did it";
     * }
     */
    permit(): Promise<any> {
        return new Promise((resolve, reject) => {
            const delay = this.waitTime;
            if (delay <= 0) resolve(null);
            this.queue.push(resolve);
            setInterval(this.next, delay);
        });
    }
}
