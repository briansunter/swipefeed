[**@brian/tiktok-swipe**](../README.md)

***

[@brian/tiktok-swipe](../README.md) / SwipeDeckHandle

# Interface: SwipeDeckHandle

Defined in: [src/types.ts:124](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L124)

## Extends

- [`SwipeDeckActions`](SwipeDeckActions.md)

## Properties

### getState()

> **getState**: () => [`SwipeDeckState`](SwipeDeckState.md)

Defined in: [src/types.ts:125](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L125)

#### Returns

[`SwipeDeckState`](SwipeDeckState.md)

***

### next()

> **next**: () => `void`

Defined in: [src/types.ts:83](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L83)

#### Returns

`void`

#### Inherited from

[`SwipeDeckActions`](SwipeDeckActions.md).[`next`](SwipeDeckActions.md#next)

***

### prev()

> **prev**: () => `void`

Defined in: [src/types.ts:82](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L82)

#### Returns

`void`

#### Inherited from

[`SwipeDeckActions`](SwipeDeckActions.md).[`prev`](SwipeDeckActions.md#prev)

***

### scrollTo()

> **scrollTo**: (`index`, `options?`) => `void`

Defined in: [src/types.ts:84](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L84)

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
