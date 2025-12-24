'use strict';

import { BurgerMenu } from './modules/burger-menu.js';
import { initRunningLine } from './modules/running-line.js';
import { initTrialForm } from './modules/trial-form.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('[SpeakUp] Initializing modules...');

  new BurgerMenu();
  initRunningLine();
  initTrialForm();
});

