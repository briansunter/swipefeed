[**swipefeed**](../README.md)

***

[swipefeed](../README.md) / SwipeDeckHandle

# Interface: SwipeDeckHandle

Defined in: [types.ts:161](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L161)

## Extends

- [`SwipeDeckActions`](SwipeDeckActions.md)

## Properties

### getMotion

> **getMotion**: () => [`SwipeDeckMotion`](SwipeDeckMotion.md)

Defined in: [types.ts:163](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L163)

#### Returns

[`SwipeDeckMotion`](SwipeDeckMotion.md)

***

### getState

> **getState**: () => [`SwipeDeckState`](SwipeDeckState.md)

Defined in: [types.ts:162](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L162)

#### Returns

[`SwipeDeckState`](SwipeDeckState.md)

***

### next

> **next**: () => `void`

Defined in: [types.ts:112](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L112)

#### Returns

`void`

#### Inherited from

[`SwipeDeckActions`](SwipeDeckActions.md).[`next`](SwipeDeckActions.md#next)

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

### viewport

> **viewport**: `HTMLElement` \| `null`

Defined in: [types.ts:164](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L164)
