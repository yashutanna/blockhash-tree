import events from 'events';

events.defaultMaxListeners = 40;

const EventEmitter = new events();
export default EventEmitter;
