// Type declarations for stream-json library
declare module 'stream-json' {
  import { Transform } from 'stream';

  export interface ParserOptions {
    jsonStreaming?: boolean;
    packKeys?: boolean;
    packStrings?: boolean;
    packNumbers?: boolean;
    streamValues?: boolean;
    streamKeys?: boolean;
    streamNumbers?: boolean;
    streamStrings?: boolean;
    yajs?: boolean;
  }

  export interface StreamData {
    key?: string;
    value?: any;
    name?: string;
  }

  export class Parser extends Transform {
    constructor(options?: ParserOptions);
  }

  export function parser(options?: ParserOptions): Parser;
}

declare module 'stream-json/streamers/StreamValues' {
  import { Transform } from 'stream';
  import { StreamData } from 'stream-json';

  export function streamValues(): Transform;
}

declare module 'stream-json/filters/Pick' {
  import { Transform } from 'stream';

  interface PickOptions {
    filter?: string | RegExp | ((name: string) => boolean);
  }

  export function pick(options?: PickOptions): Transform;
}

declare module 'stream-json/filters/Ignore' {
  import { Transform } from 'stream';

  interface IgnoreOptions {
    filter?: string | RegExp | ((name: string) => boolean);
  }

  export function ignore(options?: IgnoreOptions): Transform;
}

declare module 'stream-json/streamers/StreamArray' {
  import { Transform } from 'stream';

  export function streamArray(): Transform;
}

declare module 'stream-json/streamers/StreamObject' {
  import { Transform } from 'stream';

  export function streamObject(): Transform;
}
