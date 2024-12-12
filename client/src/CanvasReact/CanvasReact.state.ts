import {defaultCanvasSize} from './CanvasReact.constants';
import {Point, Sizes} from './CanvasReact.types';

const min = {x: defaultCanvasSize.width / 2, y: defaultCanvasSize.height / 2};
const max = {x: defaultCanvasSize.width / 2, y: defaultCanvasSize.height / 2};

/** Размер полотна в своей условной величине */
export let fullCanvasSize = defaultCanvasSize;
/** Размер полотна (видного пользователю) в пикселях */
export let canvasHtmlOptions = {width: window.innerWidth - 150, height: window.innerHeight}; // 150 - это ширина сайдбара
/** Размер полотна (видного пользователю) в своей условной величине и координаты */
export let canvasWindowOptions = {min, max, ...defaultCanvasSize};
/** Масштаб */
export let scale = 1;

export const setFullCanvasSize = (size: Sizes) => (fullCanvasSize = size);
export const setCanvasHtmlOptions = (options: Sizes) => (canvasHtmlOptions = options);
export const setCanvasWindowOptions = (options: {min: Point; max: Point} & Sizes) => (canvasWindowOptions = options);
export const updateScale = (multiplier: number) => (scale *= multiplier);
