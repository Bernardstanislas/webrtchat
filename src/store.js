import mobx, {observable, computed,} from 'mobx';

class Store {
  @observable peerConnections = [];
  @observable channels = [];
  @observable streams = [];
}

const store = new Store();

window.store = store;

export default store;

