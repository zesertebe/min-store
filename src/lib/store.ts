export function storeCreator__(items: any, props: string[]) {
  const authorizedProperties = props;
  const STORE = items;

  // Un objeto encargado de almacenar todas las suscripciones que los elementos de la aplicación realizan al store
  const subscriptions = {};

  /**
   * Notifica a los elementos suscritos al store cuando ocurra un cambio
   */
  function updateElements_(elements: Function[], value: any) {
    elements.forEach((func) => {
      try {
        func(value);
      } catch (error) {
        console.error(error);
      }
    });
  }

  /**
   * Se encarga de modificar las propiedades internas del objeto store
   */
  function updateNestedProperty(
    object: any,
    propertyPath: string,
    value: string,
  ) {
    const parts = propertyPath.split(".");
    let currentObject = object;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!currentObject[part]) {
        currentObject[part] = {};
      }
      currentObject = currentObject[part];
    }

    const lastPart = parts[parts.length - 1];
    currentObject[lastPart] = value;
  }

  /**
   * Actualiza
   */
  const proxyData = new Proxy(STORE, {
    set: function (target: any, property: string, value) {
      const propertyPath = property.split(".");
      console.log("target: ", target);
      console.log("property: ", property);
      console.log("value: ", value);
      console.log("subscriptions: ", subscriptions);
      if (propertyPath.length > 1) {
        updateNestedProperty(target, property, value);
      } else {
        const t = target[property];
        console.log("target,property: ", t);
        target[property as keyof typeof target] = value;
      }

      if (property in subscriptions) {
        // update the STORE property with the new value
        updateElements_(
          subscriptions[property as keyof typeof subscriptions],
          value,
        );
      }
      return true;
    },
  });

  // lista de suscripciones
  const listSubscriptions: { [key: string]: number } = {};

  // Función para suscribir elementos a las propiedades correspondientes
  function subscribeElements({
    property,
    func,
  }: {
    property: string;
    func: Function;
  }) {
    const options = {
      property,
      func,
    };
    if (!authorizedProperties.includes(options.property)) {
      return null;
    }
    const propertyPath = options.property.split("."); // Divide la propiedad en partes
    const property_ = options.property as keyof typeof subscriptions;
    const currentSubscriptions: {
      [key: string]: Function[];
    } = subscriptions;
    if (!currentSubscriptions[property_]) {
      currentSubscriptions[property_] = [];
    }
    currentSubscriptions[
      options.property as keyof typeof currentSubscriptions
    ].push(options.func);

    const position = currentSubscriptions[property_].length - 1;
    const id = randomString(8);
    listSubscriptions[id as keyof typeof listSubscriptions] = position;
    return id;

    function randomString(len = 5) {
      let result = "";
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      const charsLen = chars.length;
      for (let i = 0; i < len; i++) {
        result += chars.charAt(Math.floor(Math.random() * charsLen));
      }
      return result;
    }
  }

  function unsubscribeElement(id: string) {
    try {
      const position = listSubscriptions[id as keyof typeof listSubscriptions];
      const property = Object.keys(subscriptions)[position];
      const currentSubscriptions =
        subscriptions[property as keyof typeof subscriptions];
      // @ts-ignore
      currentSubscriptions.splice(position, 1);
      delete listSubscriptions[id as keyof typeof listSubscriptions];
    } catch (e) {}
  }

  const result: {
    set: (key: string, value: any) => void;
    get: typeof STORE;
    subscribe: ({
      func,
      property,
    }: {
      func: () => void;
      property: string;
    }) => string | null;
    unsubscribe: (id: string) => void;
  } = {
    set: (key: string, value: any) => (proxyData[key] = value),
    get: new Proxy(STORE, {
      set(_, prop, __) {
        console.warn(
          `🚨 No puedes modificar ${String(prop)} directamente. Usa STORE.set()`,
        );
        return false;
      },
      get(target, prop) {
        return target[prop];
      },
    }),
    subscribe: subscribeElements,
    unsubscribe: unsubscribeElement,
  };
  return Object.freeze(result);
}
