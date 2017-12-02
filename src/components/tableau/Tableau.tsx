import * as React from 'react';
import { TableauState } from '../../lib/CardGameEngine';
import './Tableau.css';

export interface TableauProps {
  id: string;
  name: string;
  css?: React.CSSProperties;
}

class Tableau extends React.Component<TableauProps, TableauState> {
  render() {
    return (
      <div className={'tableau ' + this.props.id} style={this.props.css}>
        <span>{this.props.name}</span>
        {this.props.children}
      </div>
    );
  }
}

export default Tableau;
