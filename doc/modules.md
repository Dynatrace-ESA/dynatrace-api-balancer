[@dt-esa/dynatrace-api-balancer](README.md) / Exports

# @dt-esa/dynatrace-api-balancer

## Table of contents

### Classes

- [BalancedAPIRequest](classes/BalancedAPIRequest.md)
- [CancellableEventEmitter](classes/CancellableEventEmitter.md)
- [CancellablePromise](classes/CancellablePromise.md)
- [DirectAPIRequest](classes/DirectAPIRequest.md)
- [GlobalRequestQueue](classes/GlobalRequestQueue.md)
- [Host](classes/Host.md)
- [NoThrottle](classes/NoThrottle.md)
- [Request](classes/Request.md)
- [RequestQueue](classes/RequestQueue.md)
- [Ring](classes/Ring.md)
- [Throttle](classes/Throttle.md)

### Type aliases

- [Limits](modules.md#limits)
- [RequestCallback](modules.md#requestcallback)
- [RequestError](modules.md#requesterror)
- [RequestOptions](modules.md#requestoptions)
- [Tenant](modules.md#tenant)
- [TenantConfig](modules.md#tenantconfig)
- [Tenants](modules.md#tenants)

## Type aliases

### Limits

Ƭ **Limits**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `maxQueueSize?` | ``500`` \| `number` |
| `maxQueueTime?` | ``10000`` \| `number` |
| `maxRetries?` | ``3`` \| `number` |
| `reqRateLimit?` | ``200`` \| `number` |
| `requestLimit?` | ``20`` \| `number` |
| `retryAfter?` | ``1000`` \| `number` |
| `timeout?` | ``50000`` \| `number` |

#### Defined in

[src/types.ts:128](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/types.ts#L128)

___

### RequestCallback

Ƭ **RequestCallback**: (`error`: [`RequestError`](modules.md#requesterror), `data?`: `any`) => `unknown`

#### Type declaration

▸ (`error`, `data?`): `unknown`

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `error` | [`RequestError`](modules.md#requesterror) | The error if the request could not be fulfilled. |
| `data?` | `any` | The Dynatrace API's response, as a parsed JSON object, if the request was succesful. |

##### Returns

`unknown`

#### Defined in

[src/types.ts:126](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/types.ts#L126)

___

### RequestError

Ƭ **RequestError**: `Object`

**`description`**
A unified error object that consolidates the various types of errors that may happen
while initializating a request, issuing it, and processing its response.

**`param`** An internal error code (string) or an HTTP status code (number).

**`param`** Human-readble description of the error.

**`param`** Original (relative) URL.

**`param`** Effective base URL.

**`param`** Request method used.

**`param`** Query parameters passed.

**`param`** Data sent in the request body.

#### Defined in

[src/types.ts:119](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/types.ts#L119)

___

### RequestOptions

Ƭ **RequestOptions**: `AxiosRequestConfig` & { `createTime?`: `number` ; `maxRetries?`: ``3`` \| `number` ; `noQueue?`: `boolean` ; `paging?`: `boolean` ; `tenant?`: `string` \| [`Tenant`](modules.md#tenant)  }

**`description`**
The `options` object support all options supported by [Axios](https://axios-http.com/docs/req_config "Axios"),
except where otherwise noted below. This implementation also adds a couple of additional options (i.e. `tenant`,
`noQueue` and `maxRetries`) that are specific to this implementation.
Note that either a `tenant` or a `baseURL` must be provided, but not both.

**`param`** URL relative to the `baseURL` or the `tenant`. Ex.: `'/api/v2/entities'`.

**`param`** Request method (`'get'`,  `'put'`,  `'post'`,  `'delete'`).

**`param`** Specifies if nextPageKey will be automatically detected and paged. Defaults to true.

**`param`** Proxy to use to make HTTP/S connections.

**`param`** Specifies the number of attempts to make if there is a failure. Defaults to 3.

**`param`** Name of the Dynatrace tenant ([BalancedAPIRequest](classes/BalancedAPIRequest.md) only - **not an Axios property**). Ex.: `'PROD'`.

**`param`** URL of the Dynatrace tenant ([DirectAPIRequest](classes/DirectAPIRequest.md) only). Ex.: `'https://abc12345.live.dynatrace.com'`.

**`param`** Plain `object` containing the headers to be set in the request. Ex.: `{ 'Authorization': 'token XYZ' }`.

**`param`** URL parameters to be sent with the request. Must be a plain `object` or a `URLSearchParams` object. Ex.: `{ ID: 12345 }`.

**`param`** Must be of one of the following types: `string`, `object`, `ArrayBuffer`, `ArrayBufferView`, `URLSearchParams`, `Stream`, `Buffer`. Ex.: `{ firstName: 'Bart' }`.

**`param`** Specifies whether the request should be rejected if due to throttling it cannot immediately be issued  ([BalancedAPIRequest](classes/BalancedAPIRequest.md) only - **not an Axios property**).

**`param`** Number of milliseconds before the request times out. If the request takes longer than `timeout`, it will be aborted (if it has been issued already) or cancelled (if it is still waiting in a queue).

**`param`** Number of milliseconds to wait before trying again after a 429 or 503 status is received and the response does not contain a 'Retry-After' header. If not provided, the default from the constructor is used.

**`param`** Maximum number of redirects to follow. If set to 0, no redirects will be followed.

**`param`** Maximum size of the http request content in bytes.

**`param`** Maximum size of the http response content in bytes.

**`param`** **IGNORED** This parameter is set by [BalancedAPIRequest](classes/BalancedAPIRequest.md) and [DirectAPIRequest](classes/DirectAPIRequest.md) internally.

**`param`** Specifies the type of data that the server will respond with. Options are: `'arraybuffer'`, `'document'`, `'json'`, `'text'`, `'stream'`. **Note**: The automatic paging support only works then this value is set to `'json'`.

**`param`** Specifies whether or not cross-site Access-Control requests should be made using credentials.

**`param`** Encoding to use for decoding responses. Note: Ignored when `responseType` is `'stream'`.

**`param`** Specifies a cancel token that can be used to cancel the request. See Axios documentation for details. Note that [BalancedAPIRequest](classes/BalancedAPIRequest.md) sets this property to create and return a [CancellablePromise](classes/CancellablePromise.md) or a [CancellableEventEmitter](classes/CancellableEventEmitter.md) through which requests can be cancelled.

**`param`** See Axios documentation.

**`param`** See Axios documentation.

**`param`** See Axios documentation.

**`param`** Specifies whether or not the response body should be decompressed automatically. If set to `true` will also remove the `'content-encoding'` header from the response objects of all decompressed responses. **Note**: The automatic paging support only works then this value is set to `true`.

#### Defined in

[src/types.ts:97](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/types.ts#L97)

___

### Tenant

Ƭ **Tenant**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `host?` | `string` |
| `hosts?` | `string`[] |
| `name` | `string` |
| `port?` | `number` |
| `protocol?` | ``"https"`` \| ``"http"`` |
| `reqRateLimit?` | ``200`` \| `number` |
| `requestLimit?` | ``10`` \| `number` |
| `token` | `string` |
| `url` | `string` |

#### Defined in

[src/types.ts:48](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/types.ts#L48)

___

### TenantConfig

Ƭ **TenantConfig**: `Object`

**`description`**
Represents the configuration for a tenant.

**`param`** Name of tenant as used in the `tenant` property of [RequestOptions](modules.md#requestoptions).

**`param`** The address of the tenant. Either this or the `hosts` property must be present.

**`param`** A list of addresses of nodes at which the tenant can be reached. This is
                   typically a subset of cluster nodes (for Managed Clusters).

**`param`** If the nodes(s) are of a Managed Cluster, this is the environment URL.
                   Ex.: /e/123-456-345

**`param`** The Dynatrace API token to be used to execute the requests. The permissions
                   this token should represent depends on the APIs that are permitted to be used.

**`param`** Maximum number of retries before reporting an error. Note that
                        retry attempts will stop once the 'timeout' value gets exceeded. Defaults to 3.

**`param`** Maximum number of API requests per minute allowed against this tenant.

**`param`** Maximum length of the queue. The actual size is typically kept in
                                check by virtue of the request rate limit.

**`param`** Maximum number of milliseconds a request may be queued. A request will
                                be cancelled with 408 status if it stays queued for too long.

**`param`** Maximum allowed number of concurrently active (i.e. issued) requests.

**`param`** Number of milliseconds before a request times out once issued. If a
                                request takes longer than this value, it will be aborted.

**`param`** Number of milliseconds to wait before retrying after a 429 or 503
                                status where the response does not contain a 'Retry-After' header.

#### Type declaration

| Name | Type |
| :------ | :------ |
| `hosts` | [`Host`](classes/Host.md)[] \| `string`[] |
| `maxQueueSize?` | ``1000`` \| `number` |
| `maxQueueTime?` | ``5000`` \| `number` |
| `maxRetries?` | ``3`` \| `number` |
| `name` | `string` |
| `port?` | `number` |
| `protocol?` | ``"https"`` \| ``"http"`` |
| `reqRateLimit?` | ``200`` \| `number` |
| `requestLimit?` | ``20`` \| `number` |
| `retryAfter?` | ``5000`` \| `number` |
| `throttle?` | [`Throttle`](classes/Throttle.md) |
| `timeout?` | ``5000`` \| `number` |
| `token` | `string` |
| `url` | `string` |

#### Defined in

[src/types.ts:31](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/types.ts#L31)

___

### Tenants

Ƭ **Tenants**: `Object`

#### Index signature

▪ [key: `string`]: [`Tenant`](modules.md#tenant)

#### Defined in

[src/types.ts:60](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/types.ts#L60)
