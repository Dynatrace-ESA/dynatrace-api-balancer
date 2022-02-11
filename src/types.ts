import { AxiosRequestConfig } from "axios";
import { Throttle } from "./throttle";

/**
 * 
 * @description
 * Represents the configuration for a tenant.
 * 
 * @param name   - Name of tenant as used in the `tenant` property of {@link RequestOptions}. 
 * @param host   - The address of the tenant. Either this or the `hosts` property must be present. 
 * @param hosts  - A list of addresses of nodes at which the tenant can be reached. This is
 *                    typically a subset of cluster nodes (for Managed Clusters). 
 * @param url    - If the nodes(s) are of a Managed Cluster, this is the environment URL. 
 *                    Ex.: /e/123-456-345 
 * @param token  - The Dynatrace API token to be used to execute the requests. The permissions 
 *                    this token should represent depends on the APIs that are permitted to be used. 
 * @param maxRetries   - Maximum number of retries before reporting an error. Note that  
 *                         retry attempts will stop once the 'timeout' value gets exceeded. Defaults to 3. 
 * @param reqRateLimit - Maximum number of API requests per minute allowed against this tenant.
 * @param maxQueueSize - Maximum length of the queue. The actual size is typically kept in
 *                                 check by virtue of the request rate limit.
 * @param maxQueueTime - Maximum number of milliseconds a request may be queued. A request will
 *                                 be cancelled with 408 status if it stays queued for too long.
 * @param requestLimit - Maximum allowed number of concurrently active (i.e. issued) requests.
 * @param timeout 	  - Number of milliseconds before a request times out once issued. If a 
 *                                 request takes longer than this value, it will be aborted.
 * @param retryAfter   - Number of milliseconds to wait before retrying after a 429 or 503 
 *                                 status where the response does not contain a 'Retry-After' header. 
 */
export type Tenant = {
    name: string,
    token: string,
    port: number,
    url: string,
    protocol: "https" | "http",
    throttle: Throttle,
    maxRetries?:   3    | number,
    reqRateLimit?: 200  | number,
    maxQueueSize?: 1000 | number,
    maxQueueTime?: 5000 | number,
    requestLimit?: 20   | number,
    timeout?:      5000 | number,
    retryAfter?:   5000 | number, 	
};

/**
 * 
 * @description
 * The `options` object support all options supported by [Axios](https://axios-http.com/docs/req_config "Axios"), 
 * except where otherwise noted below. This implementation also adds a couple of additional options (i.e. `tenant`, 
 * `noQueue` and `maxRetries`) that are specific to this implementation.
 * Note that either a `tenant` or a `baseURL` must be provided, but not both.
 * 
 * @param url          	    - URL relative to the `baseURL` or the `tenant`. Ex.: `'/api/v2/entities'`. 
 * @param method     	    - Request method (`'get'`,  `'put'`,  `'post'`,  `'delete'`). 
 * @param paging            - Specifies if nextPageKey will be automatically detected and paged. Defaults to true.
 * @param proxy 	        - Proxy to use to make HTTP/S connections.
 * @param maxRetries        - Specifies the number of attempts to make if there is a failure. Defaults to 3.
 * @param tenant       	    - Name of the Dynatrace tenant ({@link BalancedAPIRequest} only - **not an Axios property**). Ex.: `'PROD'`. 
 * @param baseURL      	    - URL of the Dynatrace tenant ({@link DirectAPIRequest} only). Ex.: `'https://abc12345.live.dynatrace.com'`. 
 * @param headers      	    - Plain `object` containing the headers to be set in the request. Ex.: `{ 'Authorization': 'token XYZ' }`. 
 * @param params       	    - URL parameters to be sent with the request. Must be a plain `object` or a `URLSearchParams` object. Ex.: `{ ID: 12345 }`. 
 * @param data        	    - Must be of one of the following types: `string`, `object`, `ArrayBuffer`, `ArrayBufferView`, `URLSearchParams`, `Stream`, `Buffer`. Ex.: `{ firstName: 'Bart' }`. 
 * @param noQueue	        - Specifies whether the request should be rejected if due to throttling it cannot immediately be issued  ({@link BalancedAPIRequest} only - **not an Axios property**).
 * @param timeout           - Number of milliseconds before the request times out. If the request takes longer than `timeout`, it will be aborted (if it has been issued already) or cancelled (if it is still waiting in a queue).
 * @param retryAfter        - Number of milliseconds to wait before trying again after a 429 or 503 status is received and the response does not contain a 'Retry-After' header. If not provided, the default from the constructor is used.
 * @param maxRedirects 	    - Maximum number of redirects to follow. If set to 0, no redirects will be followed.
 * @param maxBodyLength	    - Maximum size of the http request content in bytes.
 * @param maxContentLength  - Maximum size of the http response content in bytes.
 * @param validateStatus   	- **IGNORED** This parameter is set by {@link BalancedAPIRequest} and {@link DirectAPIRequest} internally.
 * @param responseType 		- Specifies the type of data that the server will respond with. Options are: `'arraybuffer'`, `'document'`, `'json'`, `'text'`, `'stream'`. **Note**: The automatic paging support only works then this value is set to `'json'`.
 * @param withCredentials	- Specifies whether or not cross-site Access-Control requests should be made using credentials.
 * @param responseEncoding 	- Encoding to use for decoding responses. Note: Ignored when `responseType` is `'stream'`.
 * @param cancelToken       - Specifies a cancel token that can be used to cancel the request. See Axios documentation for details. Note that {@link BalancedAPIRequest} sets this property to create and return a {@link CancellablePromise} or a {@link CancellableEventEmitter} through which requests can be cancelled.
 * @param socketPath        - See Axios documentation.
 * @param httpAgent         - See Axios documentation.
 * @param httpsAgent        - See Axios documentation.
 * @param decompress        - Specifies whether or not the response body should be decompressed automatically. If set to `true` will also remove the `'content-encoding'` header from the response objects of all decompressed responses. **Note**: The automatic paging support only works then this value is set to `true`.
 *  
 */
export type RequestOptions = AxiosRequestConfig & {
    tenant?: string | Tenant,
    createTime?: number,
    noQueue?: boolean,
    paging?: boolean,
    maxRetries?: 3 | number
}

/**
 * 
 * @description
 * A unified error object that consolidates the various types of errors that may happen 
 * while initializating a request, issuing it, and processing its response.
 *
 * @param status  - An internal error code (string) or an HTTP status code (number).
 * @param message - Human-readble description of the error.
 * @param url     - Original (relative) URL.
 * @param baseURL - Effective base URL.
 * @param method  - Request method used.
 * @param params  - Query parameters passed.
 * @param data    - Data sent in the request body.
 */
export type RequestError = {}

/**
 * @callback RequestCallback
 * @param error - The error if the request could not be fulfilled.
 * @param data - The Dynatrace API's response, as a parsed JSON object, if the request was succesful.
 */
export type RequestCallback = (error: RequestError, data?: any) => unknown

export type Limits = {
    reqRateLimit?: 200  | number, // Maximum request rate in requests per minute.
    maxQueueTime?: 10   | number, // Maximum time for a request to stay queued (sec).
    maxRetries?:   3    | number, // Maximum number of retries before reporting an error.
    maxQueueSize?: 500  | number, // Maximum length of the local queues (ie. highWaterMark).
    requestLimit?: 20   | number, // Upper limit to number of outstanding requests.
    retryAfter?:   1000 | number, // ms
    timeout?:      5000 | number  // ms    
}