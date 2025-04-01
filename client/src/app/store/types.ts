import {DataNode} from 'antd/es/tree';

import {CanvasNodeStore, FunctionNode, GlobalCanvasInfo} from '@/shared/types';

/**
 * Примитивы хранилища
 * **/
type StorePrimitives = {
  readonly htmlNodes: DataNode[];
  readonly mainCanvasNodes: CanvasNodeStore[];
  readonly functions: FunctionNode[];

  readonly globalCanvasInfo: {
    main: GlobalCanvasInfo | undefined;
    functions: Record<string, GlobalCanvasInfo | undefined>;
  };
};

/**
 * Методы хранилища
 * **/
type StoreMethods = {
  readonly createHtmlNodes: (file: File) => void;
  readonly createFunction: (func: FunctionNode) => void;
  readonly saveCanvasNodes: (nodes: CanvasNodeStore[]) => void;
  readonly saveFunctionNodes: (functionNodes: CanvasNodeStore[], functionId: string) => void;
  readonly saveGlobalCanvasInfo: (info: GlobalCanvasInfo | undefined) => void;
  readonly saveGlobalCanvasInfoForFunction: (info: GlobalCanvasInfo | undefined, functionId: string) => void;
  readonly resetStore: () => void;
};

export type AppStore = StoreMethods & StorePrimitives;
