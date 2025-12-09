[**@brian/tiktok-swipe**](../README.md)

***

[@brian/tiktok-swipe](../README.md) / SwipeDeckAPI

# Interface: SwipeDeckAPI\<T\>

Defined in: [src/types.ts:95](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L95)

## Extends

- [`SwipeDeckState`](SwipeDeckState.md).[`SwipeDeckActions`](SwipeDeckActions.md)

## Type Parameters

### T

`T`

## Properties

### canNext

> **canNext**: `boolean`

Defined in: [src/types.ts:78](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L78)

#### Inherited from

[`SwipeDeckState`](SwipeDeckState.md).[`canNext`](SwipeDeckState.md#cannext)

***

### canPrev

> **canPrev**: `boolean`

Defined in: [src/types.ts:77](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L77)

#### Inherited from

[`SwipeDeckState`](SwipeDeckState.md).[`canPrev`](SwipeDeckState.md#canprev)

***

### getItemProps()

> **getItemProps**: (`index`) => `HTMLAttributes`\<`HTMLElement`\> & `object`

Defined in: [src/types.ts:99](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L99)

#### Parameters

##### index

`number`

#### Returns

`HTMLAttributes`\<`HTMLElement`\> & `object`

***

### getViewportProps()

> **getViewportProps**: () => `HTMLAttributes`\<`HTMLElement`\> & `object`

Defined in: [src/types.ts:96](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L96)

#### Returns

`HTMLAttributes`\<`HTMLElement`\> & `object`

***

### index

> **index**: `number`

Defined in: [src/types.ts:75](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L75)

#### Inherited from

[`SwipeDeckState`](SwipeDeckState.md).[`index`](SwipeDeckState.md#index)

***

### isAnimating

> **isAnimating**: `boolean`

Defined in: [src/types.ts:76](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L76)

#### Inherited from

[`SwipeDeckState`](SwipeDeckState.md).[`isAnimating`](SwipeDeckState.md#isanimating)

***

### items

> **items**: readonly `T`[]

Defined in: [src/types.ts:106](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L106)

***

### next()

> **next**: () => `void`

Defined in: [src/types.ts:83](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L83)

#### Returns

`void`

#### Inherited from

[`SwipeDeckActions`](SwipeDeckActions.md).[`next`](SwipeDeckActions.md#next)

***

### orientation

> **orientation**: [`Orientation`](../type-aliases/Orientation.md)

Defined in: [src/types.ts:107](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L107)

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

***

### totalSize

> **totalSize**: `number`

Defined in: [src/types.ts:105](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L105)

***

### virtualItems

> **virtualItems**: [`SwipeDeckVirtualItem`](SwipeDeckVirtualItem.md)[]

Defined in: [src/types.ts:104](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L104)
