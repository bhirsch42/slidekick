export interface Node {
  type: string;
  props: Record<string, unknown>;
  children: Node[];
}

export type Children = Node | Node[] | string | number | boolean | null | undefined;

export interface SlideProps {
  children?: Children;
}

export interface ColumnsProps {
  children?: Children;
  gap?: number;
}

export interface ColumnProps {
  children?: Children;
  weight?: number;
}

export interface TitleProps {
  children?: Children;
}

export interface SubtitleProps {
  children?: Children;
}

export interface HeadingProps {
  children?: Children;
}

export interface BulletsProps {
  children?: Children;
}

export interface BulletProps {
  children?: Children;
}

export interface TextProps {
  children?: Children;
}

export interface ImageProps {
  src: string;
  alt?: string;
}

export interface QuoteProps {
  children?: Children;
  attribution?: string;
}

export type Deck = Node[];
