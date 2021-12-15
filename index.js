'use strict';

const Ring    = require('./Ring.js');
const Host    = require('./Host.js');
const Request = require('./Request.js');
const { CancellableEventEmitter, CancellablePromise } = require('./Cancellables.js');
const { GlobalRequestQueue } = require('./RequestQueue.js');

/**
 * @typedef RequestOptions
 * @property {string} tenant    - Name of the tenant. The tenant's definition in config.json
 *                                provides the base URL, port and token information.
 * @property {string} endPoint  - The URL of the request. The URL is relative to the base URL for
 *                                the specified tenant.
 * @property {string} [queryData=""]    - The query parameters to be appended to the request.
 * @property {string} [postData=null]   - The data to be posted as part of the request.
 * @property {string} [method=GET|POST] - The HTTP request method. The default is 'GET'
 *                                if the 'postData' parameter is empty, and 'POST' otherwise.
 * @property {boolean} [stream=false]   - Whether the response should be streamed back to the caller.
 * WHAT HAPPENS HERE? More details. The postData is piped to the reuqest,
 * amd the response if streamed back to the caller. How? See PROCESS_GROUP_INSTANCE implementation.
 * @property {number} [timeout=maxQueueTime] - The number of seconds before the request will time out.
 * @property {number} [retries=tenantRetryLimit] - The number of times the request can be retried.
 *        The default is the number of retries specified in the tenant definition in config.json.
 */

/**
 * @typedef RequestError
 * @property {number} code - The HTTP status code.
 * @property {string} message - The error message.
 */

/**
 * @callback RequestCallback
 * @param {RequestError} error - The error if the request could not be fulfilled.
 * @param {object} response - The Dynatrace API's response, as a parsed JSON object,
 * if the request was succesful.
 */

/**
 * Creates a pool of connections to the Dynatrace API for multiple tenants and clusters.
 * @constructor
 * @param {object} config - The configuration for the tenants.
 * @param {object} limits - The rate limits, timeouts and queue sizes.
 * @classdesc Provides load balancing and rate-limited access to a pool of hosts that
 * expose the Dynatrace API.
 */
function APIBalancer(config, limits) {}

/**
 * Submit a request to the Dynatrace API. The DynatraceAPI will find the best
 * host to handle the request, or queue the request if necessary.
 * @param {RequestOptions} requestOptions - The parameters for the request.
 * @param {RequestCallback} callback - (Optional) The callback that handles the response. If specified, this method returns a {@link CancellableEventEmitter}. If not specified, this method returns a {@link CancellablePromise}.
 * @returns {CancellableEventEmitter|CancellablePromise} Either (1) an object at
 * which the progress of the request can be monitored and at which the request can
 * be canceled, or (2) a Promise(-like) object at which the request can be canceled.
 */
APIBalancer.prototype.request = function (requestOptions, callback) {}

/**
 * Cancel all running and/or queued requests and reset the connection pool.
 */
APIBalancer.prototype.restart = function () {}

/**
 * Cancel all running and/or queued requests and delete the connection pool.
 */
APIBalancer.prototype.shutdown = function () {}

/**
 * Report the health of the connection pool. If no parameters are specified, the health
 * report will be returned. If both parameters are specified, the callback will be called
 * with the health report as its only parameter, per the specified frequency.
 * @param {number} [frequency] - The requency with which the health of the
 * connection pool should be reported.
 * @param {function} [callback] - The function that consumes the health report.
 */
APIBalancer.prototype.getHealth = function (frequency, callback) {}

/*** START OF ACTUAL IMPLEMENTATION ***/

const APIBalancerIF = function (config, limits) {
    const self = this;

    config = config || {};

    // TODO: These limits can also be defined on a tenant level. And we should
    // also allow for throttling limits on a tenant level just the way we do 
    // for the ThrottleService tokens.
    const {
        reqRateLimit = 200, // Maximum request rate in requests per minute.
        maxQueueTime = 10,  // Maximum time for a request to stay queued (sec).
        retryLimit   = 3,   // Maximum number of retries before reporting an error.
        maxQueueSize = 10,  // Maximum length of the local queues (ie. highWaterMark).
        requestLimit = 10   // Upper limit to number of outstanding requests.
    } = limits;

    this.hosts   = {};
    this.tenants = {};

    /*  We maintain a global non-tenant-specific queue that idle hosts can peek 
        in to see if there's a request waiting for a tenant that it serves.

        NOTE: What we're missing is the notion of 'cluster'. Then we could make
        a queue per cluster rather than one global one. But we don't have such
        concept here yet, so - one global queue it is...
     */
    this.globalQueue = new GlobalRequestQueue(this.tenants, limits.queueLimit, limits.maxQueueTime);

    /*  We use a single, consolidated accounting of all hosts so that we can 
        properly distribute requests accross them, and throttle the requests 
        handled by each of them. We thus add the hosts for each tenant to the 
        consolidated admin while avoiding duplicates.
        In Dynatrace Managed there can be several tenants pointing to the same
        cluster nodes, but also tenants that point to different cluster nodes.
        Since we throttle per host, not per tenant, we replace each host name 
        with a Host object that throttles its own requests.
     */    
    Object.keys(config).forEach(tenant => {
        // Make sure we always have a list of hosts, even if only one. 
        let tenantHosts = config[tenant].hosts || 
                         (config[tenant].host ? [ config[tenant].host ] : []);

        if (tenantHosts.length === 0)
            throw new Error("No hosts available for " + tenant);

        self.tenants[tenant] = { ...config[tenant] };   // Copy config over.

        self.tenants[tenant].hosts = tenantHosts.map(hostName => {
            // Create a new host if we didn't already have it.
            self.hosts[hostName] = self.hosts[hostName] || 
                                   new Host(hostName, self.globalQueue, limits);

            // Return the Host object for this host name.
            return self.hosts[hostName];
        }); 
    });

    // Convert the hosts object to a Ring for easy round-robining.
    this.hosts = new Ring(Object.values(this.hosts));

    /*** APIS WE EXPOSE ***/

    function resetHosts(forced) {
        if (this.hosts) this.hosts.forEach(host => host.reset(forced));
    }

    /*  This is the main function. Requests are submitted here and shopped 
        across the available hosts until we find one that can handle the
        request. The 'onDone()' callback will called with the result of 
        executing the request, or with the error if something went wrong.
     */
    function submitRequest(options, onDone) {
        // Callers can give us a tenant name or a tenant object. If it is
        // an object, we want to exchange that for our own tenant object.
        const name   = typeof options.tenant === "string"
                     ? options.tenant
                     : options.tenant.name;
        const tenant = self.tenants[name];

        if (!tenant) {
            setImmediate(() => onDone({
                status:  404,
                message: "Tenant '" + name + "' not found"
            }));   

            return new CancellableEventEmitter();
        }

        // Create a request object that we can shop around.
        const request = new Request(tenant, options, limits, onDone);

        if (options.noQueue) {
            /*  STRATEGY "noQueue": Don't queue this request because the caller 
                is able to wait and retry if it runs into a throttle limit. 
                Thus, we will try to find the host that can best accept this 
                request immediately.
             */
            let host = null;
            let availability = Number.NEGATIVE_INFINITY;
            let bestHost = { host, availability };
            let i = self.hosts.length;

            while (i > 0) {
                host = self.hosts.next();    // Iterate over available hosts.

                // Is this suitable host more available than the best one so far?
                availability = host.availability;
                if (tenant.hosts.includes(host) && availability > bestHost.availability)
                    bestHost = { host, availability };

                i--;     // Count down number of hosts we evaluated and compared.
            }

            // Ask the most viable host to accept this request.
            if (bestHost.host && bestHost.host.accept(request))
                return request.emitter;
                
            /*  Note that even the best host we found may still NOT have accepted 
                this request at this point. If that is so, the request will NOT 
                have been put in a hosts's local queue - and we won't be placing  
                it in the global queue either. The presence in a queue is what we 
                test for (below) to see if there's a real problem with the hosts.
             */
        }
        else {
            /*  STRATEGY "noReject": If there are no hosts that can handle this 
                request immediately, put it on a global queue until somebody gets 
                to it. For callers that are part of a stream this results in 
                backpressure. If a host does accept this request, then that's 
                even better of course.
             */
            let host = null;
            let i = self.hosts.length;

            while (i > 0) {
                host = self.hosts.next();  // Round-robin over available hosts.

                // If this host serves this tenant, ask it to accept our request.
                if (tenant.hosts.includes(host) && host.accept(request))
                    return request.emitter;

                i--;    // Count down number of hosts we tried, and keep trying.
            }

            /*  Nobody accepted! So we put it in the global queue. If everybody is
                busy (instead of dead), requests will complete in the future, and
                the requests in this queue will be consumed.

                TODO: Ensure that no timeout applies.
             */
            self.globalQueue.place(request);
        }

        if (!request.queue) {
            /*  If the request is not yet in a queue, then that's bad. We're going 
                to see if any of the suitable hosts can still communicate with its 
                respective endpoint. If nobody can, we'll have to raise an error. 
                Otherwise they're all just throttling our requests. 
             */            
            Promise.any(tenant.hosts.map(host => host.isAlive(tenant)))
            .then(() => onDone({
                status:  429,
                message: "All endpoints for " + tenant.name + " are busy"
            }))
            .catch(() => onDone({
                status:  503,
                message: "All endpoints for " + tenant.name + " are unreachable"
            }));
        }

        /*  This thing goes back to the caller as the representative of the
            actual request. Event listeners can be registered on it, and it
            even has a 'cancel()' method that cancels the request. Putting 
            it in a queue is what creates the ability to cancel a request.
         */
        return request.emitter;
    }

    function healthReport(callback) {
        const now = (new Date()).getTime();

        const report = [];

        let hostReport = {
            name:   "Host pool global queue",
            queued: []
        };

        for (let i = 0; i < self.globalQueue.length; i++) {
            let request = self.globalQueue.peek(i);

            hostReport.queued.push({
                url:     request.options.url,
                waiting: Math.round((now - request.queueTime) / 1000),
                timeout: Math.round(request.timeout / 1000)
            });
        }
        report.push(hostReport);

        for (let h = 0; h < self.hosts.length; h++) {
            let host = self.hosts.at(h);

            hostReport = {
                name:   host.name,
                queued: [],
                issued: []
            };

            for (let i = 0; i < host.localQueue.length; i++) {
                let request = host.localQueue.peek(i);

                hostReport.queued.push({
                    url:     request.options.url,
                    waiting: Math.round((now - request.queueTime) / 1000),
                    timeout: Math.round(request.timeout / 1000)
                });
            }

            for (let i = 0; i < host.issuedList.length; i++) {
                let request = host.issuedList.peek(i);

                hostReport.issued.push({
                    url:     request.options.url,
                    waiting: Math.round((now - request.queueTime) / 1000),
                    timeout: Math.round(request.timeout / 1000)
                });
            }

            report.push(hostReport);
        }

        if (callback)
            callback(report);
        else
            return report;
    }

    // Return our public interface.
    return {
        request: function (options, onDone) {
            /*  If there's a callback, return a CancellableEventEmitter.
                If there is no callback, return a CancellablePromise.

                Both objects expose a 'cancel(reason)' method that may
                be called later for whatever reason. 
             */
            if (onDone) {
                return submitRequest(options, onDone);
            }
            else {
                return new CancellablePromise((resolve, reject, cancel) => {
                        const emitter = submitRequest(options, (err, data) => {
                            if (err)
                                reject(err);
                            else 
                                resolve(data);
                        });
                        // This registers our 'cancel' handler. It just delegates
                        // the cancellation to the emitter, who knows what to do.
                        cancel(reason => emitter.cancel(reason));
                    }
                );
            }
        },
        restart: function () {
            resetHosts(true);   // Cancel all waiting requests.
        },
        shutdown: function () {
            resetHosts(true);   // Cancel all waiting requests.
            self.hosts = [];    // Prevent any new requests.
        },
        getHealthMetrics: function (frequency, callback) {
            if (frequency && callback)
                return setInterval(healthReport, frequency, callback);
            else
                return healthReport();
        }
    };
};

module.exports = APIBalancerIF;