[@dt-esa/dynatrace-api-balancer](../README.md) / [Exports](../modules.md) / Ring

# Class: Ring<T\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `any` |

## Table of contents

### Constructors

- [constructor](Ring.md#constructor)

### Properties

- [i](Ring.md#i)

### Accessors

- [length](Ring.md#length)

### Methods

- [at](Ring.md#at)
- [every](Ring.md#every)
- [forEach](Ring.md#foreach)
- [next](Ring.md#next)
- [reduce](Ring.md#reduce)
- [some](Ring.md#some)

## Constructors

### constructor

• **new Ring**<`T`\>(`array?`)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `any` |

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `array` | `T`[] | `[]` | Array of objects to cycle through. |

#### Defined in

[src/ring.ts:9](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/ring.ts#L9)

## Properties

### i

• `Private` **i**: `number` = `-1`

#### Defined in

[src/ring.ts:3](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/ring.ts#L3)

## Accessors

### length

• `get` **length**(): `number`

Get number of items in the ring.

#### Returns

`number`

#### Defined in

[src/ring.ts:69](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/ring.ts#L69)

## Methods

### at

▸ **at**(`i`): `T`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `i` | `number` | Index to view. |

#### Returns

`T`

Item in ring at Index.

#### Defined in

[src/ring.ts:77](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/ring.ts#L77)

___

### every

▸ **every**(`test`, `thisArg?`): `boolean`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `test` | (`item`: `T`, `index?`: `number`) => `boolean` | - |
| `thisArg?` | `any` | An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value. |

#### Returns

`boolean`

Returns true if all elements tests return true.

#### Defined in

[src/ring.ts:52](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/ring.ts#L52)

___

### forEach

▸ **forEach**(`callback`, `thisArg?`): `void` \| `T`[]

Performs the specified action for each element in an array.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `callback` | (`item`: `T`, `index?`: `number`) => `any` | A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the array. |
| `thisArg?` | `any` | An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value. |

#### Returns

`void` \| `T`[]

Original array.

#### Defined in

[src/ring.ts:34](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/ring.ts#L34)

___

### next

▸ **next**(): `T`

Get the next item in the Ring.

#### Returns

`T`

Next item on the ring.

#### Defined in

[src/ring.ts:15](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/ring.ts#L15)

___

### reduce

▸ **reduce**(`callback`, `initVal`): `T`

Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `callback` | (`initialResult`: `T`, `nextItem`: `T`, `index?`: `number`) => `T` | A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array. |
| `initVal` | `any` | If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value. |

#### Returns

`T`

#### Defined in

[src/ring.ts:62](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/ring.ts#L62)

___

### some

▸ **some**(`test`, `thisArg?`): `boolean`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `test` | (`item`: `T`, `index?`: `number`) => `boolean` | - |
| `thisArg?` | `any` | An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value. |

#### Returns

`boolean`

Returns true if at least one element tests true.

#### Defined in

[src/ring.ts:43](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/ring.ts#L43)
