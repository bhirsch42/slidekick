interface BuildOptions {
    entry: string;
    out: string;
    imageMode?: boolean;
    imageWidth?: string;
}
export declare function buildCommand(options: BuildOptions): Promise<void>;
export {};
