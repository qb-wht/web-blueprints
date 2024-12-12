import {connectPointRadius} from '../../CanvasReact.constants';
import {Node} from '..';
import {scale} from '../../CanvasReact.state';
import {ConnectSide, ElementType, Point} from '../../CanvasReact.types';

interface CreateConnectPoint {
  side: ConnectSide;
  isConnected?: boolean;
  x: number;
  y: number;
  radius?: number;
  node: Node;
}

export class ConnectPoint {
  public side: ConnectSide;
  public isConnected: boolean;
  public x: number;
  public y: number;
  public radius: number;
  public elementType = ElementType.ConnectPoint;
  public node: Node;
  public connected = false;

  constructor({side, isConnected = false, x, y, radius = connectPointRadius, node}: CreateConnectPoint) {
    this.side = side;
    this.isConnected = isConnected;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.node = node;
  }

  get position() {
    return {
      x: this.node.position.x + this.x * scale,
      y: this.node.position.y + this.y * scale,
    };
  }

  // Проверяем, попала ли мышь на точку
  isInsidePoint(mousePos: Point) {
    // Вычисление квадратов расстояний
    const distanceSquared = (mousePos.x - this.x * scale) ** 2 + (mousePos.y - this.y * scale) ** 2;
    const radiusSquared = (this.radius * scale) ** 2;

    // Возвращаем true, если расстояние до точки меньше или равно радиусу
    return distanceSquared <= radiusSquared;
  }
}
