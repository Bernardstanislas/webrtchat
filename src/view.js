import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import store from './store';
import './style.css';

import {observer} from 'mobx-react';

const VideoList = observer(() => (
  <div className='video-list'>
    {store.streams.map(({owner, stream}) => (
      <div key={owner} className='video'>
        <video src={window.URL.createObjectURL(stream)} autoPlay />
      </div>
    ))}
  </div>
));

ReactDOM.render(<VideoList/>, document.getElementById('app'));
