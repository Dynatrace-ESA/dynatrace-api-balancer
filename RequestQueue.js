'use strict';

class RequestQueue {
    #maxQueueTime = 0;
    #size = 0;
    #queue = [];

    constructor (size = Number.POSITIVE_INFINITY, maxQueueTime = 60) {
        this.#size = size;
        this.#maxQueueTime = maxQueueTime * 1000;

        // We could add this to the prototype of Array but that
        // might affect other code.
        #queue.remove = function (elem) {
            for (let i=0; i < this.length; i++)
                if (this[i] === elem)
                    return this.splice(i, 1)[0];
            return null;
        };        
    }
    
    place(request) {
        let timeout = request.timeout || this.#maxQueueTime;

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
    get isFull() { return this.#queue.length >= this.#size; }
    get length() { return this.#queue.length; }
} 

class GlobalRequestQueue extends RequestQueue {
    #tenants = null;

    constructor(tenants, size, maxQueueTime) {
        super(size, maxQueueTime); 

        this.#tenants = tenants;
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