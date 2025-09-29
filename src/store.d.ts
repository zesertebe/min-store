declare module "@zesertebe/min-store" {
  export type StoreSubscriber<S = any, T = any> = (
    value: T,
    info: { path: string; full: S }
  ) => void;

  export interface Store<S = any> {
    /** Estado completo para lectura rápida (no mutar aquí). */
    readonly get: Readonly<S>;

    /**
     * Estado proxificado profundamente para DX con autocompletado y mutación por puntos.
     * Ej: STORE.data.usuario.nombre = "Arturo"
     */
    data: S;

    /** Escritura explícita por ruta */
    set(path: string, value: any): boolean;

    /** Lectura explícita por ruta */
    read<T = any>(path: string): T;

    /** Actualización basada en el valor previo */
    update<T = any>(path: string, updater: (prev: T) => T): boolean;

    /** Suscripción por ruta, ruta padre o "*" */
    subscribe(args: { property: string; func: StoreSubscriber<S> }): string | null;

    /** Cancelar suscripción */
    unsubscribe(id: string): void;
  }

  /**
   * Crea un store.
   * @param items Estado inicial tipado (da autocompletado en `data`).
   * @param props Rutas autorizadas. Vacío/omitido => todas las rutas permitidas.
   */
  export const StoreCreator: <S = any>(items: S, props?: string[]) => Store<S>;
}

