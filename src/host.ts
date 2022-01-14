import axios, { AxiosResponse } from "axios";
import { DirectAPIRequest } from "./direct-api-request";
import { Request } from './request';
import { RequestQueue } from "./request-queue";
import { Throttle } from "./throttle";
import { Limits, Tenant } from "./types";


export class Host {
    
    private globalQueue;
    private requester;
    private throttle;
    private requestLimit;

    // TODO: Validate this works correctly.
    public readonly localQueue: RequestQueue;
    public readonly issuedList: RequestQueue;

    constructor(private hostName, private mainQueue, { requestLimit, maxQueueSize, maxQueueTime, reqRateLimit, maxRetries }: Limits) {
        this.globalQueue = mainQueue;
        this.requester = new DirectAPIRequest({ maxRetries });
        this.issuedList = new RequestQueue(requestLimit, maxQueueTime);
        this.localQueue = new RequestQueue(maxQueueSize, maxQueueTime);
        this.throttle = new Throttle(reqRateLimit, 60 * 1000);

        this.requestLimit = requestLimit;
    }

    /**
     * Empty the queue; clear the throttler; empty the lists.
     */
    public reset(): void {
        this.localQueue.clear();
        this.issuedList.clear();
        this.throttle.reset();

        // Ensure that we keep emptying the global queue.
        setTimeout(this.acceptNext, this.throttle.nextSlot);
    }

    /**
     * 
     * @param request 
     */
    private async issue(request: Request): Promise<void> {
        // Relevant for determining how much time we have for retries.
        request.options.createTime = request.createTime;

        // Let the caller know about our progress.
        request.emitter.emit("progress", "start");

        // Wait for the tenant's throttle's permission. 
        await request.tenant.throttle.permit();

        this.requester.fetch(request.options)
            .then(data => {
                // Release this request from the queue (with the data).
                // The queue will trigger the callback to the caller.
                this.issuedList.release(request, null, data);

                // Let the caller know about our progress.
                request.emitter.emit("progress", "end");
            })
            .catch(error => {
                // Release this request from the queue (with the error).    
                this.issuedList.release(request, error);

                // Let the caller know about this unfortunate ending.                
                request.emitter.emit("error", error.message);
            })
            .finally(() => {
                // Ensure that we keep emptying the global queue.
                setImmediate(this.acceptNext);
            });
    }

    /**
     * Refills the bucket completely.
     * @param  request [description]
     * @param   forced If forced is `true`, disregard queue and make the request.
     * @return         `true` if the request was queued. Otherwise returns `false`.
     */
    public accept(request, forced = false) {
        // Schedule a recursive call to keep consuming from the queues.
        if (this.localQueue.length > 0 || this.globalQueue.length > 0)
            setTimeout(this.acceptNext, this.throttle.nextSlot);

        // If we're full and not forced to accept, politely decline.
        if (this.localQueue.isFull && !forced)
            return false;   // We declined the request.

        // Add the request (if any) to the end of the queue because 
        // we'll be issuing the longest-waiting request first.
        if (request) {
            this.localQueue.place(request);
        }

        // If the throttle is choking, or if there are too many requests still running,
        // we schedule a call to keep consuming from the local and global queues.
        if (this.throttle.waitTime > 0 || this.issuedList.isFull) {
            setTimeout(this.acceptNext, this.throttle.nextSlot);
            return true;    // We queued the request.
        }

        // Take the first request waiting in line, if any, but if the global queue has an
        // older one for us, take that one. The first request in our queue is our oldest.
        const oldestTime = this.localQueue.length > 0 ? this.localQueue.peek().queueTime : null;

        request = this.globalQueue.takeNext(this, oldestTime) || this.localQueue.takeNext();
        if (!request)
            return false;   // No more requests waiting that we should or could handle.

        // Tell the request we're handling it, and the throttle we're consuming one.
        this.throttle.consume();
        this.issuedList.place(request);
        request.setHost(this.hostName);

        setImmediate(this.issue, request);
        return true;        // We issued the request.
    }

    // Easy for everybody to call to keep on consuming queued requests.
    acceptNext = this.accept.bind(this);

    /**
     * return hostname.
     */
    public get name(): string {
        return this.hostName;
    }


    /**
     * Check if the specified tenant is reachable.
     * @param tenant Tenant
     * @returns true if it can be reached.
     */
    public isAlive (tenant: Tenant): Promise<AxiosResponse<any, any>> {
        return axios.get(
            (tenant.protocol || "https") + "://" + this.hostName
            + (tenant.port ? ":" + tenant.port : "")
            + (tenant.url || "") + "/api/v1/time",
            { responseType: 'blob' }    // It's an epoch time, a string we'll be getting back.
        );
    }

    /**
     * Return a measure of our availability as a number ranging
     * from minus infinity to the (positive) size of our throttle.
     */
    public get availability(): number {
        // If our waiting list is full, we are infinitely unavailable.
        if (this.localQueue.isFull)
            return Number.NEGATIVE_INFINITY;

        // We do have space, but our unavailability is proportional  
        // to the length of our waiting list.
        if (this.localQueue.length > 0)
            return -1 * this.localQueue.length;

        // Our availability is proportional to what's left in the 
        // throttle. If we have outstanding requests, with a limit  
        // to them, then that proportionally reduces our availability.
        return this.issuedList.length > 0
            ? this.throttle.remainder * (this.requestLimit - this.issuedList.length) / this.requestLimit
            : this.throttle.remainder;
    }
};
