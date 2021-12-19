'use strict';

class RequestQueue {
    #maxQueueTime = 60 * 1000;
    #maxQueueSize = 1000;
    #queue = [];

    constructor (maxQueueSize = Number.POSITIVE_INFINITY, maxQueueTime = 60 * 1000) {
        this.#maxQueueSize = maxQueueSize;
        this.#maxQueueTime = maxQueueTime;

        // We could add this to the prototype of Array but that
        // might affect other code.
        this.#queue.remove = function (elem) {
            for (let i=0; i < this.length; i++)
                if (this[i] === elem)
                    return this.splice(i, 1)[0];
            return null;
        };        
    }
    
    place(request) {
        let timeout = this.#maxQueueTime;

        request.queue      = this;
        request.queueTime  = (new Date()).getTime();
        request.autoCancel = setTimeout((delay) => request.cancel(delay), timeout, Math.round(timeout / 1000));

        this.#queue.push(request);
    }

    take(i) {
        if (this.#queue.length === 0) return undefined;

        const request = i > 0 ? this.#queue.splice(i, 1)[0] : this.#queue.shift();
        clearTimeout(request.autoCancel);

        return request;
    }

    takeNext() { return this.take() }

    release(request, error, data) {
        request = this.#queue.remove(request);
        if (!request) return;

        clearTimeout(request.autoCancel);
        request.releaseTime  = (new Date()).getTime();

        if (!error && !data) return; // When cancelled.

        setImmediate(() => request.callback(error, data));
    }

    clear(i) {
        let request = null;

        // No 'i'? Clear the whole queue.
        if (i === undefined) {
            while (request = this.#queue.shift()) {
                clearTimeout(request.autoCancel);

                request.cancel("The request queue was cleared");
            }
        }
        // Clear only the request at 'i'- if we have it.
        else if (request = take(i)) {
            clearTimeout(request.autoCancel);

            request.cancel("The request was deleted");
        }
        else {
            // Sad. We don't have a request at 'i'...
        }
    }

    peek(i) {      return this.#queue[i || 0]; }
    get isFull() { return this.#queue.length >= this.#maxQueueSize; }
    get length() { return this.#queue.length; }
} 

class GlobalRequestQueue extends RequestQueue {
    #tenants = null;

    constructor(global, maxQueueSize, maxQueueTime) {
        super(maxQueueSize, maxQueueTime); 

        this.#tenants = global.tenants;
    }
    
    takeNext(host, olderThan) {
        olderThan = olderThan || (new Date()).getTime();
    
        let request = null;
    
        for (let i=0; !request && i < this.length; i++) {
            const queuedRequest = this.peek(i) || {};
            const suitableHosts = this.#tenants[queuedRequest.tenant].hosts;

            if (suitableHosts.includes(host) && queuedRequest.queueTime < olderThan)
                request = this.take(i);  // The calling host can handle this one. 
        }
    
        return request;
    }
}

module.exports = { RequestQueue, GlobalRequestQueue };