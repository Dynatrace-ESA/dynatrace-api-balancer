import EventEmitter from "events";

/**
 * A cancellable event emitter at which the progress of a request
 * can be monitored and at which the request can be cancelled. See the NodeJS
 * [EventEmitter]{@link https://nodejs.org/api/events.html#events_class_eventemitter}
 * documentation for more information.
 * @extends EventEmitter
 */
export class CancellableEventEmitter extends EventEmitter {

    /**
     * Creates an instance.
     * @param {object} request - An object that should expose an 'cancel()' method
     * that accepts an optional reason (string).
     */
    constructor(private request: { cancel: Function } = { cancel: () => { } }) {
        super();
        this.on('error', () => { });   // One MUST be registered. Otherwise... BOOM!
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
export class CancellablePromise extends Promise<any> {
    private onCancel = (reason?: string | number): void => { };
    
    constructor(executor: (resolve: Function, reject: Function, cancel: Function) => void) {
        super((resolve, reject) => {
            executor(resolve, reject, (cancel) => {
                // Async because we can't use "this" before super().
                setTimeout(() => { this.onCancel = cancel });
            });
        });
    }

    /**
     * Cancel the request. If a reason is provided, it will cause the 
     * {@link CancellablePromise} returned by the {@link BalancedAPIRequest#fetch fetch()} 
     * method to be called with a {@link RequestError} as it single argument, 
     * containing status 512 and this reason as its message.
     * 
     * @param {string} reason - The reason for the cancellation. If omitted, the request will be cancelled or aborted silently.
     */
    cancel(reason): void {
        return this.onCancel(reason);
    }
}
