import PubSub from './pubsub/PubSub';
import actions from './actions';
import state, { IState } from './state';

class Store {

    actions: Object;
    mutations: Object;
    state: IState;
    status: string;
    events: PubSub

    constructor(props: any) {

        this.actions = {};
        this.state = {} as IState;

        this.status = 'resting';

        this.events = new PubSub();

        if (props.hasOwnProperty('actions')) {
            this.actions = props.actions;
        }

        this.state = new Proxy((props.state || {}), {
            set: (state, key: string, value) => {
                this.events.publish('stateChange', state);
                state[key] = value;
                this.status = 'resting';
                return true;
            }
        });
    }

    dispatch(actionKey: string, payload) {

        if (typeof this.actions[actionKey] !== 'function') {
            console.error(`Action "${actionKey} doesn't exist.`);
            return false;
        }
        this.status = 'action';
        let newState = this.actions[actionKey](this.state, payload);
        this.state = Object.assign(this.state, newState);
        return true;
    }

}

export default new Store({
    actions,
    state
});
