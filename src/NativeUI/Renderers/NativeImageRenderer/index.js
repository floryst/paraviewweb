/* global document Image */

import MouseHandler from '../../../Interaction/Core/MouseHandler';

import SizeHelper from '../../../Common/Misc/SizeHelper';

function formatSize(memorySize) {
  if (!memorySize) {
    return '';
  }
  if (memorySize > 1000000) {
    return `${Math.round(memorySize / 10000) / 100} MB - `;
  }
  if (memorySize > 1000) {
    return `${Math.round(memorySize / 10) / 100} KB - `;
  }
  return `${memorySize} B - `;
}

export default class NativeImageRenderer {
  constructor(
    domElement,
    imageProvider,
    mouseListeners = null,
    drawFPS = true
  ) {
    this.size = SizeHelper.getSize(domElement);
    this.container = domElement;
    this.canvas = document.createElement('canvas');
    this.image = new Image();
    this.fps = '';
    this.drawFPS = drawFPS;
    this.subscriptions = [];
    this.imageProvider = imageProvider;

    this.image.onload = () => {
      this.updateDrawnImage();
    };

    // Update DOM
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.ctx.font = '30px Arial';

    // Attach mouse listener if needed
    if (mouseListeners) {
      this.mouseHandler = new MouseHandler(this.canvas);
      this.mouseHandler.attach(mouseListeners);
    }

    // Add image listener
    this.subscriptions.push(
      imageProvider.onImageReady((data, envelope) => {
        this.image.src = data.url;
        this.fps = data.fps;
        this.memsize = data.metadata.memory || '';
        this.workTime = data.metadata.workTime;
      })
    );

    // Add size listener
    this.subscriptions.push(
      SizeHelper.onSizeChange(() => {
        this.size = SizeHelper.getSize(domElement);
        this.canvas.setAttribute('width', this.size.clientWidth);
        this.canvas.setAttribute('height', this.size.clientHeight);
        if (this.image.src && this.image.complete) {
          this.updateDrawnImage();
        }
      })
    );
    SizeHelper.startListening();
  }

  setDrawFPS(visible) {
    this.drawFPS = visible;
  }

  destroy() {
    while (this.subscriptions.length) {
      this.subscriptions.pop().unsubscribe();
    }

    if (this.mouseHandler) {
      this.mouseHandler.destroy();
      this.mouseHandler = null;
    }

    this.container = null;
    this.imageProvider = null;
  }

  updateDrawnImage() {
    this.ctx.drawImage(
      this.image,
      0,
      0,
      this.size.clientWidth,
      this.size.clientHeight
    );
    if (this.drawFPS) {
      this.ctx.textBaseline = 'top';
      this.ctx.textAlign = 'end';
      this.ctx.fillStyle = '#888';
      this.ctx.fillText(
        `${this.workTime}ms - ${formatSize(this.memsize)}${this.image.width}x${
          this.image.height
        } - ${this.fps} FPS`,
        this.size.clientWidth - 5,
        5
      );
    }
  }
}
