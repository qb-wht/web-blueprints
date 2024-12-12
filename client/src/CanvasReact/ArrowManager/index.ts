import {CanvasManager} from '../CanvasManager';
import {drawTempConnectArrow} from '../CanvasReact.helpers';
import {Arrow, Point} from '../CanvasReact.types';
import {ConnectPoint} from '../Node/ConnectPoint';

// Класс для соединения фигур стрелками
export class ArrowManager {
  public arrows: Arrow[] = [];
  private manager: CanvasManager;

  constructor(manager: CanvasManager) {
    this.manager = manager;
  }

  // Добавление стрелки между двумя фигурами
  public addArrow({from, to, path}: {from: ConnectPoint; to: ConnectPoint; path: Point[]}) {
    this.arrows.push({from, to, path});
    from.connected = true;
    to.connected = true;
  }

  // Рисование временной стрелки (во время перетягивания)
  public drawTempArrow(e: MouseEvent, point: ConnectPoint) {
    const startX = point.position.x as number;
    const startY = point.position.y as number;

    const node = point.node;
    const nodeParams = {
      width: node.size.width,
      height: node.size.height,
    };

    this.manager.draw();

    let path: Point[] = [];

    {
      const nodes = this.manager.nodes.filter((fig) => fig.isPointInside({x: e.offsetX, y: e.offsetY}));
      const node = nodes.sort((a, b) => b.zIndex - a.zIndex)?.[0];

      if (node) {
        const mousePos = {
          x: e.offsetX - node.position.x,
          y: e.offsetY - node.position.y,
        };

        const point = node.checkInsideConnectPoints(mousePos);

        if (point && point.node !== this.manager.startArrowPoint?.node) {
          this.manager.finishArrowPoint = point;
          path = drawTempConnectArrow({
            ctx: this.manager.ctxTemp,
            startX,
            startY,
            endX: point.position.x,
            endY: point.position.y,
            nodeParams,
            side: (this.manager.startArrowPoint as ConnectPoint).side,
            finishSide: point.side,
            nodeFinishParams: {width: point.node.size.width, height: point.node.size.height},
          });
        } else {
          this.manager.finishArrowPoint = undefined;
          path = drawTempConnectArrow({
            ctx: this.manager.ctxTemp,
            startX,
            startY,
            endX: e.offsetX,
            endY: e.offsetY,
            nodeParams,
            side: (this.manager.startArrowPoint as ConnectPoint).side,
          });
        }
      } else {
        this.manager.finishArrowPoint = undefined;
        path = drawTempConnectArrow({
          ctx: this.manager.ctxTemp,
          startX,
          startY,
          endX: e.offsetX,
          endY: e.offsetY,
          nodeParams,
          side: (this.manager.startArrowPoint as ConnectPoint).side,
        });
      }
    }

    if (this.manager.startArrowPoint && this.manager.finishArrowPoint)
      this.manager.tempArrow = {from: this.manager.startArrowPoint, to: this.manager.finishArrowPoint, path};
  }
}
