# min-store

[EN](./README.md)

Una biblioteca simple de gestión de estado inspirada en Redux. `min-store` permite administrar el estado de la aplicación de manera eficiente y suscribir elementos a cambios de estado.

## Tabla de contenidos

- [Instalación](#instalación)
- [Uso](#uso)
- [Características](#Características)
- [Licencia](#licencia)

## Instalación

```sh
npm install @zesertebe/min-store
```

## Uso

### Creando el "STORE"

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

Si necesitas la definición de tipos de tu objeto en el método "get":

```ts
export const STORE: Omit<typeof store_, "get"> & {
  get: StoreType;
} = store_;
```

### Actualizando un valor

```ts
store.set("user.isLogged", true);
```

### Obtener un valor

```ts
console.log(store.get.user.isLogged); // true
```

### Suscribirse para escuchar cambios

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

### De-subscribirse

```ts
store.unsubscribe(userSubscription);
```

## Características

- Sencillo y ligero (~2 KB minificado)
- Admite actualizaciones de estado anidadas
- Método `get` inmutable para evitar modificaciones directas
- Suscripciones basadas en eventos

## Licencia

[MIT](./LICENSE)
