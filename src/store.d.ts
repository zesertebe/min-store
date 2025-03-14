declare module "@zesertebe/min-store" {
  export const StoreCreator: (
    items: any,
    props: string[],
  ) => {
    set: (key: string, value: any) => void;
    get: typeof items;
    subscribe: ({
      func,
      property,
    }: {
      func: () => void;
      property: string;
    }) => null | string;
    unsubscribe: (id: string) => void;
  };
}
