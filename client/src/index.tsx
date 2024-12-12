// index.tsx - entry point

import {createRoot} from 'react-dom/client';
import {DiagramNode} from '~shared';
import './index.css';
import {CanvasReact} from './CanvasReact';

const a = {} as DiagramNode;

console.log('Hello, world!', a);

// Render your React component instead
const root = createRoot(document.getElementById('root') as HTMLDivElement);
// root.render(<CanvasResearch />);
root.render(<CanvasReact />);
