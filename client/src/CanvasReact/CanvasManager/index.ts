import {ArrowManager} from '../ArrowManager';
import {canvasQuadroSize, defaultCanvasSize, defaultNodeSize} from '../CanvasReact.constants';
import {Node} from '../Node';
import {
  canvasHtmlOptions,
  canvasWindowOptions,
  scale,
  setCanvasHtmlOptions,
  setCanvasWindowOptions,
  setFullCanvasSize,
  updateScale,
} from '../CanvasReact.state';
import {ActionsState, Arrow, ElementType, NodeType, WithPrevState} from '../CanvasReact.types';
import {ConnectPoint} from '../Node/ConnectPoint';
import {drawConnectArrow, drawGrid, drawTempConnectArrow} from '../CanvasReact.helpers';

export class CanvasManager {
  private canvas: HTMLCanvasElement;
  private arrowManager: ArrowManager;
  /** Состояние канваса */
  private state: ActionsState = ActionsState.default;
  /** Состояние для оптимизации скейлинга */
  private stopUserEventFlag = false;
  /** Вспомогательное состояние для скейлинга */
  private accumulatedScale = 0;
  /** Текущая позиция перетаскиваемой ноды */
  private currentMovingNodePosition = {x: 0, y: 0};
  /** Флаг для перерисовки фоновой сетки */
  private isChangedSizePosition = true;
  /** Состояние для оптимизации перетаскивания ноды */
  private redrawedCanvasAfterMovingNode = false;
  public nodes: Node[] = [];
  public ctx: CanvasRenderingContext2D;
  public ctxBack: CanvasRenderingContext2D;
  public ctxTemp: CanvasRenderingContext2D;
  /** Перетаскиваемая нода */
  public movingNode: undefined | Node;
  /** Стартовая точка, из которой перетаскиваем ноду */
  public startArrowPoint: undefined | ConnectPoint;
  /** Нода или точка перетаскивания в состоянии hover */
  public hoverItem: WithPrevState<ConnectPoint | Node> = {prev: null, current: null};
  /** Финишная точка, из которой перетаскиваем ноду */
  public finishArrowPoint: undefined | ConnectPoint;
  /** Создаваемая стрелка */
  public tempArrow: undefined | Arrow;

  constructor(canvas: HTMLCanvasElement, canvasBack: HTMLCanvasElement, canvasTemp: HTMLCanvasElement) {
    this.canvas = canvas;

    this.ctx = canvas.getContext('2d')!;
    this.ctxBack = canvasBack.getContext('2d')!;
    this.ctxTemp = canvasTemp.getContext('2d')!;
    this.arrowManager = new ArrowManager(this);

    const canvasInnerW = window.innerWidth - 150;
    const canvasInnerH = window.innerHeight;
    const ratio = canvasInnerW / canvasInnerH;

    setFullCanvasSize(defaultCanvasSize);
    updateScale(1 / scale);

    let min = this.nodes?.[0]?.position || {x: defaultCanvasSize.width / 2, y: defaultCanvasSize.height / 2};
    let max = this.nodes?.[0]?.position || {x: defaultCanvasSize.width / 2, y: defaultCanvasSize.height / 2};

    this.nodes.forEach((node) => {
      if (node.position.x < min.x || node.position.y < min.y) min = node.position;
      if (node.position.x > max.x || node.position.y > max.y) max = node.position;
    });

    min = {x: min.x - ratio * 500, y: min.y - 500};
    max = {x: max.x + ratio * 500, y: max.y + 500};
    const widthDist = max.x - min.x;
    const heightDist = max.y - min.y;

    setCanvasWindowOptions({
      width: canvasInnerW,
      height: canvasInnerH,
      min: {x: min.x + widthDist / 2 - canvasInnerW / 2, y: min.y + heightDist / 2 - canvasInnerH / 2},
      max: {x: min.x + widthDist / 2 + canvasInnerW / 2, y: min.y + heightDist / 2 + canvasInnerH / 2},
    });
    setCanvasHtmlOptions({width: canvasInnerW, height: canvasInnerH});

    this.draw();

    // Инициализация event хэндлеров
    if (canvasTemp) {
      canvasTemp.onmousedown = (e) => {
        this.handleMouseDown(e);
      };

      canvasTemp.onmousemove = (e) => {
        this.handleMouseMove(e);
      };

      canvasTemp.onmouseup = () => {
        this.handleMouseUp();
      };

      canvasTemp.onmouseleave = () => {
        this.handleMouseLeave();
      };

      canvasTemp.onwheel = (e) => {
        this.handleWheel(e);
      };

      window.onresize = () => {
        this.handleResize();
      };
    }
  }

  /** Отрисовка всех фигур и стрелок */
  public draw() {
    // Очищаем canvas перед отрисовкой
    if (this.isChangedSizePosition) {
      this.ctxBack.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctxTemp.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Отрисовка сетки
    if (this.isChangedSizePosition) {
      drawGrid(this.ctxBack, this.canvas.width, this.canvas.height);
      this.isChangedSizePosition = false;
    }

    // Отрисовка всех фигур
    this.nodes.forEach((node) => {
      if (node !== this.movingNode) node.draw(this.ctx);
    });

    // Отрисовка стрелок
    this.arrowManager.arrows.forEach((arrow) => {
      if (arrow.from.node !== this.movingNode && arrow.to.node !== this.movingNode) drawConnectArrow(this.ctx, arrow.path);
    });
  }

  /** Отрисовка перетаскиваемой ноды */
  drawMovingNode() {
    if (!this.redrawedCanvasAfterMovingNode) {
      this.redrawedCanvasAfterMovingNode = true;
      this.draw();
    }

    this.ctxTemp.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.movingNode) {
      this.movingNode.draw(this.ctxTemp);

      const arrows = this.arrowManager.arrows.filter((arrow) => arrow.from.node === this.movingNode || arrow.to.node === this.movingNode);

      arrows.forEach((arrow) => {
        drawConnectArrow(this.ctxTemp, arrow.path);
      });
    }
  }

  public addNode(type: NodeType, tagName?: keyof HTMLElementTagNameMap) {
    // Создание позиции по сетке ближе к центру экрана
    const position = {
      x:
        Math.round((canvasWindowOptions.min.x + canvasWindowOptions.width / 2 - defaultNodeSize.width / 2) / canvasQuadroSize) *
        canvasQuadroSize,
      y:
        Math.round((canvasWindowOptions.min.y + canvasWindowOptions.height / 2 - defaultNodeSize.height / 2) / canvasQuadroSize) *
        canvasQuadroSize,
    };
    const node = new Node({
      height: defaultNodeSize.height,
      width: defaultNodeSize.width,
      type,
      tagName,
      position,
      manager: this,
      zIndex: this.nodes.length,
    });

    this.nodes.push(node);

    this.draw();
  }

  private setHover(item: Node | ConnectPoint | null) {
    this.hoverItem = {prev: this.hoverItem.current, current: item};
  }

  private resetHover() {
    this.hoverItem = {prev: this.hoverItem.current, current: null};
  }

  private handleMouseDown(e: MouseEvent) {
    if (e.button === 1) {
      this.state = ActionsState.movingCanvas;
      this.resetHover();
    } else if (e.button === 0) {
      const hovered = this.hoverItem.current;

      if (hovered) {
        if (hovered.elementType === ElementType.Node) {
          this.movingNode = hovered as Node;
          this.state = ActionsState.movingNode;
          this.resetHover();

          this.currentMovingNodePosition = {...hovered.position};
        } else {
          this.startArrowPoint = hovered as ConnectPoint;
          this.state = ActionsState.creatingArrow;
          this.resetHover();
        }
      }
    }
  }

  /** Перемещение фоновой сетки и всех нод */
  private moveCanvas(x: number, y: number) {
    canvasWindowOptions.min.x += x / scale;
    canvasWindowOptions.min.y += y / scale;
    canvasWindowOptions.max.x += x / scale;
    canvasWindowOptions.max.y += y / scale;

    this.isChangedSizePosition = true;

    this.draw();
  }

  /** Перемещение ноды */
  private moveNode(node: Node) {
    if (node.connectPoints.top.connected) {
      const arrowsTop = this.arrowManager.arrows.filter(
        (arrow) => arrow.to === node.connectPoints.top || arrow.from === node.connectPoints.top,
      );

      for (const arrow of arrowsTop) {
        const side = arrow.from.side;
        const nodeParams = {width: arrow.from.node.size.width, height: arrow.from.node.size.height};

        if (arrow.from === node.connectPoints.top) {
          const startX = node.connectPoints.top.position.x;
          const startY = node.connectPoints.top.position.y;
          const endX = arrow.to.position.x;
          const endY = arrow.to.position.y;

          const path = drawTempConnectArrow({
            ctx: this.ctxTemp,
            startX,
            startY,
            endX,
            endY,
            side,
            nodeParams,
            finishSide: arrow.to.side,
            nodeFinishParams: arrow.to.node.size,
          });
          arrow.path = path;
        } else if (arrow.to === node.connectPoints.top) {
          const startX = arrow.from.position.x;
          const startY = arrow.from.position.y;
          const endX = node.connectPoints.top.position.x;
          const endY = node.connectPoints.top.position.y;
          const path = drawTempConnectArrow({
            ctx: this.ctxTemp,
            startX,
            startY,
            endX,
            endY,
            side,
            nodeParams,
            finishSide: arrow.to.side,
            nodeFinishParams: arrow.to.node.size,
          });
          arrow.path = path;
        }
      }
    }

    if (node.connectPoints.right.connected) {
      const arrowsRight = this.arrowManager.arrows.filter(
        (arrow) => arrow.to === node.connectPoints.right || arrow.from === node.connectPoints.right,
      );

      for (const arrow of arrowsRight) {
        const side = arrow.from.side;
        const nodeParams = {width: arrow.from.node.size.width, height: arrow.from.node.size.height};

        if (arrow.from === node.connectPoints.right) {
          const startX = node.connectPoints.right.position.x;
          const startY = node.connectPoints.right.position.y;
          const endX = arrow.to.position.x;
          const endY = arrow.to.position.y;

          const path = drawTempConnectArrow({
            ctx: this.ctxTemp,
            startX,
            startY,
            endX,
            endY,
            side,
            nodeParams,
            finishSide: arrow.to.side,
            nodeFinishParams: arrow.to.node.size,
          });
          arrow.path = path;
        } else if (arrow.to === node.connectPoints.right) {
          const startX = arrow.from.position.x;
          const startY = arrow.from.position.y;
          const endX = node.connectPoints.right.position.x;
          const endY = node.connectPoints.right.position.y;
          const path = drawTempConnectArrow({
            ctx: this.ctxTemp,
            startX,
            startY,
            endX,
            endY,
            side,
            nodeParams,
            finishSide: arrow.to.side,
            nodeFinishParams: arrow.to.node.size,
          });
          arrow.path = path;
        }
      }
    }

    if (node.connectPoints.bottom.connected) {
      const arrowsBottom = this.arrowManager.arrows.filter(
        (arrow) => arrow.to === node.connectPoints.bottom || arrow.from === node.connectPoints.bottom,
      );

      for (const arrow of arrowsBottom) {
        const side = arrow.from.side;
        const nodeParams = {width: arrow.from.node.size.width, height: arrow.from.node.size.height};

        if (arrow.from === node.connectPoints.bottom) {
          const startX = node.connectPoints.bottom.position.x;
          const startY = node.connectPoints.bottom.position.y;
          const endX = arrow.to.position.x;
          const endY = arrow.to.position.y;

          const path = drawTempConnectArrow({
            ctx: this.ctxTemp,
            startX,
            startY,
            endX,
            endY,
            side,
            nodeParams,
            finishSide: arrow.to.side,
            nodeFinishParams: arrow.to.node.size,
          });
          arrow.path = path;
        } else if (arrow.to === node.connectPoints.bottom) {
          const startX = arrow.from.position.x;
          const startY = arrow.from.position.y;
          const endX = node.connectPoints.bottom.position.x;
          const endY = node.connectPoints.bottom.position.y;
          const path = drawTempConnectArrow({
            ctx: this.ctxTemp,
            startX,
            startY,
            endX,
            endY,
            side,
            nodeParams,
            finishSide: arrow.to.side,
            nodeFinishParams: arrow.to.node.size,
          });
          arrow.path = path;
        }
      }
    }

    if (node.connectPoints.left.connected) {
      const arrowsLeft = this.arrowManager.arrows.filter(
        (arrow) => arrow.to === node.connectPoints.left || arrow.from === node.connectPoints.left,
      );

      for (const arrow of arrowsLeft) {
        const side = arrow.from.side;
        const nodeParams = {width: arrow.from.node.size.width, height: arrow.from.node.size.height};

        if (arrow.from === node.connectPoints.left) {
          const startX = node.connectPoints.left.position.x;
          const startY = node.connectPoints.left.position.y;
          const endX = arrow.to.position.x;
          const endY = arrow.to.position.y;

          const path = drawTempConnectArrow({
            ctx: this.ctxTemp,
            startX,
            startY,
            endX,
            endY,
            side,
            nodeParams,
            finishSide: arrow.to.side,
            nodeFinishParams: arrow.to.node.size,
          });
          arrow.path = path;
        } else if (arrow.to === node.connectPoints.left) {
          const startX = arrow.from.position.x;
          const startY = arrow.from.position.y;
          const endX = node.connectPoints.left.position.x;
          const endY = node.connectPoints.left.position.y;
          const path = drawTempConnectArrow({
            ctx: this.ctxTemp,
            startX,
            startY,
            endX,
            endY,
            side,
            nodeParams,
            finishSide: arrow.to.side,
            nodeFinishParams: arrow.to.node.size,
          });
          arrow.path = path;
        }
      }
    }

    this.drawMovingNode();
  }

  private handleMouseMove(e: MouseEvent): void {
    if (this.state === ActionsState.movingCanvas) {
      this.moveCanvas(-e.movementX, -e.movementY);
    } else if (this.state === ActionsState.movingNode) {
      const node = this.movingNode;

      if (!node) return;

      this.currentMovingNodePosition = {
        x: this.currentMovingNodePosition.x + e.movementX,
        y: this.currentMovingNodePosition.y + e.movementY,
      };

      // Перевод в абсолютные координаты, округление и далее перевод обратно в координаты канваса
      node.position = {
        x:
          (Math.round((canvasWindowOptions.min.x + this.currentMovingNodePosition.x / scale) / canvasQuadroSize) * canvasQuadroSize -
            canvasWindowOptions.min.x) *
          scale,
        y:
          (Math.round((canvasWindowOptions.min.y + this.currentMovingNodePosition.y / scale) / canvasQuadroSize) * canvasQuadroSize -
            canvasWindowOptions.min.y) *
          scale,
      };

      this.moveNode(node);
    } else if (this.state === ActionsState.default) {
      // Выбор фигуры, на которой находится курсор, и если их несколько, то самая верхняя
      const nodes = this.nodes.filter((fig) => fig.isPointInside({x: e.offsetX, y: e.offsetY}));
      const node = nodes.sort((a, b) => b.zIndex - a.zIndex)?.[0];

      if (node) {
        const mousePos = {
          x: e.offsetX - node.position.x,
          y: e.offsetY - node.position.y,
        };

        const point = node.checkInsideConnectPoints(mousePos);

        if (point) {
          this.setHover(point);
        } else if (!point) {
          this.setHover(node);
        }
      } else {
        this.resetHover();
      }

      if (this.hoverItem.prev !== this.hoverItem.current) this.draw();
    } else if (this.state === ActionsState.creatingArrow) {
      const point = this.startArrowPoint;

      if (!point) return;

      this.arrowManager.drawTempArrow(e, point);
    }
  }

  private handleMouseUp(): void {
    this.state = ActionsState.default;

    if (this.startArrowPoint && this.finishArrowPoint && this.tempArrow) {
      this.arrowManager.addArrow(this.tempArrow);
      this.tempArrow = undefined;
    }

    if (this.movingNode) {
      this.redrawedCanvasAfterMovingNode = false;
    }

    this.movingNode = undefined;
    this.startArrowPoint = undefined;
    this.finishArrowPoint = undefined;
    this.draw();
  }

  private handleMouseLeave(): void {
    // this.state = ActionsState.default;
    this.movingNode = undefined;
  }

  /** Обработка колёсика и тачпада (тут проблемное место) */
  private handleWheel(e: WheelEvent) {
    // Масштабирование
    if (e.ctrlKey) {
      e.preventDefault();

      if (!this.stopUserEventFlag) {
        this.stopUserEventFlag = true;
        const handleTimeout = () => (this.stopUserEventFlag = false);
        setTimeout(handleTimeout, 10);

        const absDelta = Math.abs(e.deltaY);
        let calcDelta = absDelta <= 1 ? 1 : absDelta < 15 ? 15 : 30;

        if (calcDelta === 1) {
          this.accumulatedScale += 1;

          if (this.accumulatedScale < 5) return;

          calcDelta = 5;
        }

        const calcChange = calcDelta / 300;
        const numerator = e.deltaY > 0 ? Math.abs(calcChange) : 0;
        const denomerator = e.deltaY < 0 ? Math.abs(calcChange) : 0;
        const multiplier = (1 + numerator) / (1 + denomerator);
        const newWidth = canvasWindowOptions.width * multiplier;
        const newHeight = canvasWindowOptions.height * multiplier;
        const min = {
          x: canvasWindowOptions.min.x + (1 - multiplier) * canvasWindowOptions.width * (e.offsetX / canvasHtmlOptions.width),
          y: canvasWindowOptions.min.y + (1 - multiplier) * canvasWindowOptions.height * (e.offsetY / canvasHtmlOptions.height),
        };

        // проверка на граничные значения
        const isNiceNewScale = scale * (1 / multiplier) >= 0.05 && scale * (1 / multiplier) <= 10;
        if (isNiceNewScale) {
          setCanvasWindowOptions({
            width: newWidth,
            height: newHeight,
            min,
            max: {x: min.x + newWidth, y: min.y + newHeight},
          });
          updateScale(1 / multiplier);
          this.draw();
        } else {
          const newFixScale = scale * (1 / multiplier) < 0.05 ? 0.05 : 10;
          updateScale(newFixScale / scale);

          if (scale !== 0.05 && scale !== 10) this.draw();
        }
      }
    } else {
      // TODO
      // для перемещения фона на тачпаде, но тогда на мышке при скроле двигается фон (надо посмотреть как убрать скролл на мышке)
      // this.moveCanvas(e.deltaX, e.deltaY);
    }

    this.isChangedSizePosition = true;
  }

  private handleResize() {
    const width = window.innerWidth - 150;
    const height = window.innerHeight;

    const canvasInnerW =
      width === canvasHtmlOptions.width ? canvasWindowOptions.width : (canvasWindowOptions.width * width) / canvasHtmlOptions.width;
    const canvasInnerH =
      width === canvasHtmlOptions.height ? canvasWindowOptions.height : (canvasWindowOptions.height * height) / canvasHtmlOptions.height;

    setCanvasWindowOptions({
      width: canvasInnerW,
      height: canvasInnerH,
      min: canvasWindowOptions.min,
      max: {x: canvasWindowOptions.min.x + canvasInnerW, y: canvasWindowOptions.min.y + canvasInnerH},
    });
    setCanvasHtmlOptions({width, height});
  }
}
