export { Slide, Columns, Column, Title, Subtitle, Heading, Bullets, Bullet, Text, Image, Quote, } from "./components.js";
export type { Node, Children, SlideProps, ColumnsProps, ColumnProps, TitleProps, SubtitleProps, HeadingProps, BulletsProps, BulletProps, TextProps, ImageProps, QuoteProps, Deck, } from "./types.js";
export interface SlidekickConfig {
    theme?: string;
    size?: "16:9" | "4:3";
}
export declare function defineConfig(config: SlidekickConfig): SlidekickConfig;
