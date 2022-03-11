[@dt-esa/dynatrace-api-balancer](../README.md) / [Exports](../modules.md) / CancellablePromise

# Class: CancellablePromise

A cancellable Promise tat which the request can be cancelled.

## Hierarchy

- `Promise`<`any`\>

  ↳ **`CancellablePromise`**

## Table of contents

### Constructors

- [constructor](CancellablePromise.md#constructor)

### Properties

- [[toStringTag]](CancellablePromise.md#[tostringtag])
- [[species]](CancellablePromise.md#[species])

### Methods

- [cancel](CancellablePromise.md#cancel)
- [catch](CancellablePromise.md#catch)
- [finally](CancellablePromise.md#finally)
- [onCancel](CancellablePromise.md#oncancel)
- [then](CancellablePromise.md#then)
- [all](CancellablePromise.md#all)
- [allSettled](CancellablePromise.md#allsettled)
- [any](CancellablePromise.md#any)
- [race](CancellablePromise.md#race)
- [reject](CancellablePromise.md#reject)
- [resolve](CancellablePromise.md#resolve)

## Constructors

### constructor

• **new CancellablePromise**(`executor`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `executor` | (`resolve`: `Function`, `reject`: `Function`, `cancel`: `Function`) => `void` |

#### Overrides

Promise&lt;any\&gt;.constructor

#### Defined in

[src/cancellables.ts:48](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/cancellables.ts#L48)

## Properties

### [toStringTag]

• `Readonly` **[toStringTag]**: `string`

#### Inherited from

Promise.\_\_@toStringTag@24

#### Defined in

node_modules/typescript/lib/lib.es2015.symbol.wellknown.d.ts:174

___

### [species]

▪ `Static` `Readonly` **[species]**: `PromiseConstructor`

#### Inherited from

Promise.\_\_@species@593

#### Defined in

node_modules/typescript/lib/lib.es2015.symbol.wellknown.d.ts:178

## Methods

### cancel

▸ **cancel**(`reason`): `void`

Cancel the request. If a reason is provided, it will cause the
[CancellablePromise](CancellablePromise.md) returned by the {@link BalancedAPIRequest#fetch fetch()}
method to be called with a [RequestError](../modules.md#requesterror) as it single argument,
containing status 512 and this reason as its message.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `reason` | `any` | The reason for the cancellation. If omitted, the request will be cancelled or aborted silently. |

#### Returns

`void`

#### Defined in

[src/cancellables.ts:65](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/cancellables.ts#L65)

___

### catch

▸ **catch**<`TResult`\>(`onrejected?`): `Promise`<`any`\>

Attaches a callback for only the rejection of the Promise.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `TResult` | `never` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `onrejected?` | (`reason`: `any`) => `TResult` \| `PromiseLike`<`TResult`\> | The callback to execute when the Promise is rejected. |

#### Returns

`Promise`<`any`\>

A Promise for the completion of the callback.

#### Inherited from

Promise.catch

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1509

___

### finally

▸ **finally**(`onfinally?`): `Promise`<`any`\>

Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
resolved value cannot be modified from the callback.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `onfinally?` | () => `void` | The callback to execute when the Promise is settled (fulfilled or rejected). |

#### Returns

`Promise`<`any`\>

A Promise for the completion of the callback.

#### Inherited from

Promise.finally

#### Defined in

node_modules/typescript/lib/lib.es2018.promise.d.ts:31

___

### onCancel

▸ `Private` **onCancel**(`reason?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `reason?` | `string` \| `number` |

#### Returns

`void`

#### Defined in

[src/cancellables.ts:46](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/cancellables.ts#L46)

___

### then

▸ **then**<`TResult1`, `TResult2`\>(`onfulfilled?`, `onrejected?`): `Promise`<`TResult1` \| `TResult2`\>

Attaches callbacks for the resolution and/or rejection of the Promise.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `TResult1` | `any` |
| `TResult2` | `never` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `onfulfilled?` | (`value`: `any`) => `TResult1` \| `PromiseLike`<`TResult1`\> | The callback to execute when the Promise is resolved. |
| `onrejected?` | (`reason`: `any`) => `TResult2` \| `PromiseLike`<`TResult2`\> | The callback to execute when the Promise is rejected. |

#### Returns

`Promise`<`TResult1` \| `TResult2`\>

A Promise for the completion of which ever callback is executed.

#### Inherited from

Promise.then

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1502

___

### all

▸ `Static` **all**<`T`\>(`values`): `Promise`<`Awaited`<`T`\>[]\>

Creates a Promise that is resolved with an array of results when all of the provided Promises
resolve, or rejected when any Promise is rejected.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `values` | `Iterable`<`T` \| `PromiseLike`<`T`\>\> | An iterable of Promises. |

#### Returns

`Promise`<`Awaited`<`T`\>[]\>

A new Promise.

#### Inherited from

Promise.all

#### Defined in

node_modules/typescript/lib/lib.es2015.iterable.d.ts:226

▸ `Static` **all**<`T`\>(`values`): `Promise`<{ -readonly [P in string \| number \| symbol]: Awaited<T[P]\> }\>

Creates a Promise that is resolved with an array of results when all of the provided Promises
resolve, or rejected when any Promise is rejected.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends readonly `unknown`[] \| [] |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `values` | `T` | An array of Promises. |

#### Returns

`Promise`<{ -readonly [P in string \| number \| symbol]: Awaited<T[P]\> }\>

A new Promise.

#### Inherited from

Promise.all

#### Defined in

node_modules/typescript/lib/lib.es2015.promise.d.ts:41

___

### allSettled

▸ `Static` **allSettled**<`T`\>(`values`): `Promise`<{ -readonly [P in string \| number \| symbol]: PromiseSettledResult<Awaited<T[P]\>\> }\>

Creates a Promise that is resolved with an array of results when all
of the provided Promises resolve or reject.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends readonly `unknown`[] \| [] |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `values` | `T` | An array of Promises. |

#### Returns

`Promise`<{ -readonly [P in string \| number \| symbol]: PromiseSettledResult<Awaited<T[P]\>\> }\>

A new Promise.

#### Inherited from

Promise.allSettled

#### Defined in

node_modules/typescript/lib/lib.es2020.promise.d.ts:40

▸ `Static` **allSettled**<`T`\>(`values`): `Promise`<`PromiseSettledResult`<`Awaited`<`T`\>\>[]\>

Creates a Promise that is resolved with an array of results when all
of the provided Promises resolve or reject.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `values` | `Iterable`<`T` \| `PromiseLike`<`T`\>\> | An array of Promises. |

#### Returns

`Promise`<`PromiseSettledResult`<`Awaited`<`T`\>\>[]\>

A new Promise.

#### Inherited from

Promise.allSettled

#### Defined in

node_modules/typescript/lib/lib.es2020.promise.d.ts:48

___

### any

▸ `Static` **any**<`T`\>(`values`): `Promise`<`Awaited`<`T`[`number`]\>\>

The any function returns a promise that is fulfilled by the first given promise to be fulfilled, or rejected with an AggregateError containing an array of rejection reasons if all of the given promises are rejected. It resolves all elements of the passed iterable to promises as it runs this algorithm.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends readonly `unknown`[] \| [] |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `values` | `T` | An array or iterable of Promises. |

#### Returns

`Promise`<`Awaited`<`T`[`number`]\>\>

A new Promise.

#### Inherited from

Promise.any

#### Defined in

node_modules/typescript/lib/lib.es2021.promise.d.ts:42

▸ `Static` **any**<`T`\>(`values`): `Promise`<`Awaited`<`T`\>\>

The any function returns a promise that is fulfilled by the first given promise to be fulfilled, or rejected with an AggregateError containing an array of rejection reasons if all of the given promises are rejected. It resolves all elements of the passed iterable to promises as it runs this algorithm.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `values` | `Iterable`<`T` \| `PromiseLike`<`T`\>\> | An array or iterable of Promises. |

#### Returns

`Promise`<`Awaited`<`T`\>\>

A new Promise.

#### Inherited from

Promise.any

#### Defined in

node_modules/typescript/lib/lib.es2021.promise.d.ts:49

___

### race

▸ `Static` **race**<`T`\>(`values`): `Promise`<`Awaited`<`T`\>\>

Creates a Promise that is resolved or rejected when any of the provided Promises are resolved
or rejected.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `values` | `Iterable`<`T` \| `PromiseLike`<`T`\>\> | An iterable of Promises. |

#### Returns

`Promise`<`Awaited`<`T`\>\>

A new Promise.

#### Inherited from

Promise.race

#### Defined in

node_modules/typescript/lib/lib.es2015.iterable.d.ts:234

▸ `Static` **race**<`T`\>(`values`): `Promise`<`Awaited`<`T`[`number`]\>\>

Creates a Promise that is resolved or rejected when any of the provided Promises are resolved
or rejected.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends readonly `unknown`[] \| [] |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `values` | `T` | An array of Promises. |

#### Returns

`Promise`<`Awaited`<`T`[`number`]\>\>

A new Promise.

#### Inherited from

Promise.race

#### Defined in

node_modules/typescript/lib/lib.es2015.promise.d.ts:52

___

### reject

▸ `Static` **reject**<`T`\>(`reason?`): `Promise`<`T`\>

Creates a new rejected promise for the provided reason.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `never` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `reason?` | `any` | The reason the promise was rejected. |

#### Returns

`Promise`<`T`\>

A new rejected Promise.

#### Inherited from

Promise.reject

#### Defined in

node_modules/typescript/lib/lib.es2015.promise.d.ts:62

___

### resolve

▸ `Static` **resolve**(): `Promise`<`void`\>

Creates a new resolved promise.

#### Returns

`Promise`<`void`\>

A resolved promise.

#### Inherited from

Promise.resolve

#### Defined in

node_modules/typescript/lib/lib.es2015.promise.d.ts:68

▸ `Static` **resolve**<`T`\>(`value`): `Promise`<`T`\>

Creates a new resolved promise for the provided value.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `T` \| `PromiseLike`<`T`\> | A promise. |

#### Returns

`Promise`<`T`\>

A promise whose internal state matches the provided promise.

#### Inherited from

Promise.resolve

#### Defined in

node_modules/typescript/lib/lib.es2015.promise.d.ts:75
