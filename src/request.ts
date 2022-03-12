import { CancellableEventEmitter } from './cancellables.js';
import { TenantConfig, RequestOptions, Limits, RequestCallback } from './types.js';

export class Request {
    queue = null;       // Set by Queues.
    createTime = null;  // Set here.
    queueTime = null;   // Set by Queues.
    releaseTime = null; // Set by Queues.
    autoCancel = null;  // Set by Queues.
    emitter: CancellableEventEmitter = null;
    callback: RequestCallback = null;
    abort = null;  // Will be set by the CancelToken once the request is issued.

    /**
     * 
     * @param tenant Tenant connection configuration.
     * @param options Options to follow.
     * @param limits strict performance limits to follow.
     * @param onDone Callback on request completion.
     */
    constructor(public tenant: TenantConfig, public options: RequestOptions, private limits: Limits, private onDone: RequestCallback) {
        /*  The 'options' object will be passed to Axios as-is, 
            with a few amendments made in this constructor.        
         */
        options.timeout = !options.timeout
                        ? limits.timeout
                        : options.timeout < 100
                            ? options.timeout * 1000
                            : options.timeout;
        options.method = options.method || (options.data ? "post" : "get");

        // Set the API token to be used for this tenant.
        options.headers = options.headers || {};
        options.headers['Authorization'] = 'Api-Token ' + tenant.token;

        // Older code may still pass a query string. 
        if (typeof options.params === 'string') {
            const params = options.params.split('&');
            options.params = {};
            params.forEach(param => {
                const parts = param.split('=');
                options.params[parts.shift()] = parts.join('=');
            });
        }

        // ! TBD
        // Setting a cancelToken makes the request cancellable (once it has been
        // issued). The argument to 'CancelToken()' is a function that receives
        // a 'cancel()' function as a parameter, which we store so that we can
        // invoke it when we are asked to cancel the request.
        // options.cancelToken = new axios.CancelToken(cancel => this.abort = cancel);

        this.options = options;
        this.tenant = tenant;
        this.createTime = (new Date()).getTime();

        // Remove the specific properties Axios doesn't understand.
        delete options.tenant;
        delete options.noQueue;

        // This object here will emit events regarding the requests's
        // progress. Callers can also call 'cancel()' on it.
        this.emitter = new CancellableEventEmitter(this);
        this.callback = (err, data) => {
            try {
                onDone(err, data);
            }
            catch (ex) {
                this.emitter.emit("error", "Error delivering data: " + ex.message);
            }
        };
    }

    /**
     * Set the host that accepted this request.
     * @param host DNS hostname string.
     * @returns calculated URL
     */
    setHost(host): string {
        // Note that 'baseURL' is something Axios needs. Once a host accepts a
        // request, it calls us here, and then we update the request so that 
        // Axios can issue it. Thus, the URL in 'options' is kept relative.
        this.options.baseURL = (this.tenant.protocol || "https") + "://" + host
            + (this.tenant.port ? ":" + this.tenant.port : "")
            + (this.tenant.url || "");
        return this.options.baseURL;
    }

    /**
     * The queues can call this if the request has been on the queue for too long.
     * Original requestors can call this as well from the CancellableEventEmitter. 
     * Queues will give us the timeout they applied. Through the emitter we may
     * get a reason. If we do, the request will be reported as 'Cancelled' to the 
     * original requestor with that reason(promise or callback). If we don't get 
     * a reason, the request will be cancelled silently.
     * 
     * @param reason 
     */
    cancel(reason?: string | number): void {
        // The 'abort()' function is set once Axios has created the HTTP request.
        // See the use of the 'CancelToken', above. That's what sets it.
        if (this.abort) {
            this.abort();

            this.queue.release(this,
                typeof reason === "number"
                    ? {
                        status: 408,
                        message: "Request Timeout - No response" + (reason ? " within " + reason + "s" : "")
                    }
                    : reason
                        ? {
                            status: 512,    // Cancelled.
                            message: reason
                        }
                        : undefined
            );
        }
        else {
            this.queue.release(this,
                typeof reason === "number"
                    ? {
                        status: 429,
                        message: "Too Many Requests - Not issued" + (reason ? " within " + reason + "s" : "")
                    }
                    : reason
                        ? {
                            status: 412,   // Precondition not met (i.e. some other error).
                            message: reason
                        }
                        : undefined
            );
        }
    }
}

