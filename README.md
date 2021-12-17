# dynatrace-api-balancer
A wrapper around [Axios](https://axios-http.com/docs/req_config "Axios") that balances and throttles Dynatrace API requests across tenants, clusters and cluster nodes.

### Usage
```javascript
// Using BalancedAPIRequest:
const api = new BalancedAPIRequest(tenants, limits);

const cancellablePromise = api.fetch(options).then(data => { ... }).catch(err => { ... });
// OR 
const cancellableEventEmitter = api.fetch(options, (err, data) => { ... });

// Using DirectAPIRequest:
const api = new DirectAPIRequest(limits);

const promise = api.fetch(options).then(data => { ... }).catch(err => { ... });
// OR
const eventEmitter = api.fetch(options, (err, data) => { ... });
```

### Options

| Parameter    | Default/Example | Explanation     |
|--------------|---------|-----------------|
| url          | `'/api/v2/entities'` | URL relative to the `baseURL` or the `tenant`.  |
| method       | `'get'`   | Must be one of the following: `'get'`,  `'put'`,  `'post'`,  `'delete'`.  |
| tenant       | `'PROD'` | Name of the Dynatrace tenant (**BalancedAPIRequest** only) |
| baseURL      | `'https://abc12345.live.dynatrace.com'`  | URL of the Dynatrace tenant (**DirectAPIRequest** only). |
| headers      | `{ 'Authorization': 'token XYZ' }` | Plain `object` containing the headers to be set in the request. |
| params       | `{ ID: 12345 }`         | URL parameters to be sent with the request. Must be a plain `object` or a `URLSearchParams` object.
| data         | `{ firstName: 'Bart' }` | Must be of one of the following types: `string`, `object`, `ArrayBuffer`, `ArrayBufferView`, `URLSearchParams`, `Stream`, `Buffer`. |
| noQueue      | `false` | Specifies whether the request should be rejected if due to throttling it cannot immediately be issued  (**BalancedAPIRequest** only).
| timeout      | `5000`  | Number of milliseconds before the request times out. If the request takes longer than `timeout`, it will be aborted (if it has been issued already) or cancelled (if it is still waiting in a queue).
| maxRedirects | `5`     | Maximum number of redirects to follow. If set to 0, no redirects will be followed.
| maxRetries   | `3`     | Maximum number of retries allowed if a potentially transient error is encountered (**BalancedAPIRequest** and **DirectAPIRequest** only).
| maxBodyLength    | 2000 | Maximum size of the http request content in bytes.
| maxContentLength | 2000 | Maximum size of the http response content in bytes.
| validateStatus   | *IGNORED* | This parameter is set by **BalancedAPIRequest** and **DirectAPIRequest** internally.
| responseType     | `'json'` | Specifies the type of data that the server will respond with. Options are: `'arraybuffer'`, `'document'`, `'json'`, `'text'`, `'stream'`.
| withCredentials  | `false`  | Specifies whether or not cross-site Access-Control requests should be made using credentials.
| responseEncoding | `'utf8'` | Encoding to use for decoding responses. Note: Ignored when `responseType` is `'stream'`.
| cancelToken      | null | Specifies a cancel token that can be used to cancel the request. See Axios documentation for details. Note that **BalancedAPIRequest** sets this property to create and return a CancellablePromise or a CancellableEventEmitter through which requests can be cancelled.
| socketPath | null | See Axios documentation.
| proxy      | null | See Axios documentation.
| httpAgent  | null | See Axios documentation.
| httpsAgent | null | See Axios documentation.
| decompress | `true` | Specifies whether or not the response body should be decompressed automatically. If set to `true` will also remove the `'content-encoding'` header from the responses objects of all decompressed responses.
