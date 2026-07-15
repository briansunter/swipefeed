[**swipefeed**](../README.md)

***

[swipefeed](../README.md) / SwipeDeckAPI

# Interface: SwipeDeckAPI\<T\>

Defined in: [types.ts:124](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L124)

## Extends

- [`SwipeDeckState`](SwipeDeckState.md).[`SwipeDeckActions`](SwipeDeckActions.md)

## Type Parameters

### T

`T`

## Properties

### canNext

> **canNext**: `boolean`

Defined in: [types.ts:107](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L107)

#### Inherited from

[`SwipeDeckState`](SwipeDeckState.md).[`canNext`](SwipeDeckState.md#cannext)

***

### canPrev

> **canPrev**: `boolean`

Defined in: [types.ts:106](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L106)

#### Inherited from

[`SwipeDeckState`](SwipeDeckState.md).[`canPrev`](SwipeDeckState.md#canprev)

***

### getItemProps

> **getItemProps**: (`index`) => `HTMLAttributes`\<`HTMLElement`\> & `object`

Defined in: [types.ts:128](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L128)

#### Parameters

##### index

`number`

#### Returns

`HTMLAttributes`\<`HTMLElement`\> & `object`

***

### getMotion

> **getMotion**: () => [`SwipeDeckMotion`](SwipeDeckMotion.md)

Defined in: [types.ts:138](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L138)

#### Returns

[`SwipeDeckMotion`](SwipeDeckMotion.md)

***

### getViewportProps

> **getViewportProps**: () => `HTMLAttributes`\<`HTMLElement`\> & `object`

Defined in: [types.ts:125](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L125)

#### Returns

`HTMLAttributes`\<`HTMLElement`\> & `object`

***

### index

> **index**: `number`

Defined in: [types.ts:104](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L104)

#### Inherited from

[`SwipeDeckState`](SwipeDeckState.md).[`index`](SwipeDeckState.md#index)

***

### isAnimating

> **isAnimating**: `boolean`

Defined in: [types.ts:105](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L105)

#### Inherited from

[`SwipeDeckState`](SwipeDeckState.md).[`isAnimating`](SwipeDeckState.md#isanimating)

***

### items

> **items**: readonly `T`[]

Defined in: [types.ts:135](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L135)

***

### next

> **next**: () => `void`

Defined in: [types.ts:112](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L112)

#### Returns

`void`

#### Inherited from

[`SwipeDeckActions`](SwipeDeckActions.md).[`next`](SwipeDeckActions.md#next)

***

### orientation

> **orientation**: [`Orientation`](../type-aliases/Orientation.md)

Defined in: [types.ts:136](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L136)

***

### prev

> **prev**: () => `void`

Defined in: [types.ts:111](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L111)

#### Returns

`void`

#### Inherited from

[`SwipeDeckActions`](SwipeDeckActions.md).[`prev`](SwipeDeckActions.md#prev)

***

### scrollTo

> **scrollTo**: (`index`, `options?`) => `void`

Defined in: [types.ts:113](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L113)

#### Parameters

##### index

`number`

##### options?

###### behavior?

[`ScrollBehavior`](../type-aliases/ScrollBehavior.md)

#### Returns

`void`

#### Inherited from

[`SwipeDeckActions`](SwipeDeckActions.md).[`scrollTo`](SwipeDeckActions.md#scrollto)

***

### totalSize

> **totalSize**: `number`

Defined in: [types.ts:134](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L134)

***

### viewport

> **viewport**: `HTMLElement` \| `null`

Defined in: [types.ts:137](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L137)

***

### virtualItems

> **virtualItems**: [`SwipeDeckVirtualItem`](SwipeDeckVirtualItem.md)[]

Defined in: [types.ts:133](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L133)
