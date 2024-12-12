import {canvasQuadroSize, defaultNodeSize} from './CanvasReact.constants';
import {canvasWindowOptions, scale} from './CanvasReact.state';
import {ConnectSide, Point} from './CanvasReact.types';

interface RoundedRectParams {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  fillColor?: string;
  strokeColor?: string;
}

/** Отрисовка прямоугольника с закругленными углами */
export const drawRoundedRect = ({
  ctx,
  x,
  y,
  height = defaultNodeSize.height,
  width = defaultNodeSize.width,
  radius = defaultNodeSize.radius,
  fillColor = 'white',
  strokeColor = 'black',
}: RoundedRectParams) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);

  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();

  ctx.lineWidth = 3 * scale;
  ctx.strokeStyle = strokeColor;
  ctx.stroke();
};

interface CircleParams {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  radius: number;
  fillColor: string;
  strokeColor: string;
}

/** Рисование круга */
export const drawCircle = ({ctx, x, y, radius, fillColor, strokeColor}: CircleParams) => {
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
};

interface TextParams {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  fillColor: string;
  font: number;
  textAlign: CanvasTextAlign;
  text: string;
}

/** Рисование текста */
export const drawText = ({ctx, x, y, fillColor, font, textAlign, text}: TextParams) => {
  ctx.font = font + 'px Arial';
  ctx.fillStyle = fillColor;
  ctx.textAlign = textAlign;
  ctx.fillText(text, x, y);
};

interface ArrowParams {
  ctx: CanvasRenderingContext2D;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  arrowHeight: number;
  arrowWidth: number;
  color?: string;
}

/** Рисование стрелки */
export const drawArrow = ({ctx, startX, startY, endX, endY, arrowWidth, arrowHeight, color = 'black'}: ArrowParams) => {
  // Настройка цвета заливки и обводки
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = arrowWidth;

  // Рисуем основную линию стрелки
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // Вычисляем угол наклона стрелки
  const angle = Math.atan2(endY - startY, endX - startX);
  const arrowHeadX = endX + (arrowHeight / 3) * Math.cos(angle);
  const arrowHeadY = endY + (arrowHeight / 3) * Math.sin(angle);

  // Координаты для наконечника стрелки
  const arrowPoint1X = arrowHeadX - arrowHeight * Math.cos(angle - Math.PI / 6);
  const arrowPoint1Y = arrowHeadY - arrowHeight * Math.sin(angle - Math.PI / 6);
  const arrowPoint2X = arrowHeadX - arrowHeight * Math.cos(angle + Math.PI / 6);
  const arrowPoint2Y = arrowHeadY - arrowHeight * Math.sin(angle + Math.PI / 6);

  // Рисуем наконечник стрелки в виде треугольника
  ctx.beginPath();
  ctx.moveTo(arrowHeadX, arrowHeadY);
  ctx.lineTo(arrowPoint1X, arrowPoint1Y);
  ctx.lineTo(arrowPoint2X, arrowPoint2Y);
  ctx.closePath();
  ctx.fill();
};

interface HoverArrowsParams {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Рисование 4 стрелок при наведении */
export const drawHoverArrows = ({ctx, x, y, width, height}: HoverArrowsParams) => {
  const arrowWidth = 3;
  const arrowHeight = 12;
  const color = 'lightblue';

  const arrows = [
    {startX: x + width / 2, startY: y, endX: x + width / 2, endY: y - 20}, // Вверх
    {startX: x + width, startY: y + height / 2, endX: x + width + 20, endY: y + height / 2}, // Вправо
    {startX: x + width / 2, startY: y + height, endX: x + width / 2, endY: y + height + 20}, // Вниз
    {startX: x, startY: y + height / 2, endX: x - 20, endY: y + height / 2}, // Влево
  ];

  arrows.forEach(({startX, startY, endX, endY}) => {
    drawArrow({ctx, startX, startY, endX, endY, arrowWidth, arrowHeight, color});
  });
};

interface ConnectArrowParams {
  ctx: CanvasRenderingContext2D;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  nodeParams: {
    width: number;
    height: number;
  };
  side: ConnectSide;
  finishSide?: ConnectSide;
  nodeFinishParams?: {
    width: number;
    height: number;
  };
}

/** Получить path для соединенных стрелок, выходящих из верхней стороны */
const getConnectedArrowPathForTop = ({
  startX,
  startY,
  endX,
  endY,
  nodeParams,
  nodeFinishParams,
  finishSide,
}: Omit<ConnectArrowParams, 'ctx' | 'side'>) => {
  let currPoint = {x: startX, y: startY};
  const path = [currPoint];
  const finalPath = [];

  const padding = 25 * scale;
  const margin = 20 * scale;
  const gap = padding + margin;

  // Если навелись на входную точку соединения
  if (nodeFinishParams?.height) {
    if (endY <= startY - gap) {
      if (finishSide === 'top') {
        if (endX - margin - nodeFinishParams.width / 2 >= startX || endX + margin + nodeFinishParams.width / 2 <= startX) {
          path.push({x: startX, y: endY - gap}, {x: endX, y: endY - gap}, {x: endX, y: endY});
          return path;
        }

        finalPath.push({x: endX, y: endY});
        finalPath.push({x: endX, y: endY - gap});
        finalPath.push({x: endX + (nodeFinishParams.width / 2 + margin) * (endX > startX ? -1 : 1), y: endY - gap});
        const finishY = Math.min(endY - gap + nodeFinishParams.height + margin * 2, startY - gap);
        finalPath.push({
          x: endX + (nodeFinishParams.width / 2 + margin) * (endX > startX ? -1 : 1),
          y: finishY,
        });
        endX = endX + (nodeFinishParams.width / 2 + margin) * (endX > startX ? -1 : 1);
        endY = finishY;
      } else if (finishSide === 'left') {
        if (endX - gap >= startX) {
          path.push({x: startX, y: endY}, {x: endX, y: endY});
          return path;
        }

        finalPath.push({x: endX, y: endY});
        finalPath.push({x: endX - gap, y: endY});
        let finishCoord = {x: endX - gap, y: endY + nodeFinishParams.height / 2 + margin};
        finalPath.push(finishCoord);
        if (endY >= startY - gap - margin - nodeFinishParams.height / 2) {
          finishCoord = {
            x: Math.min(endX - padding + nodeFinishParams.width + margin, startX - nodeFinishParams.width / 2 - margin),
            y: endY + nodeFinishParams.height / 2 + margin,
          };
          finalPath.push(finishCoord);
        }

        endX = finishCoord.x;
        endY = finishCoord.y;
      } else if (finishSide === 'right') {
        if (endX + gap <= startX) {
          path.push({x: startX, y: endY}, {x: endX, y: endY});
          return path;
        }

        finalPath.push({x: endX, y: endY});
        finalPath.push({x: endX + gap, y: endY});
        let finishCoord = {x: endX + gap, y: endY + nodeFinishParams.height / 2 + margin};
        finalPath.push(finishCoord);
        if (endY >= startY - gap - margin - nodeFinishParams.height / 2) {
          finishCoord = {
            x: Math.max(endX + padding - nodeFinishParams.width - margin, startX + nodeFinishParams.width / 2 + margin),
            y: endY + nodeFinishParams.height / 2 + margin,
          };
          finalPath.push(finishCoord);
        }

        endX = finishCoord.x;
        endY = finishCoord.y;
      } else if (finishSide === 'bottom') {
        finalPath.push({x: endX, y: endY});
        finalPath.push({x: endX, y: endY + gap});
        endY = endY + gap;
      }
    } else {
      if (finishSide === 'top') {
        if (endY >= startY - gap && endY <= startY) {
          path.push({x: startX, y: endY - gap}, {x: endX, y: endY - gap}, {x: endX, y: endY});
          return path;
        }

        if (endX - nodeFinishParams.width / 2 - margin >= startX || endX + nodeFinishParams.width / 2 + margin <= startX) {
          finalPath.push({x: endX, y: endY});
          finalPath.push({x: endX, y: startY - gap});
          endY = startY - gap;
        }
      } else if (finishSide === 'left') {
        if (endX - padding >= startX - nodeFinishParams.width / 2) {
          finalPath.push({x: endX, y: endY});
          finalPath.push({x: endX - gap, y: endY});
          endX = endX - gap;
        } else {
          path.push(
            {x: startX, y: Math.min(startY - gap, endY - nodeFinishParams.height / 2 - margin)},
            {x: endX - gap, y: Math.min(startY - gap, endY - nodeFinishParams.height / 2 - margin)},
            {x: endX - gap, y: endY},
            {x: endX, y: endY},
          );
          return path;
        }
      } else if (finishSide === 'right') {
        if (endX + padding <= startX + nodeFinishParams.width / 2) {
          finalPath.push({x: endX, y: endY});
          finalPath.push({x: endX + gap, y: endY});
          endX = endX + gap;
        } else {
          path.push(
            {x: startX, y: Math.min(startY - gap, endY - nodeFinishParams.height / 2 - margin)},
            {x: endX + gap, y: Math.min(startY - gap, endY - nodeFinishParams.height / 2 - margin)},
            {x: endX + gap, y: endY},
            {x: endX, y: endY},
          );
          return path;
        }
      } else if (finishSide === 'bottom') {
        finalPath.push({x: endX, y: endY});
        finalPath.push({x: endX, y: endY + gap});
        const finishCoord =
          endX < startX
            ? {
                x: endX + (nodeFinishParams.width / 2 + margin) * (endX + nodeFinishParams.width / 2 + margin <= startX ? 1 : -1),
                y: endY + gap,
              }
            : {
                x: endX - (nodeFinishParams.width / 2 + margin) * (endX - nodeFinishParams.width / 2 - margin >= startX ? 1 : -1),
                y: endY + gap,
              };
        finalPath.push(finishCoord);
        endY = finishCoord.y;
        endX = finishCoord.x;
      }
    }
  }

  if (endY <= startY - gap) {
    if (endY + gap * 2 <= startY) {
      currPoint = {x: currPoint.x, y: currPoint.y - (startY - endY) / 2};
      path.push(currPoint);
    } else {
      currPoint = {x: currPoint.x, y: currPoint.y - gap};
      path.push(currPoint);
    }

    currPoint = {x: currPoint.x + (endX - startX), y: currPoint.y};
    path.push(currPoint);
    path.push({x: endX, y: endY});
  } else {
    currPoint = {x: currPoint.x, y: currPoint.y - gap};
    path.push(currPoint);

    if (endX >= startX) {
      currPoint = {x: currPoint.x + nodeParams.width / 2 + margin, y: currPoint.y};
      path.push(currPoint);
    } else {
      currPoint = {x: currPoint.x - nodeParams.width / 2 - margin, y: currPoint.y};
      path.push(currPoint);
    }

    if (Math.abs(endY - startY) + padding - nodeParams.height >= 0) {
      if (Math.abs(endX - startX) - (nodeParams.width / 2 + margin) >= 0) {
        currPoint = {x: endX, y: currPoint.y};
        path.push(currPoint);

        currPoint = {x: endX, y: endY};
        path.push(currPoint);
      } else {
        if (Math.abs(endY - startY) + padding - nodeParams.height * 2 - margin >= 0) {
          currPoint = {x: currPoint.x, y: (currPoint.y + endY + margin * 2) / 2};
          path.push(currPoint);
        } else {
          currPoint = {x: currPoint.x, y: currPoint.y + nodeParams.height + margin * 2};
          path.push(currPoint);
        }

        currPoint = {x: endX, y: currPoint.y};
        path.push(currPoint);

        currPoint = {x: endX, y: endY};
        path.push(currPoint);
      }
    } else {
      if (Math.abs(endX - startX) - nodeParams.width - gap >= 0) {
        currPoint = {x: (endX + startX + (gap + (endX + startX)) / Math.abs(endX + startX)) / 2, y: currPoint.y};
        path.push(currPoint);
      }

      currPoint = {x: currPoint.x, y: endY};
      path.push(currPoint);

      currPoint = {x: endX, y: endY};
      path.push(currPoint);
    }
  }

  const unitedPath = path.concat(finalPath.reverse());

  // Удаление ненужных точек пути
  for (let i = 0; i < unitedPath.length; ) {
    const coord = unitedPath[i];
    const extraPoint = coord.x === unitedPath[i + 1]?.x && coord.y === unitedPath[i + 1]?.y;
    const intermediatePoint =
      (coord.x === unitedPath[i - 1]?.x && coord.x === unitedPath[i + 1]?.x) ||
      (coord.y === unitedPath[i - 1]?.y && coord.y === unitedPath[i + 1]?.y);

    if (extraPoint) {
      unitedPath.splice(i, 1);
    } else if (intermediatePoint) {
      unitedPath.splice(i, 1);
    } else {
      i++;
    }
  }

  return unitedPath;
};

/** Получить path для стрелок, выходящих не из верхней стороны (с помощью поворота системы координат) */
const getArrowPath = ({startX, startY, endX, endY, nodeParams, side, finishSide, nodeFinishParams}: Omit<ConnectArrowParams, 'ctx'>) => {
  switch (side) {
    case 'top':
      return getConnectedArrowPathForTop({startX, startY, endX, endY, nodeParams, finishSide, nodeFinishParams});
    case 'right': {
      const rightStartX = 0;
      const rightStartY = 0;
      const rightEndX = endY - startY;
      const rightEndY = -(endX - startX);
      const rightNodeParams = {
        width: nodeParams.height,
        height: nodeParams.width,
      };
      const firstPath = getConnectedArrowPathForTop({
        startX: rightStartX,
        startY: rightStartY,
        endX: rightEndX,
        endY: rightEndY,
        nodeParams: rightNodeParams,
        finishSide: finishSide === 'right' ? 'top' : finishSide === 'top' ? 'left' : finishSide === 'left' ? 'bottom' : 'right',
        nodeFinishParams: {
          width: nodeFinishParams?.height || 0,
          height: nodeFinishParams?.width || 0,
        },
      });
      return firstPath.map(({x, y}) => ({x: -y + startX, y: x + startY}));
    }
    case 'bottom': {
      const bottomStartX = 0;
      const bottomStartY = 0;
      const bottomEndX = -(endX - startX);
      const bottomEndY = -(endY - startY);
      const firstPath = getConnectedArrowPathForTop({
        startX: bottomStartX,
        startY: bottomStartY,
        endX: bottomEndX,
        endY: bottomEndY,
        nodeParams,
        finishSide: finishSide === 'top' ? 'bottom' : finishSide === 'right' ? 'left' : finishSide === 'bottom' ? 'top' : 'right',
        nodeFinishParams,
      });
      return firstPath.map(({x, y}) => ({x: -x + startX, y: -y + startY}));
    }
    case 'left': {
      const leftStartX = 0;
      const leftStartY = 0;
      const leftEndX = -(endY - startY);
      const leftEndY = endX - startX;
      const leftNodeParams = {
        width: nodeParams.height,
        height: nodeParams.width,
      };
      const firstPath = getConnectedArrowPathForTop({
        startX: leftStartX,
        startY: leftStartY,
        endX: leftEndX,
        endY: leftEndY,
        nodeParams: leftNodeParams,
        finishSide: finishSide === 'left' ? 'top' : finishSide === 'top' ? 'right' : finishSide === 'right' ? 'bottom' : 'left',
        nodeFinishParams: {
          width: nodeFinishParams?.height || 0,
          height: nodeFinishParams?.width || 0,
        },
      });
      return firstPath.map(({x, y}) => ({x: y + startX, y: -x + startY}));
    }
  }
};

/** Рисование временной стрелки (во время перетягивания) */
export const drawTempConnectArrow = ({
  ctx,
  startX,
  startY,
  endX,
  endY,
  nodeParams,
  side,
  finishSide,
  nodeFinishParams,
}: ConnectArrowParams) => {
  const path = getArrowPath({startX, startY, endX, endY, nodeParams, side, finishSide, nodeFinishParams});
  const arrowHeight = 12 * scale;

  // Настройка цвета заливки и обводки
  ctx.fillStyle = 'black';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 3 * scale;

  // Рисуем основную линию стрелки
  ctx.beginPath();
  ctx.moveTo(startX, startY);

  for (const {x, y} of path) {
    ctx.lineTo(x, y);
  }

  ctx.stroke();

  // Вычисляем угол наклона стрелки
  const prevLast = path.length > 1 ? path[path.length - 2] : {x: startX, y: startY};
  const angle = Math.atan2(endY - prevLast.y, endX - prevLast.x);
  const arrowHeadX = endX + (arrowHeight / 3) * Math.cos(angle);
  const arrowHeadY = endY + (arrowHeight / 3) * Math.sin(angle);

  // Координаты для наконечника стрелки
  const arrowPoint1X = arrowHeadX - arrowHeight * Math.cos(angle - Math.PI / 6);
  const arrowPoint1Y = arrowHeadY - arrowHeight * Math.sin(angle - Math.PI / 6);
  const arrowPoint2X = arrowHeadX - arrowHeight * Math.cos(angle + Math.PI / 6);
  const arrowPoint2Y = arrowHeadY - arrowHeight * Math.sin(angle + Math.PI / 6);

  // Рисуем наконечник стрелки в виде треугольника
  ctx.beginPath();
  ctx.moveTo(arrowHeadX, arrowHeadY);
  ctx.lineTo(arrowPoint1X, arrowPoint1Y);
  ctx.lineTo(arrowPoint2X, arrowPoint2Y);
  ctx.closePath();
  ctx.fill();

  return path.map((point) => ({x: point.x / scale + canvasWindowOptions.min.x, y: point.y / scale + canvasWindowOptions.min.y}));
};

/** Перерисование стрелки уже созданной */
export const drawConnectArrow = (ctx: CanvasRenderingContext2D, path: Point[]) => {
  const arrowHeight = 12 * scale;
  const startX = (path[0].x - canvasWindowOptions.min.x) * scale;
  const startY = (path[0].y - canvasWindowOptions.min.y) * scale;
  const endX = (path[path.length - 1].x - canvasWindowOptions.min.x) * scale;
  const endY = (path[path.length - 1].y - canvasWindowOptions.min.y) * scale;

  // Настройка цвета заливки и обводки
  ctx.fillStyle = 'black';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 3 * scale;

  // Рисуем основную линию стрелки
  ctx.beginPath();
  ctx.moveTo(startX, startY);

  for (const {x, y} of path) {
    ctx.lineTo((x - canvasWindowOptions.min.x) * scale, (y - canvasWindowOptions.min.y) * scale);
    ctx.stroke();
  }

  // Вычисляем угол наклона стрелки
  const angle = Math.atan2(path[path.length - 1].y - path[path.length - 2].y, path[path.length - 1].x - path[path.length - 2].x);
  const arrowHeadX = endX + (arrowHeight / 3) * Math.cos(angle);
  const arrowHeadY = endY + (arrowHeight / 3) * Math.sin(angle);

  // Координаты для наконечника стрелки
  const arrowPoint1X = arrowHeadX - arrowHeight * Math.cos(angle - Math.PI / 6);
  const arrowPoint1Y = arrowHeadY - arrowHeight * Math.sin(angle - Math.PI / 6);
  const arrowPoint2X = arrowHeadX - arrowHeight * Math.cos(angle + Math.PI / 6);
  const arrowPoint2Y = arrowHeadY - arrowHeight * Math.sin(angle + Math.PI / 6);

  // Рисуем наконечник стрелки в виде треугольника
  ctx.beginPath();
  ctx.moveTo(arrowHeadX, arrowHeadY);
  ctx.lineTo(arrowPoint1X, arrowPoint1Y);
  ctx.lineTo(arrowPoint2X, arrowPoint2Y);
  ctx.closePath();
  ctx.fill();
};

/** Рисование фоновой сетки */
export const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 0.1;

  // Если scale слишком мал, то увеличиваем размер квадратов фоновой сетки
  const sizes = [
    [0.5, canvasQuadroSize * 2],
    [0.2, canvasQuadroSize * 5],
    [0.1, canvasQuadroSize * 10],
    [0.05, canvasQuadroSize * 20],
  ];
  const quadroSize = sizes.reduce((acc, curr) => (curr[0] > scale ? curr[1] : acc), canvasQuadroSize);

  const left = (Math.ceil(canvasWindowOptions.min.x / quadroSize) * quadroSize - canvasWindowOptions.min.x) * scale;
  const top = (Math.ceil(canvasWindowOptions.min.y / quadroSize) * quadroSize - canvasWindowOptions.min.y) * scale;

  // Рисуем вертикальные линии
  for (let x = left; x <= width; x += quadroSize * scale) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Рисуем горизонтальные линии
  for (let y = top; y <= height; y += quadroSize * scale) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
};
