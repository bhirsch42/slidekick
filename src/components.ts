import { makeNode } from "./jsx-runtime.js";
import type {
  Node,
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
} from "./types.js";

export const Slide = (props: SlideProps): Node => makeNode("slide", props);
export const Columns = (props: ColumnsProps): Node => makeNode("columns", props);
export const Column = (props: ColumnProps): Node => makeNode("column", props);
export const Title = (props: TitleProps): Node => makeNode("title", props);
export const Subtitle = (props: SubtitleProps): Node => makeNode("subtitle", props);
export const Heading = (props: HeadingProps): Node => makeNode("heading", props);
export const Bullets = (props: BulletsProps): Node => makeNode("bullets", props);
export const Bullet = (props: BulletProps): Node => makeNode("bullet", props);
export const Text = (props: TextProps): Node => makeNode("text", props);
export const Image = (props: ImageProps): Node => makeNode("image", props);
export const Quote = (props: QuoteProps): Node => makeNode("quote", props);
export const Group = (props: GroupProps): Node => makeNode("group", props);
