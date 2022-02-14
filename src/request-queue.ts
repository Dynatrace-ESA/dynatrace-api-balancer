import { Request } from "./request";
import { Host } from './host';

export class RequestQueue {
    // @ts-expect-error
    private queue: Array<Request> & { remove: (Request) => Request } = [];

    /**
     * @param maxQueueSize Maximum size of the queue (items)
     * @param maxQueueTime Maximum time to spend in the queue (ms)
     */
    constructor(private maxQueueSize = Number.POSITIVE_INFINITY, private maxQueueTime = 60 * 1000) {

        // We could add this to the prototype of Array but that
        // might affect other code.
        this.queue.remove = function (elem) {
            for (let i = 0; i < this.length; i++)
                if (this[i] === elem)
                    return this.splice(i, 1)[0];
            return null;
        };
    }

    /**
     * @param request Request to place on queue.
     */
    place(request: Request): void {
        let timeout = this.maxQueueTime;

        request.queue = this;
        request.queueTime = (new Date()).getTime();
        request.autoCancel = setTimeout((delay) => request.cancel(delay), timeout, Math.round(timeout / 1000));

        this.queue.push(request);
    }

    /**
     * 
     * @param i Index of request to remove from queue.
     * @returns Request removed from queue.
     */
    take(i: number): Request {
        if (this.queue.length === 0) return undefined;

        const request = i > 0 ? this.queue.splice(i, 1)[0] : this.queue.shift();
        clearTimeout(request.autoCancel);

        return request;
    }

    /**
     * 
     * @returns The first request on the queue.
     */
    takeNext(host?: Host, olderThan?: number): Request { return this.take(0); }

    /**
     * @param request Request to release.
     * @param error Error object
     * @param data Data object
     */
    release(request: Request, error?: any, data?: any): void {
        request = this.queue.remove(request);
        if (!request) return;

        clearTimeout(request.autoCancel);
        request.releaseTime = (new Date()).getTime();

        if (!error && !data) return; // When cancelled.

        setImmediate(() => request.callback(error, data));
    }

    /**
     * @param i Index of request to clear. If not provided, the whole queue will be cleared.
     */
    clear(i?: number): void {
        let request = null;

        // No 'i'? Clear the whole queue.
        if (i === undefined) {
            while (request = this.queue.shift()) {
                clearTimeout(request.autoCancel);

                request.cancel("The request queue was cleared");
            }
        }
        // Clear only the request at 'i'- if we have it.
        else if (request = this.take(i)) {
            clearTimeout(request.autoCancel);

            request.cancel("The request was deleted");
        }
        else {
            // Sad. We don't have a request at 'i'...
        }
    }

    /**
     * 
     * @param i Index of request to return.
     * @returns Request at index `i` or index 0.
     */
    peek(i?: number): Request { return this.queue[i || 0]; }

    /**
     * Returns true if the queue is full.
     */
    get isFull(): boolean { return this.queue.length >= this.maxQueueSize; }

    /**
     * Returns current queue length.
     */
    get length(): number { return this.queue.length; }

    /**
     * Increases the maximum queue size by the indicated amount.
     * @param value The amount bby which the maximum queue size should grow.
     * @returns Returns the maximum queue length.
     */
    extendBy(value): number { this.maxQueueSize += value; return this.maxQueueSize; }
}

export class GlobalRequestQueue extends RequestQueue {
    private tenants = null;

    constructor(global, maxQueueSize, maxQueueTime) {
        super(maxQueueSize, maxQueueTime);

        this.tenants = global.tenants;
    }

    takeNext(host: Host, olderThan?: number): Request {
        olderThan = olderThan || (new Date()).getTime();

        let request = null;

        for (let i = 0; !request && i < this.length; i++) {
            const queuedRequest: Request = this.peek(i);

            // If we don't have any request at the index, break out.
            if (!queuedRequest) break;

            const name = typeof queuedRequest.tenant == 'string' 
                ? queuedRequest.tenant 
                : queuedRequest.tenant.name;

            const suitableHosts = this.tenants[name].hosts;

            if (suitableHosts.includes(host) && queuedRequest.queueTime < olderThan)
                request = this.take(i);  // The calling host can handle this one. 
        }

        return request;
    }
}
