'use strict';

const axios = require('axios').default;
const { RequestQueue } = require('./RequestQueue');
const Request = require('./Request.js');

const Host = function (hostName, mainQueue, { requestLimit, queueLimit, maxQueueTime, reqRateLimit }) {
    const self = this;

    const issuedList  = new RequestQueue(requestLimit, maxQueueTime);
    const localQueue  = new RequestQueue(queueLimit, maxQueueTime);
    const globalQueue = mainQueue;
    const resultProps = {
        "/api/v1/userSessionQueryLanguage/tree"       : "values",
        "/api/v1/userSessionQueryLanguage/table"      : "values",
        "/api/v1/entity/infrastructure/processes"     : null,
        "/api/v1/entity/infrastructure/process-groups": null,
        "/api/v1/entity/infrastructure/hosts"         : null,
        "/api/v1/entity/infrastructure/services"      : null,
        "/api/v1/entity/infrastructure/applications"  : null,
        "/api/v1/oneagents"                           : "hosts",
        "/api/config/v1/managementZones"              : "values",
        "/api/config/v1/utoTags"                      : "values",
        "/api/v2/entityTypes"                         : "types",
        "/api/v2/entities"                            : "entities",
        "/api/v2/problems"                            : "problems",
        "/api/v2/metrics/query"                       : "result",
        "/api/v2/metrics"                             : "metrics",
        "/api/v2/auditlogs"                           : "auditLogs",
        "/api/v2/settings/(schemas|objects)"          : "items",
        "/api/v1/synthetic/monitors"                  : "monitors",
        "/api/v2/activeGates"                         : "activeGates",
        "/api/v2/tags"                                : "tags"
    };
    const bucket  = {                   // This is the leaky bucket we use to throttle requests.
        capacity: reqRateLimit,         // Rate in max requests per minute (equals bucket size).
        dripRate: 60000 / reqRateLimit, // If reqRateLimit=30 (req/min), add 1 drop every 2000ms.
        content:  0,
        updated:  0
    };

    function reset() {
        localQueue.clear();
        issuedList.clear();
        refill(true);

        // Ensure that we keep emptying the global queue.
        setTimeout(acceptNext, bucket.dripRate);
    }

    function refill(completely) {
        // Refill the bucket proportional to the time elapsed since last refill.
        const now      = (new Date()).getTime();
        const refill   = completely
                       ? bucket.capacity
                       : Math.floor((now - bucket.updated) / bucket.dripRate);      
        bucket.content = Math.min(bucket.capacity, bucket.content + refill);        
        bucket.updated = Math.min(now, bucket.updated + (refill * bucket.dripRate)); 
    };

    function getAPIResetDelay(headers) {
        const now = (new Date()).getTime();
        const delay = Math.max(10, (bucket.updated + bucket.dripRate) - now);

        if (!headers) {
            return delay;
        }

        let retryAfter = Number(headers["Retry-After"]);
        if (!isNaN(retryAfter)) {
            return Math.max(retryAfter, delay);
        }

        const rateLimitRemaining = Number(headers["x-ratelimit-remaining"]);
        if (isNaN(rateLimitRemaining) || rateLimitRemaining > 0) {
            return delay;
        }

        // Abide by the request rate limit the header tells us.
        const apiRateLimit = Number(headers["x-ratetime-limit"]);
        if (!isNaN(apiRateLimit)) {
            if (apiRateLimit > 0 && apiRateLimit < bucket.capacity) {
                bucket.capacity = apiRateLimit;
                bucket.dripRate = 60000 / apiRateLimit;
            }
        }

        // Calculate delay until the API resets its usage limit.
        let resetTime = Number(headers["x-ratelimit-reset"]);
        if (!isNaN(resetTime)) {
            if (resetTime > 9999999999999)  // 13 digits - micros
                resetTime = Math.ceil(resetTime / 1000);
            return Math.max(resetTime - now, delay);
        }

        return delay;
    }

    async function issueRequest(request) {
        // If we need to append result sets due to paging, we have to account 
        // for situations where the sets are under a property rather than as 
        // top-level flat array.
        let prop = resultProps[request.options.url];
        let list = null;
        let data = null;
        let response = null;
        let waitTime = null;
        let waitAndRetry = null;
        let nextPageKey = null;

        try {
            // Let requestor know about progress.
            request.emitter.emit("progress", "start");        

            do {
                if (waitAndRetry)    // Wait for the specified amount of time.
                    await new Promise(resolve => setTimeout(resolve, waitAndRetry));   

                response = await axios(request.options);

                // We collect the wait time, but we only use it if we receive 
                // a recoverable error or if the response is paged.
                waitTime = getAPIResetDelay(response.headers);

                if (response.status >= 400) {
                    let now      = (new Date()).getTime();
                    let timeout  = request.options.timeout;
                    let timeLeft = (request.createTime + timeout) > (now + waitTime);
            
                    if (response.status === 429 || response.status === 503) {   
                        // Too Many Requests or Service Unavailable. In both cases
                        // the 'Retry-After' header may be present. We will retry 
                        // after the retry time or a default delay has elapsed.
                        if (!timeLeft)
                            throw new Error({
                                status:   response.status,
                                message:  response.statusText + " - timeout of " + timeout + "ms exceeded"
                            });

                        waitAndRetry = waitTime;
                    } 
                    else if (response.data.error) {
                        // There is additional error info in data that we should use.
                        // Assumption is that it does not make sense to retry.
                        throw new Error({
                            status:   response.status,
                            message:  response.data.error
                        });
                    }                    
                    else {
                        // Internal Server Error. Use default delay and retry as
                        // many times as we're allowed for this request.
                        if (!timeLeft || request.attempts-- < 0)
                            throw new Error({
                                status:   response.status,
                                message:  response.statusText + " - timeout of " + timeout + "ms or retry max of " + request.retryLimit + " exceeded"
                            });
                        
                        waitAndRetry = waitTime;
                    }
                }
                else {
                    // Good, useable JSON response received.
                    waitAndRetry = null;

                    // Depending on the API, a paged set of results may be an
                    // array, or may be an array at a property.
                    list = prop ? response.data[prop] : response.data;
                    data = data !== null 
                         ? data.concat(list)
                         : list;  
                        
                    nextPageKey = request.stream 
                                ? null     // If we stream, we don't handle paging.
                                : response.headers["next-page-key"] || // v1
                                  response.data.nextPageKey;           // v2      

                    if (nextPageKey) {
                        // There's slight difference between v1 and v2 APIs here.
                        if (request.options.url.includes('/v1'))
                            request.options.params.nextPageKey = encodeURIComponent(nextPageKey);
                        else 
                            request.options.params = { nextPageKey: encodeURIComponent(nextPageKey) };

                        // Wait a sec and then get the next set (page) of data.
                        waitAndRetry = waitTime;
                    }
                }
            } while (waitAndRetry);

            // If we had take the data from a property so that we could
            // keep appending paged data, then put that property back again.
            if (prop) {
                list = data;
                data = {};
                data[prop] = list;
            }

            // Release this request from the queue with the data.            
            // This will trigger the callback to the original requester.
            issuedList.release(request, null, data);

            // Let requestor know about progress.
            request.emitter.emit("progress", "end");      
        }
        catch (error) {
            // Release this request from the queue with an error.
   
            if (error.response) {
                // The error was returned by the server.
                issuedList.release(request, {
                    status:   error.response.status,
                    message:  error.response.statusText
                });     
            }
            else if (error.request) {
                // The request was made but no response was received.
                // This generally means an unrecoverable error.
                issuedList.release(request, {
                    status:  1, // Not Issued (2 is 'Cancelled').
                    message: error.message || error.code
                });
            }
            else {
                // The request was not made because an error occurred.
                // This is where the thrown errors above end up.
                issuedList.release(request, {
                    status:  error.status || 1,
                    message: error.message || error || "Unknown error"
                });
            }

            // Let requestor know about this sad ending.
            request.emitter.emit("error", error.message);            
        }
        finally {
            // Ensure that we keep emptying the global queue.
            setTimeout(acceptNext, bucket.dripRate);
        }
    }

    const publicIF = {
        get name() {
            return hostName;
        },
        get localQueue() {
            return localQueue;
        },
        get issuedList() {
            return issuedList;
        },        
        isAlive: function(tenant) {
            return axios.get(
                (tenant.protocol || "https") + "://" + hostName 
              + (tenant.port ? ":" + tenant.port : "") 
              + (tenant.url || "") + "/api/v1/time",
                { responseType: 'blob' }    // It's an epoch time, a string we'll be getting back.
            );
        },
        accept: function (request, forced) {
            // Schedule a recursive call to keep consuming from the queues.
            if (localQueue.length > 0 || globalQueue.length > 0)
                setTimeout(acceptNext, bucket.dripRate);

            // If we're full and not forced to accept, politely decline.
            if (localQueue.isFull && !forced)
                return false;

            // Add the request (if any) to the end of the queue.
            if (request) {
                localQueue.place(request);
                request = null;    // We'll be taking the oldest first.
            }

            // Make sure were all caught up with the dripping...
            refill();

            // If the bucket is empty, or if there are too many requests still running,
            // we schedule a recursive call to consume from the local and global queues.
            if (bucket.content <= 0 || issuedList.isFull) {
                setTimeout(acceptNext, bucket.dripRate);
                return true;   // We queued the request.
            }

            // Take the first request waiting in line, if any, but if the global queue has an
            // older one for us, take that one. The first request in our queue is our oldest.
            const oldestTime = localQueue.length > 0 ? localQueue.peek().queueTime : null;

            request = globalQueue.takeNext(self, oldestTime) || localQueue.takeNext();
            if (!request)
                return false;   // No more requests waiting that we should or could handle.

            // We accept this request and we'll issue it right now. Consume a drip and go.
            bucket.content--;
            issuedList.place(request);

            request.setHost(hostName);
            request.attempts = request.retryLimit;

            setImmediate(issueRequest, request);

            return true;    // Accepted, issued - and on its way!
        },
        get availability() {
            // Return a measure of our availability as a number ranging
            // from minus infinity to the (positive) size of our bucket.

            // If our waiting list is full, we are infinitely unavailable.
            if (localQueue.isFull)
                return  Number.NEGATIVE_INFINITY;

            // We do have space, but our unavailability is proportional  
            // to the length of our waiting list.
            if (localQueue.length > 0)
                return -1 * localQueue.length;

            refill();  // Update the bucket.

            // Our availability is proportional to the fullness of the bucket.
            // If we have outstanding requests, with a limit to them, then 
            // that proportionally reduces our bucket fullness.
            return issuedList.length > 0
                 ? bucket.content * (requestLimit - issuedList.length) / requestLimit
                 : bucket.content;
        },
        reset: reset
    };

    // Easy for everybody to call to keep on consuming queued requests.
    const acceptNext = publicIF.accept.bind(publicIF);

    return publicIF;
};

module.exports = Host;