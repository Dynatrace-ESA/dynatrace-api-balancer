[@dt-esa/dynatrace-api-balancer](../README.md) / [Exports](../modules.md) / GlobalRequestQueue

# Class: GlobalRequestQueue

## Hierarchy

- [`RequestQueue`](RequestQueue.md)

  ↳ **`GlobalRequestQueue`**

## Table of contents

### Constructors

- [constructor](GlobalRequestQueue.md#constructor)

### Properties

- [tenants](GlobalRequestQueue.md#tenants)

### Accessors

- [isFull](GlobalRequestQueue.md#isfull)
- [length](GlobalRequestQueue.md#length)

### Methods

- [clear](GlobalRequestQueue.md#clear)
- [extendBy](GlobalRequestQueue.md#extendby)
- [peek](GlobalRequestQueue.md#peek)
- [place](GlobalRequestQueue.md#place)
- [release](GlobalRequestQueue.md#release)
- [take](GlobalRequestQueue.md#take)
- [takeNext](GlobalRequestQueue.md#takenext)

## Constructors

### constructor

• **new GlobalRequestQueue**(`global`, `maxQueueSize`, `maxQueueTime`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `global` | `any` |
| `maxQueueSize` | `any` |
| `maxQueueTime` | `any` |

#### Overrides

[RequestQueue](RequestQueue.md).[constructor](RequestQueue.md#constructor)

#### Defined in

[src/request-queue.ts:127](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/request-queue.ts#L127)

## Properties

### tenants

• `Private` **tenants**: `any` = `null`

#### Defined in

[src/request-queue.ts:125](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/request-queue.ts#L125)

## Accessors

### isFull

• `get` **isFull**(): `boolean`

Returns true if the queue is full.

#### Returns

`boolean`

#### Inherited from

RequestQueue.isFull

#### Defined in

[src/request-queue.ts:109](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/request-queue.ts#L109)

___

### length

• `get` **length**(): `number`

Returns current queue length.

#### Returns

`number`

#### Inherited from

RequestQueue.length

#### Defined in

[src/request-queue.ts:114](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/request-queue.ts#L114)

## Methods

### clear

▸ **clear**(`i?`): `void`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `i?` | `number` | Index of request to clear. If not provided, the whole queue will be cleared. |

#### Returns

`void`

#### Inherited from

[RequestQueue](RequestQueue.md).[clear](RequestQueue.md#clear)

#### Defined in

[src/request-queue.ts:77](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/request-queue.ts#L77)

___

### extendBy

▸ **extendBy**(`value`): `number`

Increases the maximum queue size by the indicated amount.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `any` | The amount bby which the maximum queue size should grow. |

#### Returns

`number`

Returns the maximum queue length.

#### Inherited from

[RequestQueue](RequestQueue.md).[extendBy](RequestQueue.md#extendby)

#### Defined in

[src/request-queue.ts:121](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/request-queue.ts#L121)

___

### peek

▸ **peek**(`i?`): [`Request`](Request.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `i?` | `number` | Index of request to return. |

#### Returns

[`Request`](Request.md)

Request at index `i` or index 0.

#### Inherited from

[RequestQueue](RequestQueue.md).[peek](RequestQueue.md#peek)

#### Defined in

[src/request-queue.ts:104](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/request-queue.ts#L104)

___

### place

▸ **place**(`request`): `void`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `request` | [`Request`](Request.md) | Request to place on queue. |

#### Returns

`void`

#### Inherited from

[RequestQueue](RequestQueue.md).[place](RequestQueue.md#place)

#### Defined in

[src/request-queue.ts:27](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/request-queue.ts#L27)

___

### release

▸ **release**(`request`, `error?`, `data?`): `void`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `request` | [`Request`](Request.md) | Request to release. |
| `error?` | `any` | Error object |
| `data?` | `any` | Data object |

#### Returns

`void`

#### Inherited from

[RequestQueue](RequestQueue.md).[release](RequestQueue.md#release)

#### Defined in

[src/request-queue.ts:62](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/request-queue.ts#L62)

___

### take

▸ **take**(`i`): [`Request`](Request.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `i` | `number` | Index of request to remove from queue. |

#### Returns

[`Request`](Request.md)

Request removed from queue.

#### Inherited from

[RequestQueue](RequestQueue.md).[take](RequestQueue.md#take)

#### Defined in

[src/request-queue.ts:42](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/request-queue.ts#L42)

___

### takeNext

▸ **takeNext**(`host`, `olderThan?`): [`Request`](Request.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `host` | [`Host`](Host.md) |
| `olderThan?` | `number` |

#### Returns

[`Request`](Request.md)

The first request on the queue.

#### Overrides

[RequestQueue](RequestQueue.md).[takeNext](RequestQueue.md#takenext)

#### Defined in

[src/request-queue.ts:133](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/request-queue.ts#L133)
