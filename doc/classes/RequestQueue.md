[@dt-esa/dynatrace-api-balancer](../README.md) / [Exports](../modules.md) / RequestQueue

# Class: RequestQueue

## Hierarchy

- **`RequestQueue`**

  ↳ [`GlobalRequestQueue`](GlobalRequestQueue.md)

## Table of contents

### Constructors

- [constructor](RequestQueue.md#constructor)

### Properties

- [queue](RequestQueue.md#queue)

### Accessors

- [isFull](RequestQueue.md#isfull)
- [length](RequestQueue.md#length)

### Methods

- [clear](RequestQueue.md#clear)
- [extendBy](RequestQueue.md#extendby)
- [peek](RequestQueue.md#peek)
- [place](RequestQueue.md#place)
- [release](RequestQueue.md#release)
- [take](RequestQueue.md#take)
- [takeNext](RequestQueue.md#takenext)

## Constructors

### constructor

• **new RequestQueue**(`maxQueueSize?`, `maxQueueTime?`)

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `maxQueueSize` | `number` | `Number.POSITIVE_INFINITY` | Maximum size of the queue (items) |
| `maxQueueTime` | `number` | `undefined` | Maximum time to spend in the queue (ms) |

#### Defined in

[src/request-queue.ts:12](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/request-queue.ts#L12)

## Properties

### queue

• `Private` **queue**: [`Request`](Request.md)[] & { `remove`: (`Request`: `any`) => [`Request`](Request.md)  } = `[]`

#### Defined in

[src/request-queue.ts:6](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/request-queue.ts#L6)

## Accessors

### isFull

• `get` **isFull**(): `boolean`

Returns true if the queue is full.

#### Returns

`boolean`

#### Defined in

[src/request-queue.ts:109](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/request-queue.ts#L109)

___

### length

• `get` **length**(): `number`

Returns current queue length.

#### Returns

`number`

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

#### Defined in

[src/request-queue.ts:42](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/request-queue.ts#L42)

___

### takeNext

▸ **takeNext**(`host?`, `olderThan?`): [`Request`](Request.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `host?` | [`Host`](Host.md) |
| `olderThan?` | `number` |

#### Returns

[`Request`](Request.md)

The first request on the queue.

#### Defined in

[src/request-queue.ts:55](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/request-queue.ts#L55)
