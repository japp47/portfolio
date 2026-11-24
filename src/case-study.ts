/**
 * Entry point for a case-study page: the shared chrome, plus the diagram interactions.
 * No hero field and no binary art here.
 */
import './styles/case.css';

import { mountDiagramHighlight, mountSequenceReveal, mountSwaps } from './features/diagrams';
import { mountChrome } from './features/page';
import { mountReveal } from './features/ui/reveal';

mountChrome();
mountReveal();
mountSwaps();
mountDiagramHighlight();
mountSequenceReveal();
