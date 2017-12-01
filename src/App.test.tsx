import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';

const unoData = require('./assets/uno.json');

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App {...unoData}/>, div);
});
