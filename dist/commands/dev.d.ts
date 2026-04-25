interface DevOptions {
    port: string;
    entry: string;
}
export declare function devCommand(options: DevOptions): Promise<void>;
export {};
