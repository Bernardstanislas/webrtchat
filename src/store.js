import mobx, {observable, computed,} from 'mobx';

class Store {
  @observable peerConnections = [];
}

const store = new Store();

export default store;

