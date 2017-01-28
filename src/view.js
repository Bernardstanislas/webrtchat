import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import store from './store';

import {observer} from 'mobx-react';

const VideoList = observer(() => (
  <div>
    {store.streams.map(({owner, stream}) => (
      <div key={owner}>
        <h3>{owner}</h3>
        <video src={window.URL.createObjectURL(stream)} autoPlay />
      </div>
    ))}
  </div>
));

ReactDOM.render(<VideoList/>, document.getElementById('app'));
