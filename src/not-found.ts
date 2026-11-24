/**
 * Entry point for 404.html: the shared chrome, plus the path that was actually asked for
 * written into the fake shell line.
 */
import './styles/not-found.css';

import { mountChrome } from './features/page';

mountChrome();

const path = document.getElementById('lost-path');
// whatever they typed, shown as text — never as markup
if (path) path.textContent = location.pathname + location.search;
