type Subscriber = (value: any, meta: { path: string; full: any }) => void;

export interface StoreApi {
  /** Proxy profundo para leer/escribir directamente (sin proxificar DOM) */
  data: any;

  /** Lectura de solo lectura del objeto raíz (no notifica ni proxifica) */
  get: any;

  /** Escritura por ruta "a.b.c" (notifica) */
  set: (path: string, value: any) => boolean;

  /** Lectura por ruta "a.b.c" */
  read: <T = any>(path: string) => T;

  /** Actualización funcional (prev -> next) por ruta (notifica) */
  update: <T = any>(path: string, updater: (prev: T) => T) => boolean;

  /** Suscribirse a una ruta exacta, a un padre o a "*" */
  subscribe: (args: { property: string; func: Subscriber }) => string | null;

  /** Desuscribirse por id devuelto por subscribe */
  unsubscribe: (id: string) => void;
}

export function storeCreator__(initial: any = {}, props: string[] = []): StoreApi {
  // No clonamos: preservamos referencias (DOM, funciones, etc.)
  const ROOT = initial;
  const authorized = new Set(props); // vacío => todo autorizado

  const subs: Record<string, Subscriber[]> = {};
  const subIndexById: Record<string, { property: string; index: number }> = {};

  const PROXY_CACHE = new WeakMap<object, any>();

  // ───────────── Utils de autorización / paths / notify ─────────────
  const isAuth = (p: string) => authorized.size === 0 || authorized.has(p);

  const pathParts = (p: string) => {
    if (!p) return [];
    const parts = p.split(".");
    const acc: string[] = [];
    for (let i = 0; i < parts.length; i++) acc.push(parts.slice(0, i + 1).join("."));
    return acc;
  };

  function notify(path: string, value: any) {
    // notifica ruta exacta + todas las rutas padre
    for (const p of pathParts(path)) {
      const list = subs[p];
      if (Array.isArray(list)) {
        for (const fn of list) {
          try { fn(value, { path, full: ROOT }); } catch (e) { console.error(e); }
        }
      }
    }
    // wildcard
    const all = subs["*"];
    if (Array.isArray(all)) {
      for (const fn of all) {
        try { fn(value, { path, full: ROOT }); } catch (e) { console.error(e); }
      }
    }
  }

  // ───────────── Detección de tipos proxiables ─────────────
  function isDomLike(val: any) {
    return (typeof Element !== "undefined" && val instanceof Element)
        || (typeof Node !== "undefined" && val instanceof Node);
  }

  function isPlainObject(val: any) {
    if (val === null || typeof val !== "object") return false;
    const proto = Object.getPrototypeOf(val);
    return proto === Object.prototype || proto === null;
  }

  function isProxiable(val: any) {
    // Solo proxificamos objetos planos y arrays
    if (Array.isArray(val)) return true;
    if (isPlainObject(val)) return true;
    return false;
  }

  // ───────────── Proxy profundo (sin proxificar DOM ni tipos especiales) ─────────────
  function makeProxy(target: any, basePath: string): any {
    if (!isProxiable(target)) return target;

    const cached = PROXY_CACHE.get(target);
    if (cached) return cached;

    const handler: ProxyHandler<any> = {
      get(t, prop, receiver) {
        if (prop === "__isProxy__") return true;

        const value = Reflect.get(t, prop, receiver);

        // 1) Si es DOM/Date/Map/Set/RegExp/Function => NO proxificar
        if (isDomLike(value)) return value;
        if (value instanceof Date || value instanceof Map || value instanceof Set || value instanceof RegExp) return value;
        if (typeof value === "function") return value;

        // 2) Si es proxiable, proxificar recursivo
        if (isProxiable(value)) {
          const childPath = basePath ? `${basePath}.${String(prop)}` : String(prop);
          return makeProxy(value, childPath);
        }

        // 3) Autovivificar si es null/undefined y el contenedor es proxiable
        //    - Para arrays, evitamos autovivificar índices numéricos para no sorprender
        if (value == null) {
          const isArray = Array.isArray(t);
          const isStringKey = typeof prop === "string" && (isNaN(Number(prop)) || !isArray);

          if (isStringKey) {
            const newObj: any = {};
            const ok = Reflect.set(t, prop, newObj, receiver);
            if (ok) {
              const childPath = basePath ? `${basePath}.${String(prop)}` : String(prop);
              return makeProxy(newObj, childPath);
            }
          }
        }

        return value;
      },

      set(t, prop, value, receiver) {
        const path = basePath ? `${basePath}.${String(prop)}` : String(prop);
        const ok = Reflect.set(t, prop, value, receiver);

        // Notificar solo si está autorizado (o no hay restricciones)
        if (isAuth(path)) notify(path, value);
        return ok;
      },

      deleteProperty(t, prop) {
        const path = basePath ? `${basePath}.${String(prop)}` : String(prop);
        const ok = Reflect.deleteProperty(t, prop);
        if (isAuth(path)) notify(path, undefined);
        return ok;
      }
    };

    const px = new Proxy(target, handler);
    PROXY_CACHE.set(target, px);
    return px;
  }

  // Proxy profundo del estado
  const data = makeProxy(ROOT, "");

  // ───────────── API pública ─────────────
  const api: StoreApi = {
    data,

    get: new Proxy(ROOT, {
      set(_, prop) {
        console.warn(`🚨 No puedes modificar ${String(prop)} directamente. Usa STORE.data o STORE.set/STORE.update`);
        return false;
      },
      get(target, prop) {
        // lectura directa sin proxificar (útil para debug)
        // @ts-ignore
        return target[prop];
      },
    }),

    set(path: string, value: any) {
      if (typeof path !== "string" || !path) return false;

      const parts = path.split(".");
      let cur = ROOT as any;

      for (let i = 0; i < parts.length - 1; i++) {
        const k = parts[i];
        if (cur[k] == null || typeof cur[k] !== "object") cur[k] = {};
        cur = cur[k];
      }
      cur[parts[parts.length - 1]] = value;

      if (isAuth(path)) notify(path, value);
      return true;
    },

    read<T = any>(path: string): T {
      if (!path) return ROOT as T;
      return path.split(".").reduce<any>((o, k) => (o ? o[k] : undefined), ROOT) as T;
    },

    update<T = any>(path: string, updater: (prev: T) => T) {
      const prev = api.read<T>(path);
      const next = updater(prev);
      api.set(path, next);
      return true;
    },

    subscribe({ property, func }: { property: string; func: Subscriber }) {
      if (property !== "*" && !isAuth(property)) return null;
      if (!subs[property]) subs[property] = [];
      const idx = subs[property].push(func) - 1;
      const id = `${property}#${Math.random().toString(36).slice(2, 10)}`;
      subIndexById[id] = { property, index: idx };
      return id;
    },

    unsubscribe(id: string) {
      const meta = subIndexById[id];
      if (!meta) return;
      const arr = subs[meta.property];
      if (Array.isArray(arr) && arr[meta.index]) {
        arr.splice(meta.index, 1);
      }
      delete subIndexById[id];
    },
  };

  return Object.freeze(api);
}

/* ───────────────────
   Ejemplo de uso rápido
──────────────────────
const STORE = storeCreator__({ elements: null }, ["elements.app", "ruta.actual"]);

// Suscripción (opcional)
STORE.subscribe({
  property: "elements.app",
  func: (val, { path }) => console.log("notificación:", path, val),
});

// Guardar un HTMLElement real (no proxificado)
const el = document.getElementById("algo")!;
STORE.data.elements.app = el;

// Manipular el DOM sin errores
STORE.data.elements.app.innerHTML = "hola";

// Rutas planas
STORE.set("ruta.actual", "/crops");
console.log(STORE.read("ruta.actual")); // "/crops"
*/

