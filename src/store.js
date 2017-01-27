import mobx, {observable, computed,} from 'mobx';

class Store {
  @observable peerConnections = [];
  @observable channels = [];
}

const store = new Store();

export default store;

