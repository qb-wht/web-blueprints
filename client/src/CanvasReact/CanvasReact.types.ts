import {ConnectPoint} from './Node/ConnectPoint';

export enum ActionsState {
  default,
  creatingArrow,
  movingNode,
  movingCanvas,
  scaling,
}

export enum NodeType {
  htmlElement = 'htmlElement',
  style = 'styles',
  event = 'event',
  variable = 'variable',
  function = 'function',
}

export enum ElementType {
  Node,
  ConnectPoint,
}

export interface Sizes {
  height: number;
  width: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Arrow {
  from: ConnectPoint;
  to: ConnectPoint;
  path: Point[];
}

export type ConnectSide = 'top' | 'bottom' | 'left' | 'right';

export type WithPrevState<T> = {
  prev: T | null;
  current: T | null;
};
