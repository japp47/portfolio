/**
 * Entry point for the writing index. It shares the case-study styles, since a list of posts
 * and a case study want the same frame.
 */
import './styles/writing.css';

import { mountCoverField } from './features/cover';
import { mountChrome } from './features/page';
import { mountReveal } from './features/ui/reveal';

mountChrome();
mountReveal();

const field = document.querySelector<HTMLCanvasElement>('.cover__field');
if (field) mountCoverField(field);
