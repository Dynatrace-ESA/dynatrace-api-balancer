'use strict';

const axios = require('axios').default;
const { RequestQueue } = require('./RequestQueue.js');
const Request = require('./Request.js');
const Throttle = require('./Throttle.js');
const DirectAPIRequest = require('./DirectAPIRequest.js');

const Host = function (hostName, mainQueue, { requestLimit, maxQueueSize, maxQueueTime, reqRateLimit, maxRetries }) {
    const self = this;

    const globalQueue = mainQueue;
    const requester   = new DirectAPIRequest({ maxRetries });
    const issuedList  = new RequestQueue(requestLimit, maxQueueTime);
    const localQueue  = new RequestQueue(maxQueueSize, maxQueueTime);
    const throttle    = new Throttle(reqRateLimit, 60 * 1000);

    /**
     * Empty the queue; clear the throttler; empty the lists.
     */
    function reset() {
        localQueue.clear();
        issuedList.clear();
        throttle.reset();

        // Ensure that we keep emptying the global queue.
        setTimeout(acceptNext, throttle.nextSlot);
    }

    async function issue(request) {
		// Relevant for determining how much time we have for retries.
        request.options.createTime = request.createTime;	
                
        // Let the caller know about our progress.
        request.emitter.emit("progress", "start");        

        // Wait for the tenant's throttle's permission. 
        await request.tenant.throttle.permit();

        requester.fetch(request.options)
        .then(data => {
            // Release this request from the queue (with the data).
            // The queue will trigger the callback to the caller.
            issuedList.release(request, null, data);

            // Let the caller know about our progress.
            request.emitter.emit("progress", "end");   
        })
        .catch(error => {
            // Release this request from the queue (with the error).    
            issuedList.release(request, error);

            // Let the caller know about this unfortunate ending.                
            request.emitter.emit("error", error.message);  
        })
        .finally(() => {
            // Ensure that we keep emptying the global queue.
            setImmediate(acceptNext);
        });
    }

    /**
     * Refills the bucket completely.
     * @param  {Object} request [description]
     * @param  {boolean} forced If forced is `true`, disregard queue and make the request.
     * @return {boolean}        returns `true` if the request was queued. Otherwise returns `false`.
     */      
	function accept(request, forced = false) {
		// Schedule a recursive call to keep consuming from the queues.
		if (localQueue.length > 0 || globalQueue.length > 0)
			setTimeout(acceptNext, throttle.nextSlot);

		// If we're full and not forced to accept, politely decline.
		if (localQueue.isFull && !forced)
			return false;   // We declined the request.

		// Add the request (if any) to the end of the queue because 
        // we'll be issuing the longest-waiting request first.
		if (request) {
			localQueue.place(request);   
		}

		// If the throttle is choking, or if there are too many requests still running,
		// we schedule a call to keep consuming from the local and global queues.
		if (throttle.waitTime > 0 || issuedList.isFull) {
			setTimeout(acceptNext, throttle.nextSlot);
			return true;    // We queued the request.
		}

		// Take the first request waiting in line, if any, but if the global queue has an
		// older one for us, take that one. The first request in our queue is our oldest.
		const oldestTime = localQueue.length > 0 ? localQueue.peek().queueTime : null;

		request = globalQueue.takeNext(self, oldestTime) || localQueue.takeNext();
		if (!request)
			return false;   // No more requests waiting that we should or could handle.

		// Tell the request we're handling it, and the throttle we're consuming one.
		throttle.consume();
		issuedList.place(request);
		request.setHost(hostName);

		setImmediate(issue, request); 
		return true;        // We issued the request.
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
        reset: reset,
        accept: accept,
        get availability() {
            // Return a measure of our availability as a number ranging
            // from minus infinity to the (positive) size of our throttle.

            // If our waiting list is full, we are infinitely unavailable.
            if (localQueue.isFull)
                return  Number.NEGATIVE_INFINITY;

            // We do have space, but our unavailability is proportional  
            // to the length of our waiting list.
            if (localQueue.length > 0)
                return -1 * localQueue.length;

            // Our availability is proportional to what's left in the 
            // throttle. If we have outstanding requests, with a limit  
            // to them, then that proportionally reduces our availability.
            return issuedList.length > 0
                 ? throttle.remainder * (requestLimit - issuedList.length) / requestLimit
                 : throttle.remainder;
        }
    };

    // Easy for everybody to call to keep on consuming queued requests.
    const acceptNext = publicIF.accept.bind(publicIF);

    return publicIF;
};

module.exports = Host;