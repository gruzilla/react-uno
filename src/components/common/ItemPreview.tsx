import * as React from 'react';
import { DragLayer } from 'react-dnd';
import { CardDragProps } from '../card/Card';

export interface Offset {
  x: number;
  y: number;
}

function getItemStyles (currentOffset: Offset) {
  if (!currentOffset) {
    return {
      display: 'none'
    };
  }

  // http://www.paulirish.com/2012/why-moving-elements-with-translate-is-better-than-posabs-topleft/
  let x = currentOffset.x;
  let y = currentOffset.y;
  let transform = `translate(${x}px, ${y}px)`;

  return {
    pointerEvents: 'none',
    transform: transform,
    WebkitTransform: transform
  };
}

export interface CustomDragProps {
  currentOffset: Offset;
  isDragging: boolean;
  item: CardDragProps;
}

class CustomDragLayer extends React.Component<CustomDragProps> {
  render() {
    const url = this.props.item ? this.props.item.previewUrl : '';

    return (
      <div
        className={'card' + (this.props.isDragging ? ' is-flying' : '')}
        style={getItemStyles(this.props.currentOffset)}
      >
        <img src={url} />
      </div>
    );
  }
}

export default DragLayer(monitor => ({
  item: monitor.getItem(),
  itemType: monitor.getItemType(),
  currentOffset: monitor.getSourceClientOffset(),
  isDragging: monitor.isDragging()
}))(CustomDragLayer);
