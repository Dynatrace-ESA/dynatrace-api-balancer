'use strict';

const EventEmitter = require('events');

 /**
  * A cancellable event emitter at which the progress of a request
  * can be monitored and at which the request can be canceled. See the NodeJS
  * [EventEmitter]{@link https://nodejs.org/api/events.html#events_class_eventemitter}
  * documentation for more information.
  * @extends EventEmitter
  */
  class CancellableEventEmitter extends EventEmitter {
    /**
     * Creates an instance.
     * @param {object} request - An object that should expose an 'abort()' method
     * that accepts a {@link RequestError}.
     */
    constructor(request) {
        super();
        this.request = request || { abort: () => {} };
        this.on('error', () => {});   // One MUST be registered. Otherwise... BOOM!
    }

    /**
     * Cancel the request. It will either (1) cause the {@link RequestCallback} provided to
     * the {@link DynatraceAPI#request} method to be called, or (2) the  {@link CancellablePromise}
     * returned by {@link DynatraceAPI#request} to reject. In both cases a {@link RequestError}
     * will be passed as the first argument, with code 2 and this reason as its message.
     * @param {string} reason - The reason for the cancellation. If omitted, the callback will not be called
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
 * A cancellable Promise that exposes a 'cancel(reason)' method.
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
    cancel(reason) {
        this.#onCancel(reason);
    }    
}

module.exports = { CancellableEventEmitter, CancellablePromise }