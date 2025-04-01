import {NodeType} from '@/shared/enums';
import {EntryIconImage} from '@/shared/images';
import {Point} from '@/shared/types';
import {DEFAULT_NODE_SIZE} from '@shared/constants';
import {Scale} from '@shared/globalCanvasState';

import {CanvasNode} from '../CanvasNode';
import {ElementType} from '../CanvasReact.types';

interface CreateConnectPoint {
  node: CanvasNode;
}

const {x, y} = DEFAULT_NODE_SIZE.props;
const {height, width} = DEFAULT_NODE_SIZE.icon;

export class FunctionLink {
  private x: number;
  private y: number;
  public node: CanvasNode;
  public elementType = ElementType.FunctionLink;

  constructor({node}: CreateConnectPoint) {
    this.x = x;
    this.y = y;
    this.node = node;
  }

  get position() {
    return {
      x: this.node.position.x + this.x * Scale,
      y: this.node.position.y + this.y * Scale,
    };
  }

  /** Проверка, попала ли мышь на точку */
  public isPointInside(mousePos: Point) {
    return (
      this.node.type === NodeType.function &&
      mousePos.x >= this.x * Scale &&
      mousePos.x <= (this.x + width) * Scale &&
      mousePos.y >= this.y * Scale &&
      mousePos.y <= (this.y + height) * Scale
    );
  }

  public draw(ctx: CanvasRenderingContext2D, isHover: boolean) {
    const {props, icon} = DEFAULT_NODE_SIZE;
    const x = this.node.position.x + props.x * Scale;
    const y = this.node.position.y + props.y * Scale;

    const multiplier = this.node.manager.canvasController.hoverItem.current === this ? 1.1 : 1;

    if (this.node.type === NodeType.function && isHover)
      ctx?.drawImage(
        EntryIconImage,
        x - (icon.width * Scale * (multiplier - 1)) / 2,
        y - (icon.height * Scale * (multiplier - 1)) / 2,
        icon.width * Scale * multiplier,
        icon.height * Scale * multiplier,
      );
  }
}
