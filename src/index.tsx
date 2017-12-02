import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Game from './Game';
import registerServiceWorker from './registerServiceWorker';
import './index.css';

const unoData = require('./assets/uno.json');

ReactDOM.render(
  <Game {...unoData} />,
  document.getElementById('root') as HTMLElement
);
registerServiceWorker();
