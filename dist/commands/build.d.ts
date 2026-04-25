interface BuildOptions {
    entry: string;
    out: string;
}
export declare function buildCommand(options: BuildOptions): Promise<void>;
export {};
