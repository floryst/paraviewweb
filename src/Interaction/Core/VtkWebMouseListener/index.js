import Monologue from 'monologue.js';

const modifier = {
  NONE: 0,
  ALT: 1,
  META: 2,
  SHIFT: 4,
  CTRL: 8,
};
const INTERATION_TOPIC = 'vtk.web.interaction';

const NoOp = () => {};

export default class VtkMouseListener {
  constructor(vtkWebClient, width = 100, height = 100, viewId = -1) {
    this.client = vtkWebClient;
    this.ready = true;
    this.width = width;
    this.height = height;
    this.viewId = viewId;
    this.setInteractionDoneCallback();
    this.lastEvent = null;
    this.listeners = {
      drag: (event) => {
        const vtkEvent = {
          view: this.viewId,
          buttonLeft: !event.isFinal,
          buttonMiddle: false,
          buttonRight: false,
          /* eslint-disable no-bitwise */
          shiftKey: event.modifier & modifier.SHIFT,
          ctrlKey: event.modifier & modifier.CTRL,
          altKey: event.modifier & modifier.ALT,
          metaKey: event.modifier & modifier.META,
          /* eslint-enable no-bitwise */
          x: event.relative.x / this.width,
          y: 1.0 - event.relative.y / this.height,
        };
        if (event.isFirst) {
          // Down
          vtkEvent.action = 'down';
        } else if (event.isFinal) {
          // Up
          vtkEvent.action = 'up';
        } else {
          // Move
          vtkEvent.action = 'move';
        }
        if (vtkEvent.action !== 'up') {
          this.emit(INTERATION_TOPIC, true);
        }
        if (this.client) {
          if (this.ready || vtkEvent.action !== 'move') {
            // Make sure we only send the last down or first up before/after a move
            if (vtkEvent.action !== 'move' && this.lastEvent) {
              // eat first down action
              if (
                this.lastEvent.action !== vtkEvent.action &&
                vtkEvent.action === 'down'
              ) {
                this.lastEvent = vtkEvent;
                return;
              }
              // eat second up action
              if (
                this.lastEvent.action === vtkEvent.action &&
                vtkEvent.action === 'up'
              ) {
                this.lastEvent = vtkEvent;
                return;
              }
            }
            this.lastEvent = vtkEvent;
            this.ready = false;
            this.client.MouseHandler.interaction(vtkEvent).then(
              (resp) => {
                this.ready = true;
                this.doneCallback(vtkEvent.action !== 'up');
              },
              (err) => {
                console.log('event err', err);
                this.doneCallback(vtkEvent.action !== 'up');
              }
            );
          }
        }
        if (vtkEvent.action === 'up') {
          this.emit(INTERATION_TOPIC, false);
        }
      },
      zoom: (event) => {
        const vtkEvent = {
          view: this.viewId,
          buttonLeft: false,
          buttonMiddle: false,
          buttonRight: !event.isFinal,
          shiftKey: false,
          ctrlKey: false,
          altKey: false,
          metaKey: false,
          x: event.relative.x / this.width,
          y: 1.0 - (event.relative.y + event.deltaY) / this.height,
        };
        if (event.isFirst) {
          // Down
          vtkEvent.action = 'down';
        } else if (event.isFinal) {
          // Up
          vtkEvent.action = 'up';
        } else {
          // Move
          vtkEvent.action = 'move';
        }
        if (vtkEvent.action !== 'up') {
          this.emit(INTERATION_TOPIC, true);
        }
        if (this.client) {
          if (this.ready || vtkEvent.action !== 'move') {
            this.ready = false;
            this.client.MouseHandler.interaction(vtkEvent).then(
              (resp) => {
                this.ready = true;
                this.doneCallback(vtkEvent.action !== 'up');
              },
              (err) => {
                this.ready = true;
                this.doneCallback(vtkEvent.action !== 'up');
              }
            );
          }
        }
        if (vtkEvent.action === 'up') {
          this.emit(INTERATION_TOPIC, false);
        }
      },
    };
  }

  getListeners() {
    return this.listeners;
  }

  setInteractionDoneCallback(callback) {
    this.doneCallback = callback || NoOp;
  }

  updateSize(w, h) {
    this.width = w;
    this.height = h;
  }

  onInteraction(callback) {
    return this.on(INTERATION_TOPIC, callback);
  }

  destroy() {
    this.client = null;
    this.listeners = null;
  }
}

// Add Observer pattern using Monologue.js
Monologue.mixInto(VtkMouseListener);
