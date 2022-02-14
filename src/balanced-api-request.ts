import { CancellableEventEmitter, CancellablePromise } from "./cancellables";
import { GlobalRequestQueue } from "./request-queue";
import { Limits, RequestCallback, RequestOptions, Tenants, TenantConfig } from "./types";
import { Host } from './host';
import { Request } from "./request";
import { Ring } from "./ring";
import { Throttle, NoThrottle } from "./throttle";

const limitDefaults = {
    reqRateLimit: 200,  // Maximum request rate in requests per minute.
    maxQueueTime: 10,   // Maximum time for a request to stay queued (sec).
    maxRetries:   3,    // Maximum number of retries before reporting an error.
    maxQueueSize: 500,  // Maximum length of the local queues (ie. highWaterMark).
    requestLimit: 20,   // Upper limit to number of outstanding requests.
    retryAfter:   100,  // ms
    timeout:      50000 // ms
};

/**
 * The BalancedAPIRequest class enriches the functionality of {@link DirectAPIRequest}
 * with an efficient load balancing, queuing and request throttling layer that protects
 * the Dynatrace cluster from request overload while ensuring that for each request the
 * best (most available) cluster node is selected to handle that request. Additionally,
 * it provides a simple way to cancel any request if the caller is no longer interested
 * in the response. 
 */
export class BalancedAPIRequest {

    private hosts: Ring<Host> = new Ring<Host>();
    private tenants: { [key: string]: TenantConfig };
    private globalQueue: GlobalRequestQueue;

    /**
     * Creates a pool of connections to reach multiple tenants and clusters.
     * @constructor
     * @param limits  - Default values for `retryLimit`, `retryAfter` and `timeout`.
     * @param tenants - The configurations for the tenants. 
     */
    constructor (private limits: Limits = {}, tenants: Tenants = {}) {
        // TODO: These limits can also be defined on a tenant level. And we should
        // also allow for throttling limits on a tenant level just the way we do
        // for the ThrottleService tokens.
        const hosts = [];

        this.limits  = { ...limitDefaults, ...limits };
        this.tenants = {};

        /*  We maintain a global non-tenant-specific queue that idle hosts can peek 
            in to see if there's a request waiting for a tenant that it serves.

            NOTE: What we're missing is the notion of 'cluster'. Then we could make
            a queue per cluster rather than one global one. But we don't have such
            concept here yet, so - one global queue it is...
        */
        this.globalQueue = new GlobalRequestQueue(this, limits.maxQueueSize, limits.maxQueueTime);

        /*  We use a single, consolidated accounting of all hosts so that we can 
            properly distribute requests accross them, and throttle the requests 
            handled by each of them. We thus add the hosts for each tenant to the 
            consolidated admin while avoiding duplicates.
            In Dynatrace Managed there can be several tenants pointing to the same
            cluster nodes, but also tenants that point to different cluster nodes.
            We replace each host with a Host object that throttles its own requests.
        */
        Object.keys(tenants).forEach(tenant => {
            // Distribute the request limits over the number of hosts for this tenant.
            const hostList = tenants[tenant].hosts || [ tenants[tenant].host ];
            const hostLimits = { ...{
                    reqRateLimit: Math.round(this.limits.reqRateLimit / hostList.length),
                    requestLimit: Math.round(this.limits.requestLimit / hostList.length)
                }, 
                ...this.limits
            }            
            this.tenants[tenant] = {
                name:     tenants[tenant].name,
                token:    tenants[tenant].token,
                hosts:    hostList
                    .map(hostName => {
                        // Create a new Host object if we didn't already have it,
                        // Or raise its limits if we do.
                        if (hosts[hostName]) 
                            hosts[hostName].raiseLimits(hostLimits);
                        else 
                            hosts[hostName] = new Host(hostName, this.globalQueue, hostLimits); 

                        return hosts[hostName];
                    }),
                port:     tenants[tenant].port || 443,
                url:      tenants[tenant].url,
                protocol: tenants[tenant].protocol || "https",
                // If the tenant has a request rate limit, create a throttle to enforce it.
                throttle: tenants[tenant].reqRateLimit
                        ? new Throttle(tenants[tenant].reqRateLimit, 60 * 1000)
                        : new NoThrottle()
            }; 
        });

        // Convert the hosts object to a Ring for easy round-robining.
        this.hosts = new Ring(Object.values(hosts));
    }

    private resetHosts(): void {
        if (this.hosts) this.hosts.forEach(host => host.reset());
    }

    /**
     * This is the main function. Requests are submitted here and shopped 
     * across the available hosts until we find one that can handle the
     * request. The 'onDone()' callback will called with the result of 
     * executing the request, or with the error if something went wrong.
     *
     * @memberof BalancedAPIRequest
     */
    private submitRequest(options: RequestOptions, onDone: (error?: any, data?: any) => any) {
        // Callers can give us a tenant name or a tenant object. If it is
        // an object, we want to exchange that for our own tenant object.
        const name   = typeof options.tenant === "string"
                     ? options.tenant
                     : options.tenant.name;
        const tenant = this.tenants[name];

        if (!tenant) {
            setImmediate(() => onDone({
                status: 404,
                message: "Tenant '" + name + "' not found"
            }));

            return new CancellableEventEmitter();
        }

        // Create a request object that we can shop around.
        const request = new Request(tenant, options, this.limits, onDone);

        if (options.noQueue) {
            /*  STRATEGY "noQueue": Don't queue this request because the caller 
                is able to wait and retry if it runs into a throttle limit. 
                Thus, we will first check if the tenant has capacity right now,
                and then we'll try to find the host that can best accept this 
                request immediately.
            
                Note that once the request is about to be issued, we'll wait 
                for final permission from the tenant's throttle. Consuming a 
                unit happens there. We do this check here, too because we're  
                not allowed to queue - which includes waiting of any kind.
            */
            if (tenant.throttle.waitTime > 0) {
                setImmediate(() => onDone({
                    status: 429,
                    message: "Too many requests for " + tenant.name
                }));
                return request.emitter;
            }

            let host = null;
            let availability = Number.NEGATIVE_INFINITY;
            let bestHost = { host, availability };
            let i = this.hosts.length;

            while (i > 0) {
                host = this.hosts.next();    // Iterate over available hosts.

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
            let i = this.hosts.length;

            while (i > 0) {
                host = this.hosts.next();  // Round-robin over available hosts.

                // If this host serves this tenant, ask it to accept our request.
                if (tenant.hosts.includes(host) && host.accept(request))
                    return request.emitter;

                i--;    // Count down number of hosts we tried, and keep trying.
            }

            /*  Nobody accepted! So we put it in the global queue. If everybody is
                busy (instead of dead), requests will complete in the future, and
                the requests in this queue will be consumed.
            */
            this.globalQueue.place(request);
        }

        if (!request.queue) {
            /*  If the request is not yet in a queue, then that's bad. We're going 
                to see if any of the suitable hosts can still communicate with their 
                respective endpoint. If nobody can, we'll have to raise an error. 
                Otherwise they're all just throttling our requests. 
            */
            Promise.any(tenant.hosts.map(host => host.isAlive(tenant)))
                .then(() => onDone({
                    status: 429,
                    message: "All endpoints for " + tenant.name + " are at capacity"
                }))
                .catch(() => onDone({
                    status: 503,
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

    private healthReport(callback?: Function) {
        const now = (new Date()).getTime();

        const report = [];

        let hostReport = {
            name: "Host pool global queue",
            queued: [],
            issued: []
        };

        for (let i = 0; i < this.globalQueue.length; i++) {
            let request = this.globalQueue.peek(i);

            hostReport.queued.push({
                url: request.options.url,
                waiting: Math.round((now - request.queueTime) / 1000),
                timeout: Math.round(request.options.timeout / 1000)
            });
        }
        report.push(hostReport);

        for (let h = 0; h < this.hosts.length; h++) {
            let host = this.hosts.at(h);

            hostReport = {
                name: host.name,
                queued: [],
                issued: []
            };

            for (let i = 0; i < host.localQueue.length; i++) {
                let request = host.localQueue.peek(i);

                hostReport.queued.push({
                    url: request.options.url,
                    waiting: Math.round((now - request.queueTime) / 1000),
                    timeout: Math.round(request.options.timeout / 1000)
                });
            }

            for (let i = 0; i < host.issuedList.length; i++) {
                let request = host.issuedList.peek(i);

                hostReport.issued.push({
                    url: request.options.url,
                    waiting: Math.round((now - request.queueTime) / 1000),
                    timeout: Math.round(request.options.timeout / 1000)
                });
            }

            report.push(hostReport);
        }

        if (callback)
            callback(report);
        else
            return report;
    }

    /**
     * Issues a request to a Dynatrace API. 
     * @async
     * @param {RequestOptions} options - The request options, Axios-style. 
     * @param {RequestCallback} [onDone] - Callback that handles the result (alternative to using a Promise).
     * @returns {CancellableEventEmitter|CancellablePromise} 
     * If `onDone` is provided, this method returns a {@link CancellableEventEmitter}.
     * Else, this method returns a {@link CancellablePromise}.
     * 
     * @description
     * Note that in this class the {@link RequestOptions} object also supports the `noQueue` property.
     * 
     * Required properties in the {@link RequestOptions} object (unless an alias is used - see below):
     * - `url`: URL relative to the `tenant`. Ex.: `'/api/v2/entities'`.
     * - `tenant`: Name of the Dynatrace tenant. Ex.: `'PROD'`.
     *
     * For convenience aliases have been provided for the following request methods:
     * - `get(url, options[, onDone])`
     * - `delete(url, options[, onDone])`
     * - `post(url, data, options[, onDone])`
     * - `put(url, data, options[, onDone])`
     */
    public fetch(options: RequestOptions, onDone: RequestCallback = null): CancellableEventEmitter | CancellablePromise {
        /*  If there's a callback, return a CancellableEventEmitter.
            If there is no callback, return a CancellablePromise.

            Both objects expose a 'cancel(reason)' method that may
            be called later for whatever reason. 
            */
        if (onDone) {
            return this.submitRequest(options, onDone);
        }
        else {
            return new CancellablePromise((resolve: Function, reject: Function, cancel: Function) => {
                const emitter = this.submitRequest(options, (err, data) => {
                    if (err)
                        reject(err);
                    else
                        resolve(data);
                });
                // This registers our 'cancel' handler. It just delegates
                // the cancellation to the emitter, who knows what to do.
                cancel(reason => emitter.cancel(reason));
            });
        }
    }
    public async get(url, options, onDone = null) {
        options.url = url;
        options.method = 'get';
        return this.fetch(options, onDone);
    }
    public async delete(url, options, onDone = null) {
        options.url = url;
        options.method = 'delete';
        return this.fetch(options, onDone);
    }
    public async post(url, data, options, onDone = null) {
        options.url = url;
        options.data = data;
        options.method = 'post';
        return this.fetch(options, onDone);
    }
    public async put(url, data, options, onDone = null) {
        options.url = url;
        options.data = data;
        options.method = 'put';
        return this.fetch(options, onDone);
    }
    /**
     * Cancel all running and/or queued requests and reset the connection pool.
     * @memberof BalancedAPIRequest
     */
    public restart() {
        this.resetHosts();   // Cancel all waiting requests.
    }
    /**
     * Cancel all running and/or queued requests and delete the connection pool.
     * @memberof BalancedAPIRequest
     */
    public shutdown() {
        this.resetHosts();   // Cancel all waiting requests.
        this.hosts = new Ring<Host>();    // Prevent any new requests.
    }
    /**
     * Report the health of the connection pool. If no parameters are specified, the health
     * report will be returned. If both parameters are specified, the callback will be called
     * with the health report as its only parameter, per the specified frequency.
     * @memberof BalancedAPIRequest
     * @param {number} [frequency] - The requency with which the health of the
     * connection pool should be reported.
     * @param {function} [callback] - The function that consumes the health report.
     */
    public getHealthMetrics(frequency, callback) {
        if (frequency && callback)
            return setInterval(this.healthReport, frequency, callback);
        else
            return this.healthReport();
    }
};
