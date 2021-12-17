'use strict';

const axios = require('axios').default;
const { RequestQueue } = require('./RequestQueue');
const Request = require('./Request.js');
const DirectAPIRequest = require('./DirectAPIRequest.js');

const Host = function (hostName, mainQueue, { requestLimit, queueLimit, maxQueueTime, reqRateLimit, retryLimit }) {
    const self = this;

    const directRequest = new DirectAPIRequest({ retryLimit });
    const issuedList    = new RequestQueue(requestLimit, maxQueueTime);
    const localQueue    = new RequestQueue(queueLimit, maxQueueTime);
    const globalQueue   = mainQueue;

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

    async function issue(request) {
		// Relevant for determining how much time we have for retries.
        request.options.createTime = request.createTime;	
                
        // Let requestor know about progress.
        request.emitter.emit("progress", "start");        

        directRequest.fetch(request.options)
        .then(data => {
            // Release this request from the queue with the data.            
            // This will trigger the callback to the original requester.
            issuedList.release(request, null, data);

            // Let requestor know about progress.
            request.emitter.emit("progress", "end");   
        })
        .catch(error => {
            // Release this request from the queue with the error.    
            issuedList.release(request, error);

            // Let requestor know about this sad ending.                
            request.emitter.emit("error", error.message);  
        })
        .finally(() => {
            // Ensure that we keep emptying the global queue.
            setTimeout(acceptNext, bucket.dripRate);
        });
    }

	function accept(request, forced) {
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

		// Tell the request object we're handling it.
		request.setHost(hostName);

		setImmediate(issue, request);

		return true;    // Accepted, issued - and on its way!
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
        }
    };

    // Easy for everybody to call to keep on consuming queued requests.
    const acceptNext = publicIF.accept.bind(publicIF);

    return publicIF;
};

module.exports = Host;