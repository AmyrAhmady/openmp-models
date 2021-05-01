import { IState } from "../state";

export default class PubSub {

    events: { [x: string]: ((prevState: IState) => void)[] };

    constructor() {
        this.events = {};
    }

    subscribe(event: string, callback: (prevState: IState) => void) {
        if (!this.events.hasOwnProperty(event)) {
            this.events[event] = [];
        }
        return this.events[event].push(callback);
    }

    publish(event, data: IState) {
        if (!this.events.hasOwnProperty(event)) {
            return [];
        }
        return this.events[event].map(callback => callback(data));
    }
}