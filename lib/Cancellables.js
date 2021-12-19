'use strict';

const EventEmitter = require('events');

 /**
  * A cancellable event emitter at which the progress of a request
  * can be monitored and at which the request can be cancelled. See the NodeJS
  * [EventEmitter]{@link https://nodejs.org/api/events.html#events_class_eventemitter}
  * documentation for more information.
  * @extends EventEmitter
  */
  class CancellableEventEmitter extends EventEmitter {
    /**
     * Creates an instance.
     * @param {object} request - An object that should expose an 'cancel()' method
     * that accepts an optional reason (string).
     */
    constructor(request) {
        super();
        this.request = request || { cancel: () => {} };
        this.on('error', () => {});   // One MUST be registered. Otherwise... BOOM!
    }

    /**
     * Cancel the request. If a reason is provided, it will cause the 
     * {@link RequestCallback} provided to the {@link BalancedAPIRequest#fetch fetch()} method 
     * to be called with a {@link RequestError} as it single argument, containing 
     * status 512 and this reason as its message.
     * 
     * @param {string} reason - The reason for the cancellation. If omitted, the request will be cancelled or aborted silently.
     */
    cancel(reason) {
        try {
            this.request.cancel(reason);
        } 
        catch (ex) {
            /* NOP */ 
        }
        return null;
    }
}

/**
 * A cancellable Promise tat which the request can be cancelled.
 * @extends Promise
 */
class CancellablePromise extends Promise {
    #onCancel = () => {};

    constructor(executor) {
        const setOnCancel = (cancel) => {
            // Async because we can't use "this" before super().
            setTimeout(() => { this.#onCancel = cancel });
        }
        const cancellableExecutor = (resolve, reject) => {
            executor(resolve, reject, setOnCancel);
        } 
        super(cancellableExecutor);
    }

    /**
     * Cancel the request. If a reason is provided, it will cause the 
     * {@link CancellablePromise} returned by the {@link BalancedAPIRequest#fetch fetch()} 
     * method to be called with a {@link RequestError} as it single argument, 
     * containing status 512 and this reason as its message.
     * 
     * @param {string} reason - The reason for the cancellation. If omitted, the request will be cancelled or aborted silently.
     */    
    cancel(reason) {
        this.#onCancel(reason);
    }    
}

module.exports = { CancellableEventEmitter, CancellablePromise }