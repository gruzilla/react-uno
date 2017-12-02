import * as React from 'react';
import { MoveProps, PileState } from '../../lib/CardGameEngine';
import { CardDragProps, CardDropResult, CardProps } from '../card/Card';
import './Pile.css';
import ItemTypes from '../../lib/ItemTypes';
import { DropTarget, DropTargetMonitor, ConnectDropTarget } from 'react-dnd';

export interface PileProps {
  id: string;
  name: string;
  css?: React.CSSProperties;
  sort: boolean;
  incoming?: string[];
  unfolded?: boolean;
  showBack?: boolean;
  allowShowFront?: boolean;
  initialShuffle?: boolean;

  // Injected by React DnD:
  isOver: Function;
  canDrop: Function;
  connectDropTarget: ConnectDropTarget;

  // Injected by Game
  makeMove: (moveProps: MoveProps) => void;
}

/**
 * Specifies the drop target contract.
 * All methods are optional.
 */
const pileTarget = {
  canDrop(props: PileProps, monitor: DropTargetMonitor): boolean {
    // You can disallow drop based on props or item
    const item = monitor.getItem() as CardDragProps;
    if (props.id === item.pileSourceId) {
      return false;
    }
    /*
    console.log('candrop: ' + item.cardId + ' from ' + item.pileSourceId + ' to ' + props.id);
    const m = new Move();
    return m.isValid();
    */
    return true;
  },

  /*
  hover(props: PileProps, monitor: DropTargetMonitor, component) {
    // This is fired very often and lets you perform side effects
    // in response to the hover. You can't handle enter and leave
    // here—if you need them, put monitor.isOver() into collect() so you
    // can just use componentWillReceiveProps() to handle enter/leave.

    // You can access the coordinates if you need them
    const clientOffset = monitor.getClientOffset();
    const componentRect = findDOMNode(component).getBoundingClientRect();

    // You can check whether we're over a nested drop target
    const isJustOverThisOne = monitor.isOver({ shallow: true });

    // You will receive hover() even for items for which canDrop() is false
    const canDrop = monitor.canDrop();
  },
  */

  drop(props: PileProps, monitor: DropTargetMonitor, component: Pile): CardDropResult {
    if (monitor.didDrop()) {
      // If you want, you can check whether some nested
      // target already handled drop
      return { done: false };
    }

    // Obtain the dragged item
    const item = monitor.getItem() as CardDragProps;

    // You can do something with it
    console.log('drops: ' + item.cardId + ' from ' + item.pileSourceId + ' to ' + props.id);
    props.makeMove({
      from: item.pileSourceId,
      to: props.id,
      card: item.cardId,
      incomingRules: props.incoming
    });

    // You can also do nothing and return a drop result,
    // which will be available as monitor.getDropResult()
    // in the drag source's endDrag() method
    return { done: true };
  }
};

class Pile extends React.Component<PileProps, PileState> {
  static UNFOLD_MAX_ANGEL: number = 25;
  static UNFOLD_ANGEL_PER_CARD_DEGREE: number = 3.5;
  static UNFOLD_RADIUS_PIXEL: number = 1000;

  constructor(props: PileProps) {
    super(props);
    this.state = {
      cards: [],
      isShuffling: false,
      showBack: props.hasOwnProperty('showBack') && props.showBack ? props.showBack : false,
      unfolded: props.hasOwnProperty('unfolded') && props.unfolded ? props.unfolded : false
    };
  }

  componentWillReceiveProps(nextProps: PileProps) {
    if (!this.props.isOver && nextProps.isOver) {
      // You can use this as enter handler
    }

    if (this.props.isOver && !nextProps.isOver) {
      // You can use this as leave handler
    }

    /*
    if (this.props.isOverCurrent && !nextProps.isOverCurrent) {
      // You can be more specific and track enter/leave
      // shallowly, not including nested targets
    }
    */
  }

  render() {
    const childSize = React.Children.count(this.props.children);
    let cPos = 0;

    // These props are injected by React DnD,
    // as defined by your `collect` function above:
    const { isOver, canDrop, connectDropTarget } = this.props;

    const cards = overwritePropOnChildren(
      this.props.children,
      (item) => ({
        startDrag: this.childHide.bind(this),
        endDrag: () => null,
        showBack: this.state.showBack,
        css: this.state.unfolded ? {
          transform: getTransformMatrix(
            Math.min(Pile.UNFOLD_MAX_ANGEL, Pile.UNFOLD_ANGEL_PER_CARD_DEGREE * childSize),
            Pile.UNFOLD_RADIUS_PIXEL,
            childSize,
            cPos++
          )
        } : {}
      })
    );

//    onMouseDown={() => this.show()}
//    onMouseUp={() => this.hide()}
    return connectDropTarget(
      <div
        className={'pile ' + this.props.id + (isOver && canDrop ? ' can-drop' : '')}
        style={this.props.css}
        onClick={() => this.props.allowShowFront ? this.toggleBack() : false}
      >
        <span>{this.props.name}</span>
        {cards}
      </div>
    );
  }

  childHide(): void {
    this.hide();
  }

  childShow(): void {
    this.show();
  }

  show() {
    this.setState((prevState) => ({
      ...prevState,
      ...{showBack: false}
    }));
  }

  hide() {
    this.setState((prevState) => ({
      ...prevState,
      ...{showBack: true}
    }));
  }

  toggleBack() {
    console.log('toggleBack');
    this.setState((prevState) => ({
      ...prevState,
      ...{showBack: !prevState.showBack}
    }));
  }

  toggleFold() {
    this.setState((prevState) => ({
      ...prevState,
      ...{unfolded: !prevState.unfolded}
    }));
  }
}

/* helper functions */

function overwritePropOnChildren(
  children: React.ReactNode,
  props: ((child: React.ReactElement<CardProps>) => object)
): React.ReactElement<CardProps>[] {
  return React.Children.map(
    children,
    (child: React.ReactElement<CardProps>) => {
      return React.cloneElement(child, props(child));
    }
  );
}

function getTransformMatrix(angel: number, radius: number, amount: number, index: number): string {

  // switch order direction
  index = amount - index;

  // calculate distance to center and angel step
  const di = (index - (amount + 1) / 2);
  const as = angel / (amount - 1);
  // calculate angel for this index
  const ai = as * di;

  // calculate transformation matrix, do a Z-rotation
  const h1 = Math.sin(ai / 180 * Math.PI);
  const h2 = -h1;
  const h3 = Math.cos(ai / 180 * Math.PI);
  // and a x/y translation
  const t1 = - radius * h1;
  const t2 = radius * (1 - h3);

  return 'matrix3d(' +
    h3 + ',' + h2 + ',0,0,' +
    h1 + ',' + h3 + ',0,0,' +
    '0,0,1,0,' +
    t1 + ',' + t2 + ',0,1' +
    ')';
}

export default DropTarget(ItemTypes.CARD, pileTarget, (connect, monitor) => ({
  // Call this function inside render()
  // to let React DnD handle the drag events:
  connectDropTarget: connect.dropTarget(),
  // You can ask the monitor about the current drag state:
  isOver: monitor.isOver(),
  isOverCurrent: monitor.isOver({ shallow: true }),
  canDrop: monitor.canDrop(),
  itemType: monitor.getItemType()
}))(Pile);
