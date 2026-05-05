export interface Node {
  type: string;
  props: Record<string, unknown>;
  children: Node[];
}

export type Children = Node | Node[] | string | number | boolean | null | undefined;

export interface Stepped {
  step?: number;
}

export interface SlideProps extends Stepped {
  children?: Children;
}

export interface ColumnsProps extends Stepped {
  children?: Children;
  gap?: number;
}

export interface ColumnProps extends Stepped {
  children?: Children;
  weight?: number;
}

export interface TitleProps extends Stepped {
  children?: Children;
}

export interface SubtitleProps extends Stepped {
  children?: Children;
}

export interface HeadingProps extends Stepped {
  children?: Children;
}

export interface BulletsProps extends Stepped {
  children?: Children;
}

export interface BulletProps extends Stepped {
  children?: Children;
}

export interface TextProps extends Stepped {
  children?: Children;
}

export interface ImageProps extends Stepped {
  src: string;
  alt?: string;
}

export interface QuoteProps extends Stepped {
  children?: Children;
  attribution?: string;
}

export interface GroupProps extends Stepped {
  children?: Children;
}

export type Deck = Node[];
