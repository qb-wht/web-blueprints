import {Sizes} from './CanvasReact.types';

export const defaultCanvasSize: Sizes = {
  height: 9000,
  width: 16000,
};

/** Размеры элементов */
export const defaultNodeSize = {
  /** Ширина ноды */
  width: 300,
  /** Высота ноды */
  height: 150,
  /** Радиус закругления углов ноды */
  radius: 20,
  /** Толщина периметра ноды */
  lineWidth: 3,
  /** Верхний круг ноды */
  topCircle: {
    x: 150,
    y: 25,
    radius: 15,
  },
  /** Левый круг ноды */
  leftCircle: {
    x: 25,
    y: 75,
    radius: 15,
  },
  /** Правый круг ноды */
  rightCircle: {
    x: 275,
    y: 75,
    radius: 15,
  },
  /** Нижний круг ноды */
  lowerCircle: {
    x: 150,
    y: 125,
    radius: 15,
  },
  /** Текст внутри ноды */
  text: {
    x: 150,
    y: 80,
  },
};

/** Радиус точки перетаскивания в ноде */
export const connectPointRadius = 15;
/** Длина стороны квадрата фоновой сетки */
export const canvasQuadroSize = 25;

/** Цвета (для точек перетаскивания) */
export const COLORS = {
  FILL_RED_ALPHA: 'rgba(255, 171, 171, 0.5)',
  FILL_GREEN_ALPHA: 'rgba(100, 240, 100, 0.3)',
  STROKE_RED_ALPHA: 'rgba(255, 0, 0, 0.3)',
  STROKE_GREEN_ALPHA: 'rgba(0, 255, 0, 0.3)',
};
