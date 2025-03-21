# min-store

[ES](./README_ES.md)

A simple state management library inspired by Redux. `min-store` allows you to manage application state efficiently and subscribe elements to state changes.

## Table of Contents

- [Install](#install)
- [Use](#usage)
- [Features](#features)
- [License](#license)

## Install

```sh
npm install @zesertebe/min-store
```

## Usage

### Creating a Store

```ts
import { StoreCreator } from "@zesertebe/min-store";

type StoreType = {
  user: {
    name: string;
    email: string;
    isLogged: boolean;
  };
  pages: { [key: string]: { home: { isActive: boolean } } };
};

const MY_STORE: StoreType = {
  user: {
    name: "",
    email: "",
    isLogged: false,
  },
  pages: {
    home: {
      isActive: true,
    },
  },
};

const store_ = StoreCreator(MY_STORE, ["user.isLogged"]);
export const STORE = store_;
```

If you need the type definition of your object in the _get_ method:

```ts
export const STORE: Omit<typeof store_, "get"> & {
  get: StoreType;
} = store_;
```

### Updating State

```ts
store.set("user.isLogged", true);
```

### Getting State

```ts
console.log(store.get.user.isLogged); // true
```

### Subscribing to Changes

```ts
const userSubscription = store.subscribe({
  func: () => {
    if (store.get.user.isLogged) {
      console.log("Login success!");
    } else {
      console.log("Login fail");
    }
  },
  property: "user.logged",
});
```

### Unsubscribing

```ts
store.unsubscribe(userSubscription);
```

## Features

- Simple and lightweight (~2KB minified)
- Supports nested state updates
- Immutable `get` method to prevent direct modifications
- Event-driven subscriptions

## License

[MIT](./LICENSE)
