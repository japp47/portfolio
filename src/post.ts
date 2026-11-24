/**
 * Entry point for a single post. Same frame as a case study, same diagram interactions.
 * Each interactive demo only loads on the post that has one.
 */
import './styles/post.css';

import { mountSequenceReveal, mountSwaps } from './features/diagrams';
import { mountChrome } from './features/page';
import { mountReveal } from './features/ui/reveal';

mountChrome();
mountReveal();
mountSwaps();
mountSequenceReveal();

const planner = document.querySelector<HTMLElement>('[data-planner]');
if (planner) void import('./features/planner').then(({ mountPlanner }) => mountPlanner(planner));

const stampede = document.querySelector<HTMLElement>('[data-stampede]');
const bloom = document.querySelector<HTMLElement>('[data-bloom]');
if (stampede || bloom) {
  void import('./features/cache-lab').then(({ mountStampede, mountBloom }) => {
    if (stampede) mountStampede(stampede);
    if (bloom) mountBloom(bloom);
  });
}

const luhn = document.querySelector<HTMLElement>('[data-luhn]');
if (luhn) void import('./features/luhn').then(({ mountLuhn }) => mountLuhn(luhn));
