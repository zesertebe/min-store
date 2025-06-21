declare module "@zesertebe/min-store" {
  export const StoreCreator: (
    items: any,
    props: string[],
  ) => {
    data: typeof items;
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
