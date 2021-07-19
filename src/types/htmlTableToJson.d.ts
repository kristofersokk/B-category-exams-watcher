declare module 'html-table-to-json' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Parse = (input: str) => { results: any[] };

  export const parse: Parse;
}
