/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["min-store"] = factory();
	else
		root["min-store"] = factory();
})(this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 125:
/*!**************************!*\
  !*** ./src/lib/store.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, exports) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.storeCreator__ = storeCreator__;\nfunction storeCreator__(initial = {}, props = []) {\n    // No clonamos: preservamos referencias (DOM, funciones, etc.)\n    const ROOT = initial;\n    const authorized = new Set(props); // vacío => todo autorizado\n    const subs = {};\n    const subIndexById = {};\n    const PROXY_CACHE = new WeakMap();\n    // ───────────── Utils de autorización / paths / notify ─────────────\n    const isAuth = (p) => authorized.size === 0 || authorized.has(p);\n    const pathParts = (p) => {\n        if (!p)\n            return [];\n        const parts = p.split(\".\");\n        const acc = [];\n        for (let i = 0; i < parts.length; i++)\n            acc.push(parts.slice(0, i + 1).join(\".\"));\n        return acc;\n    };\n    function notify(path, value) {\n        // notifica ruta exacta + todas las rutas padre\n        for (const p of pathParts(path)) {\n            const list = subs[p];\n            if (Array.isArray(list)) {\n                for (const fn of list) {\n                    try {\n                        fn(value, { path, full: ROOT });\n                    }\n                    catch (e) {\n                        console.error(e);\n                    }\n                }\n            }\n        }\n        // wildcard\n        const all = subs[\"*\"];\n        if (Array.isArray(all)) {\n            for (const fn of all) {\n                try {\n                    fn(value, { path, full: ROOT });\n                }\n                catch (e) {\n                    console.error(e);\n                }\n            }\n        }\n    }\n    // ───────────── Detección de tipos proxiables ─────────────\n    function isDomLike(val) {\n        return (typeof Element !== \"undefined\" && val instanceof Element)\n            || (typeof Node !== \"undefined\" && val instanceof Node);\n    }\n    function isPlainObject(val) {\n        if (val === null || typeof val !== \"object\")\n            return false;\n        const proto = Object.getPrototypeOf(val);\n        return proto === Object.prototype || proto === null;\n    }\n    function isProxiable(val) {\n        // Solo proxificamos objetos planos y arrays\n        if (Array.isArray(val))\n            return true;\n        if (isPlainObject(val))\n            return true;\n        return false;\n    }\n    // ───────────── Proxy profundo (sin proxificar DOM ni tipos especiales) ─────────────\n    function makeProxy(target, basePath) {\n        if (!isProxiable(target))\n            return target;\n        const cached = PROXY_CACHE.get(target);\n        if (cached)\n            return cached;\n        const handler = {\n            get(t, prop, receiver) {\n                if (prop === \"__isProxy__\")\n                    return true;\n                const value = Reflect.get(t, prop, receiver);\n                // 1) Si es DOM/Date/Map/Set/RegExp/Function => NO proxificar\n                if (isDomLike(value))\n                    return value;\n                if (value instanceof Date || value instanceof Map || value instanceof Set || value instanceof RegExp)\n                    return value;\n                if (typeof value === \"function\")\n                    return value;\n                // 2) Si es proxiable, proxificar recursivo\n                if (isProxiable(value)) {\n                    const childPath = basePath ? `${basePath}.${String(prop)}` : String(prop);\n                    return makeProxy(value, childPath);\n                }\n                // 3) Autovivificar si es null/undefined y el contenedor es proxiable\n                //    - Para arrays, evitamos autovivificar índices numéricos para no sorprender\n                if (value == null) {\n                    const isArray = Array.isArray(t);\n                    const isStringKey = typeof prop === \"string\" && (isNaN(Number(prop)) || !isArray);\n                    if (isStringKey) {\n                        const newObj = {};\n                        const ok = Reflect.set(t, prop, newObj, receiver);\n                        if (ok) {\n                            const childPath = basePath ? `${basePath}.${String(prop)}` : String(prop);\n                            return makeProxy(newObj, childPath);\n                        }\n                    }\n                }\n                return value;\n            },\n            set(t, prop, value, receiver) {\n                const path = basePath ? `${basePath}.${String(prop)}` : String(prop);\n                const ok = Reflect.set(t, prop, value, receiver);\n                // Notificar solo si está autorizado (o no hay restricciones)\n                if (isAuth(path))\n                    notify(path, value);\n                return ok;\n            },\n            deleteProperty(t, prop) {\n                const path = basePath ? `${basePath}.${String(prop)}` : String(prop);\n                const ok = Reflect.deleteProperty(t, prop);\n                if (isAuth(path))\n                    notify(path, undefined);\n                return ok;\n            }\n        };\n        const px = new Proxy(target, handler);\n        PROXY_CACHE.set(target, px);\n        return px;\n    }\n    // Proxy profundo del estado\n    const data = makeProxy(ROOT, \"\");\n    // ───────────── API pública ─────────────\n    const api = {\n        data,\n        get: new Proxy(ROOT, {\n            set(_, prop) {\n                console.warn(`🚨 No puedes modificar ${String(prop)} directamente. Usa STORE.data o STORE.set/STORE.update`);\n                return false;\n            },\n            get(target, prop) {\n                // lectura directa sin proxificar (útil para debug)\n                // @ts-ignore\n                return target[prop];\n            },\n        }),\n        set(path, value) {\n            if (typeof path !== \"string\" || !path)\n                return false;\n            const parts = path.split(\".\");\n            let cur = ROOT;\n            for (let i = 0; i < parts.length - 1; i++) {\n                const k = parts[i];\n                if (cur[k] == null || typeof cur[k] !== \"object\")\n                    cur[k] = {};\n                cur = cur[k];\n            }\n            cur[parts[parts.length - 1]] = value;\n            if (isAuth(path))\n                notify(path, value);\n            return true;\n        },\n        read(path) {\n            if (!path)\n                return ROOT;\n            return path.split(\".\").reduce((o, k) => (o ? o[k] : undefined), ROOT);\n        },\n        update(path, updater) {\n            const prev = api.read(path);\n            const next = updater(prev);\n            api.set(path, next);\n            return true;\n        },\n        subscribe({ property, func }) {\n            if (property !== \"*\" && !isAuth(property))\n                return null;\n            if (!subs[property])\n                subs[property] = [];\n            const idx = subs[property].push(func) - 1;\n            const id = `${property}#${Math.random().toString(36).slice(2, 10)}`;\n            subIndexById[id] = { property, index: idx };\n            return id;\n        },\n        unsubscribe(id) {\n            const meta = subIndexById[id];\n            if (!meta)\n                return;\n            const arr = subs[meta.property];\n            if (Array.isArray(arr) && arr[meta.index]) {\n                arr.splice(meta.index, 1);\n            }\n            delete subIndexById[id];\n        },\n    };\n    return Object.freeze(api);\n}\n/* ───────────────────\n   Ejemplo de uso rápido\n──────────────────────\nconst STORE = storeCreator__({ elements: null }, [\"elements.app\", \"ruta.actual\"]);\n\n// Suscripción (opcional)\nSTORE.subscribe({\n  property: \"elements.app\",\n  func: (val, { path }) => console.log(\"notificación:\", path, val),\n});\n\n// Guardar un HTMLElement real (no proxificado)\nconst el = document.getElementById(\"algo\")!;\nSTORE.data.elements.app = el;\n\n// Manipular el DOM sin errores\nSTORE.data.elements.app.innerHTML = \"hola\";\n\n// Rutas planas\nSTORE.set(\"ruta.actual\", \"/crops\");\nconsole.log(STORE.read(\"ruta.actual\")); // \"/crops\"\n*/\n\n\n//# sourceURL=webpack://min-store/./src/lib/store.ts?");

/***/ }),

/***/ 156:
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.StoreCreator = void 0;\nconst store_1 = __webpack_require__(/*! ./lib/store */ 125);\nexports.StoreCreator = store_1.storeCreator__;\n\n\n//# sourceURL=webpack://min-store/./src/index.ts?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__(156);
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});