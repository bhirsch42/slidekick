export {
  Slide,
  Columns,
  Column,
  Title,
  Subtitle,
  Heading,
  Bullets,
  Bullet,
  Text,
  Image,
  Quote,
  Group,
} from "./components.js";

export type {
  Node,
  Children,
  Stepped,
  SlideProps,
  ColumnsProps,
  ColumnProps,
  TitleProps,
  SubtitleProps,
  HeadingProps,
  BulletsProps,
  BulletProps,
  TextProps,
  ImageProps,
  QuoteProps,
  GroupProps,
  Deck,
} from "./types.js";

export interface SlidekickConfig {
  theme?: string;
  size?: "16:9" | "4:3";
}

export function defineConfig(config: SlidekickConfig): SlidekickConfig {
  return config;
}
