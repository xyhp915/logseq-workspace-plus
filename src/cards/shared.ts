import { ReactElement } from 'react'
import { TileLayoutAttrs } from '../Layout'

export type CardID = string

export interface ICardViewConstructor {
  new(tile: Partial<TileLayoutAttrs>, opts?: any): ICardView

  onBeforeAddView?(tile: Partial<TileLayoutAttrs>): Promise<any>
}

export interface ICardView {
  readonly id: CardID;
  readonly title: string;
  readonly tileLayout: Partial<TileLayoutAttrs>;
  readonly description?: string;

  render(props: any): ReactElement | null | undefined;

  // hooks
  onFocus?(e: any): void;

  onBlur?(e: any): void;

  // for serialization to persist the card
  toJSON(): {};
}