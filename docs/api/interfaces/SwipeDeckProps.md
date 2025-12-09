[**@brian/tiktok-swipe**](../README.md)

***

[@brian/tiktok-swipe](../README.md) / SwipeDeckProps

# Interface: SwipeDeckProps\<T\>

Defined in: [src/types.ts:117](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L117)

## Extends

- [`SwipeDeckOptions`](SwipeDeckOptions.md)\<`T`\>

## Type Parameters

### T

`T`

## Properties

### ariaLabel?

> `optional` **ariaLabel**: `string`

Defined in: [src/types.ts:70](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L70)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`ariaLabel`](SwipeDeckOptions.md#arialabel)

***

### as?

> `optional` **as**: `ComponentType`\<`unknown`\> \| keyof IntrinsicElements

Defined in: [src/types.ts:118](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L118)

***

### children()

> **children**: (`context`) => `ReactNode`

Defined in: [src/types.ts:119](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L119)

#### Parameters

##### context

[`SwipeDeckRenderContext`](SwipeDeckRenderContext.md)\<`T`\>

#### Returns

`ReactNode`

***

### className?

> `optional` **className**: `string`

Defined in: [src/types.ts:120](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L120)

***

### defaultIndex?

> `optional` **defaultIndex**: `number`

Defined in: [src/types.ts:57](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L57)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`defaultIndex`](SwipeDeckOptions.md#defaultindex)

***

### direction?

> `optional` **direction**: [`Direction`](../type-aliases/Direction.md)

Defined in: [src/types.ts:56](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L56)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`direction`](SwipeDeckOptions.md#direction)

***

### endReachedThreshold?

> `optional` **endReachedThreshold**: `number`

Defined in: [src/types.ts:69](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L69)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`endReachedThreshold`](SwipeDeckOptions.md#endreachedthreshold)

***

### gesture?

> `optional` **gesture**: `GestureConfig`

Defined in: [src/types.ts:61](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L61)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`gesture`](SwipeDeckOptions.md#gesture)

***

### index?

> `optional` **index**: `number`

Defined in: [src/types.ts:58](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L58)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`index`](SwipeDeckOptions.md#index)

***

### items

> **items**: readonly `T`[]

Defined in: [src/types.ts:54](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L54)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`items`](SwipeDeckOptions.md#items)

***

### keyboard?

> `optional` **keyboard**: `KeyboardConfig`

Defined in: [src/types.ts:63](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L63)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`keyboard`](SwipeDeckOptions.md#keyboard)

***

### keyboardNavigation?

> `optional` **keyboardNavigation**: `boolean`

Defined in: [src/types.ts:71](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L71)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`keyboardNavigation`](SwipeDeckOptions.md#keyboardnavigation)

***

### loop?

> `optional` **loop**: `boolean`

Defined in: [src/types.ts:60](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L60)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`loop`](SwipeDeckOptions.md#loop)

***

### onEndReached()?

> `optional` **onEndReached**: (`info`) => `void`

Defined in: [src/types.ts:68](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L68)

#### Parameters

##### info

###### direction

`"forward"` \| `"backward"`

###### distanceFromEnd

`number`

#### Returns

`void`

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`onEndReached`](SwipeDeckOptions.md#onendreached)

***

### onIndexChange()?

> `optional` **onIndexChange**: (`index`, `source`) => `void`

Defined in: [src/types.ts:59](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L59)

#### Parameters

##### index

`number`

##### source

[`IndexChangeSource`](../type-aliases/IndexChangeSource.md)

#### Returns

`void`

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`onIndexChange`](SwipeDeckOptions.md#onindexchange)

***

### onItemActive()?

> `optional` **onItemActive**: (`item`, `index`) => `void`

Defined in: [src/types.ts:66](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L66)

#### Parameters

##### item

`T`

##### index

`number`

#### Returns

`void`

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`onItemActive`](SwipeDeckOptions.md#onitemactive)

***

### onItemInactive()?

> `optional` **onItemInactive**: (`item`, `index`) => `void`

Defined in: [src/types.ts:67](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L67)

#### Parameters

##### item

`T`

##### index

`number`

#### Returns

`void`

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`onItemInactive`](SwipeDeckOptions.md#oniteminactive)

***

### orientation?

> `optional` **orientation**: [`Orientation`](../type-aliases/Orientation.md)

Defined in: [src/types.ts:55](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L55)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`orientation`](SwipeDeckOptions.md#orientation)

***

### style?

> `optional` **style**: `CSSProperties`

Defined in: [src/types.ts:121](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L121)

***

### virtual?

> `optional` **virtual**: `VirtualConfig`

Defined in: [src/types.ts:65](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L65)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`virtual`](SwipeDeckOptions.md#virtual)

***

### visibility?

> `optional` **visibility**: `VisibilityConfig`

Defined in: [src/types.ts:64](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L64)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`visibility`](SwipeDeckOptions.md#visibility)

***

### wheel?

> `optional` **wheel**: `WheelConfig`

Defined in: [src/types.ts:62](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L62)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`wheel`](SwipeDeckOptions.md#wheel)
