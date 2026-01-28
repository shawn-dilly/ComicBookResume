/// <reference types="vite/client" />

// Declare module for importing CSV files as raw strings
declare module '*.csv?raw' {
  const content: string;
  export default content;
}
