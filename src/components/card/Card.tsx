import * as React from 'react';
import { CardState } from '../../lib/CardGameEngine';
import { DragSource, DragSourceMonitor } from 'react-dnd';
import './Card.css';
import ItemTypes from '../../lib/ItemTypes';
// let unoSvgPath = require('../../assets/uno.svg');
// let unoPngPath = require('../../assets/uno.png');

export interface CardProps {
  id: string;
  url: string;
  suit: string;
  rank: string;
  name: string;
  parentPile: string;
  showBack?: boolean;
  css?: React.CSSProperties;
  animationName?: string;

  // Injected by React DnD:
  connectDragSource: Function;
  connectDragPreview: Function;
  isDragging: Function;

  // Injected by Pile
  startDrag: () => void;
  endDrag: () => void;
}

export interface CardDragProps {
  cardId: string;
  previewUrl: string;
  pileSourceId: string;
}

export interface CardDropResult {
  done: boolean;
}

/**
 * Specifies the drag source contract.
 * Only `beginDrag` function is required.
 */
const cardSource = {
  beginDrag(props: CardProps, monitor: DragSourceMonitor, component: Card): CardDragProps {
    // dispatch event
    props.startDrag();

    const card = props.showBack ? 'back' : props.url;
    const url = process.env.PUBLIC_URL + '/uno/' + card + '.png';

    // Return the data describing the dragged item
    return {
      cardId: props.id,
      previewUrl: url,
      pileSourceId: props.parentPile
    };
  },

  endDrag(props: CardProps, monitor: DragSourceMonitor, component: Card) {
    // dispatch event
    props.endDrag();

    if (!monitor.didDrop()) {
      return;
    }

    // When dropped on a compatible target, do something
    const item: CardDragProps = monitor.getItem() as CardDragProps;
    const dropResult = monitor.getDropResult() as CardDropResult;

    if (dropResult.done) {
      return;
    }

    // CardActions.moveCardToList(item.id, dropResult.listId);
    console.log('end drag: ' + item.cardId + ' from ' + item.pileSourceId);
  }
};

class Card extends React.Component<CardProps, CardState> {
  private _image: HTMLImageElement | null;

  render() {
    // These two props are injected by React DnD,
    // as defined by your `collect` function above:
    const {isDragging, connectDragSource, showBack} = this.props;

    const url = process.env.PUBLIC_URL + '/uno/' + (showBack ? 'back' : this.props.url) + '.png';
    const animCss: React.CSSProperties = {};
    if (this.props.animationName && this.props.animationName !== 'none') {
      animCss.animationName = getAnimationName(this.props.animationName);
    } else {
      animCss.animationName = 'none';
    }
    console.log('rendering ' + this.props.id + ' ' + this.props.animationName + ' ' + animCss.animationName);
    const cssProps = {...this.props.css, ...animCss};

    return connectDragSource(
      <div
        className={'card ' + this.props.id + (isDragging ? ' is-dragging' : '')}
        style={cssProps}
      >
        <img src={url} ref={(el) => this._image = el}/>
      </div>
    );
  }

  /*
  // overwrite event.dataTransfer.setDragImage()
  componentDidMount() {
    if (this.props.connectDragPreview) {
      const url = process.env.PUBLIC_URL + '/uno/' + this.props.url + '.png';
      const img = new Image();
      img.src = url;
      img.onload = () => this.props.connectDragPreview(
        img,
        {
          // IE fallback: specify that we'd rather screenshot the node
          // when it already knows it's being dragged so we can hide it with CSS.
          captureDraggingState: true,
        }
      );
    }
  }
  */
}

/* helper functions */

function getAnimationName(animName: string): string {
  switch (animName) {
    case 'shuffle':
      return getShuffleAnimation(150);
    default:
      break;
  }

  throw new Error('Animation ' + animName + ' is unknown.');
}

function getShuffleAnimation(distance: number): string {
  let styleSheet = document.styleSheets[0] as CSSStyleSheet;

  let animationName = `shuffle-anim-${ Math.round(Math.random() * 100) }`;

  let keyframes =
    `@-webkit-keyframes ${animationName} {
        0% {}
        50% {-webkit-transform:translate(${
            Math.random() * distance * 2 - distance
          }px, ${
            Math.random() * distance * 2 - distance
          }px)}
        100% {}
    }`;

  styleSheet.insertRule(keyframes, styleSheet.cssRules.length);

  return animationName;
}

export default DragSource(ItemTypes.CARD, cardSource, (connect, monitor) => ({
  // Call this function inside render()
  // to let React DnD handle the drag events:
  connectDragSource: connect.dragSource(),
  // connectDragPreview: connect.dragPreview(),
  // You can ask the monitor about the current drag state:
  isDragging: monitor.isDragging()
}))(Card);
