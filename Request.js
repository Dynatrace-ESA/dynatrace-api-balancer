'use strict';

const axios = require('axios').default;
const { CancellableEventEmitter } = require('./Cancellables.js');

class Request {
    options     = null;
    tenant      = null;
    stream      = null;
    queue       = null;  // Set by Queues.
    createTime  = null;  // Set here.
    queueTime   = null;  // Set by Queues.
    releaseTime = null;  // Set by Queues.
    autoCancel  = null;  // Set by Queues.
    retryLimit  = null;
    attempts    = null;  // Set by Host
    emitter     = null;
    callback    = null;
    abort       = null;  // Will be set by the CancelToken once the request is issued.

    constructor(tenant, options, limits, onDone) {
        /*  The 'options' object will be passed to Axios as-is, 
            with a few updates by this constructor.        
         */  
        options.timeout = !options.timeout
                        ? limits.maxQueueTime * 1000
                        : options.timeout < 300
                        ? options.timeout * 1000
                        : options.timeout;
        options.method  = options.method || (options.data ? "post" : "get");
        options.headers = Object.assign(options.headers || {}, {
            'Authorization': 'Api-Token ' + tenant.token,
            'Content-Type' : 'application/json',
            'Accept'       : 'application/json'
        });
        
        // Older code may still pass a query string. 
        if (typeof options.params === 'string') {
            const params = options.params.split('&');
            options.params = {};
            params.forEach(param => {
                const parts = param.split('=');
                options.params[parts.shift] = parts.join('=');
            });
        }

        // We want to handle certain HTTP status codes ourselves.
        options.validateStatus = status => 
            (status  >= 200 && status  <  400) || 
             status === 429 || status === 500  || status === 503;

        // Setting a cancelToken makes the request cancellable (once it has been
        // issued). The argument to 'CancelToken()' is a function that receives
        // a 'cancel()' function as a parameter, which we store so that we can
        // invoke it when we are asked to cancel the request.
        options.cancelToken = new axios.CancelToken(cancel => this.abort = cancel);
           
        this.options    = options;
        this.tenant     = tenant;
        this.stream     = options.responseType === 'stream';
        this.createTime = (new Date()).getTime();
        this.retryLimit = options.retryLimit || tenant.retryLimit || limits.retryLimit;
        this.attempts   = 0; // Will be set as request gets retried.

        // Remove our specific properties that Axios doesn't understand.
        delete options.tenant;
        delete options.retryLimit;    
        delete options.noQueue;
        
        // This object here will emit events regarding the requests's
        // progress. Callers can also call 'cancel()' on it.
        this.emitter  = new CancellableEventEmitter(this);
        this.callback = (err, data) => {
            try {
                onDone(err, data);
            }
            catch (ex) {
                this.emitter.emit("error", "Error delivering data: " + ex.message);
            }
        };
    }
    
    setHost(host) {
        // Note that 'baseURL' is something Axios needs. Once a host accepts a
        // request, it calls us here, and then we update the request so that 
        // Axios can issue it. Thus, the URL in 'options' is kept relative.
        this.options.baseURL = (this.tenant.protocol || "https") + "://" + host 
                             + (this.tenant.port ? ":" + this.tenant.port : "") 
                             + (this.tenant.url || "");
        return this.options.baseURL;
    }

    // The queues can call this if the request has been on the queue for too long.
    // Original requestors can call this as well from the CancellableEventEmitter. 
    // Queues will give us the timeout they applied. Through the emitter we may
    // get a reason. If we do, the request will be reported as 'Cancelled' to the 
    // original requestor with that reason(promise or callback). If we don't get 
    // a reason, the request will be cancelled silently.
    cancel(reason) {
        this.attempts = 0;  // Prevent any retries.

        // The 'abort()' function is set once Axios has created the HTTP request.
        // See the use of the 'CancelToken', above. That's what sets it.
        if (this.abort) {
            this.abort();   

            this.queue.release(this, 
                typeof reason === "number"
                ? {
                    status:  408,
                    message: "Request Timeout - no response" + (reason ? " within " + reason + "s" : "")
                  }
                : reason 
                ? {
                    status:  2,      // Cancelled (1 is 'Not Issued').
                    message: reason
                } 
                : undefined
            );
        } 
        else {
            this.queue.release(this, 
                typeof reason === "number"
                ? {
                    status:  429,
                    message: "Too Many Requests - not issued" + (reason ? " within " + reason + "s" : "")
                  }
                : reason
                ? {
                    status:  2,      // Cancelled (1 is 'Not Issued').
                    message: reason
                } 
                : undefined
            );
        }
    }

    /*  When using axios, the rejectUnauthorized works like this:

        const agent = new https.Agent({ rejectUnauthorized: false });
        axios.get('https://something.com/foo', { httpsAgent: agent });

        OR:
        https.globalAgent.options.rejectUnauthorized = false;

        As a last resort, this can be placed in the top of the main JS file:
        "use strict"; 
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
     */    
}

module.exports = Request;