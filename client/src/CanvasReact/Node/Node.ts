import {CanvasManager} from '../CanvasManager';
import {ConnectPoint} from './ConnectPoint';
import {COLORS, defaultNodeSize} from '../CanvasReact.constants';
import {canvasWindowOptions, scale} from '../CanvasReact.state';
import {ElementType, NodeType, Point, Sizes} from '../CanvasReact.types';
import {drawCircle, drawHoverArrows, drawRoundedRect, drawText} from '../CanvasReact.helpers';

interface CreateNode {
  position: Point;
  width: number;
  height: number;
  type: NodeType;
  tagName?: keyof HTMLElementTagNameMap;
  manager: CanvasManager;
  zIndex: number;
}

export class Node {
  public _position: Point;
  private _size: Sizes;
  private type: NodeType;
  public elementType = ElementType.Node;
  private tagName?: keyof HTMLElementTagNameMap;
  public connectPoints: {top: ConnectPoint; bottom: ConnectPoint; left: ConnectPoint; right: ConnectPoint};
  private manager: CanvasManager;
  public zIndex: number;

  constructor(params: CreateNode) {
    this._position = params.position;
    this._size = {width: params.width, height: params.height};
    this.type = params.type;
    this.tagName = params.tagName;
    this.manager = params.manager;
    this.zIndex = params.zIndex;

    this.connectPoints = {
      top: new ConnectPoint({side: 'top', x: defaultNodeSize.topCircle.x, y: defaultNodeSize.topCircle.y, node: this}),
      bottom: new ConnectPoint({side: 'bottom', x: defaultNodeSize.lowerCircle.x, y: defaultNodeSize.lowerCircle.y, node: this}),
      left: new ConnectPoint({side: 'left', x: defaultNodeSize.leftCircle.x, y: defaultNodeSize.leftCircle.y, node: this}),
      right: new ConnectPoint({side: 'right', x: defaultNodeSize.rightCircle.x, y: defaultNodeSize.rightCircle.y, node: this}),
    };
  }

  get position(): Point {
    return {
      x: (this._position.x - canvasWindowOptions.min.x) * scale,
      y: (this._position.y - canvasWindowOptions.min.y) * scale,
    };
  }

  set position({x, y}: Point) {
    this._position = {
      x: canvasWindowOptions.min.x + x / scale,
      y: canvasWindowOptions.min.y + y / scale,
    };
  }

  get size(): Sizes {
    return {width: this._size.width * scale, height: this._size.height * scale};
  }

  // Метод для отрисовки фигуры на canvas
  public draw(ctx: CanvasRenderingContext2D) {
    // Функция для рисования прямоугольника с закругленными углами

    const {lowerCircle, topCircle, leftCircle, rightCircle, text} = defaultNodeSize;

    const x = this.position.x;
    const y = this.position.y;
    const width = defaultNodeSize.width * scale;
    const height = defaultNodeSize.height * scale;
    const radius = defaultNodeSize.radius * scale;

    const isHover =
      this.manager.hoverItem.current === this ||
      Object.values(this.connectPoints).find((point) => point === this.manager.hoverItem.current);

    // Рисуем основной прямоугольник с закругленными углами
    drawRoundedRect({ctx, x, y, width, height, radius});

    // Рисуем красные круги наверху и внизу
    if (
      this.manager.hoverItem.current === this.connectPoints.top ||
      this.manager.startArrowPoint === this.connectPoints.top ||
      this.manager.finishArrowPoint === this.connectPoints.top ||
      this.connectPoints.top.connected
    ) {
      const x = this.position.x + topCircle.x * scale;
      const y = this.position.y + topCircle.y * scale;
      const radius = topCircle.radius * scale;

      drawCircle({ctx, x, y, radius, fillColor: COLORS.FILL_RED_ALPHA, strokeColor: COLORS.STROKE_RED_ALPHA});
    }

    if (
      this.manager.hoverItem.current === this.connectPoints.bottom ||
      this.manager.startArrowPoint === this.connectPoints.bottom ||
      this.manager.finishArrowPoint === this.connectPoints.bottom ||
      this.connectPoints.bottom.connected
    ) {
      const x = this.position.x + lowerCircle.x * scale;
      const y = this.position.y + lowerCircle.y * scale;
      const radius = lowerCircle.radius * scale;

      drawCircle({ctx, x, y, radius, fillColor: COLORS.FILL_RED_ALPHA, strokeColor: COLORS.STROKE_RED_ALPHA});
    }

    // Рисуем зеленые круги по бокам
    if (
      this.manager.hoverItem.current === this.connectPoints.left ||
      this.manager.startArrowPoint === this.connectPoints.left ||
      this.manager.finishArrowPoint === this.connectPoints.left ||
      this.connectPoints.left.connected
    ) {
      const x = this.position.x + leftCircle.x * scale;
      const y = this.position.y + leftCircle.y * scale;
      const radius = leftCircle.radius * scale;

      drawCircle({ctx, x, y, radius, fillColor: COLORS.FILL_GREEN_ALPHA, strokeColor: COLORS.STROKE_GREEN_ALPHA});
    }

    if (
      this.manager.hoverItem.current === this.connectPoints.right ||
      this.manager.startArrowPoint === this.connectPoints.right ||
      this.manager.finishArrowPoint === this.connectPoints.right ||
      this.connectPoints.right.connected
    ) {
      const x = this.position.x + rightCircle.x * scale;
      const y = this.position.y + rightCircle.y * scale;
      const radius = rightCircle.radius * scale;

      drawCircle({ctx, x, y, radius, fillColor: COLORS.FILL_GREEN_ALPHA, strokeColor: COLORS.STROKE_GREEN_ALPHA});
    }

    // Добавляем текст "Header" в центр
    {
      const x = this.position.x + text.x * scale;
      const y = this.position.y + text.y * scale;
      const textNode = this.type === NodeType.htmlElement ? this.tagName : this.type;

      drawText({ctx, x, y, fillColor: 'black', font: 24 * scale, textAlign: 'center', text: textNode || ''});
    }

    // Обозначаем hover эффект
    if (isHover) {
      drawHoverArrows({ctx, height, width, x, y});
    }
  }

  // Проверяем, попала ли мышь на фигуру
  public isPointInside(mousePos: Point): boolean {
    return (
      mousePos.x >= this.position.x &&
      mousePos.x <= this.position.x + this.size.width &&
      mousePos.y >= this.position.y &&
      mousePos.y <= this.position.y + this.size.height
    );
  }

  // Проверяем, попала ли мышь на точку перетаскивания и возвращаем её
  public checkInsideConnectPoints(mousePos: Point) {
    for (const point of Object.values(this.connectPoints)) {
      if (point.isInsidePoint(mousePos)) return point;
    }

    return undefined;
  }
}
