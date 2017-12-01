import * as React from 'react';
import './App.css';
import { default as Tableau, TableauProps } from './components/tableau/Tableau';
import { default as Card, CardProps } from './components/card/Card';
import { default as Pile, PileProps } from './components/pile/Pile';
import {
  GameState, Move, PileState,
  TableauState, MoveProps, Shuffle
} from './gamelib/CardGameEngine';
// import HTML5Backend from 'react-dnd-html5-backend';
import TouchBackend from 'react-dnd-touch-backend';
import { DragDropContext } from 'react-dnd';
import ItemPreview from './components/common/ItemPreview';
import './assets/uno.css';

// const logo = require('./logo.svg');
const gameState = require('./assets/state.json');

export interface GameProps {
  piles: PileProps[];
  tableaux: TableauProps[];
  cards: CardProps[];
  initialMoves: MoveProps[];
}

class App extends React.Component<GameProps, GameState> {

  constructor(props: GameProps) {
    super(props);
    this.state = JSON.parse(JSON.stringify(gameState));
  }

  restart() {
    this.setState(prevState => JSON.parse(JSON.stringify(gameState)));
  }

  initialMoves() {
    if (this.props.initialMoves) {
      this.props.initialMoves.forEach(move => {
        let moveSubject = move.amount && move.amount > 0 ? move.amount : (move.card ? move.card : 0);
        let m = new Move(
          move.from,
          move.to,
          moveSubject,
          false // automatic move, no rule checking
        );
        if (m.isValid(this.state)) {
          // multiple state changes are pushed in here
          this.setState(prevState => m.make(prevState));
        }
      });
    }
  }

  initialShuffle() {
    if (this.props.piles) {
      this.props.piles.forEach(pileProps => {
        if (pileProps.initialShuffle) {
          let shuffle = new Shuffle(pileProps.id);
          if (shuffle.isValid(this.state)) {
            // multiple state changes are pushed in here
            this.setState(prevState => shuffle.make(prevState));
          }
        }
      });
    }
  }

  render() {
    let tableaux: JSX.Element[] = [];
    this.props.tableaux.forEach(tableauProps => {
      let piles = this.renderPiles(tableauProps.id);
      let newProps = {...tableauProps, ...{key: tableauProps.id}};
      tableaux.push(
        <Tableau {...newProps}>
          {piles}
        </Tableau>
      );
    });
    return (
      <div>
        <nav>
          <ul>
            <li><button onClick={() => this.initialShuffle()}>shuffle</button></li>
            <li><button onClick={() => this.initialMoves()}>deal</button></li>
            <li><button onClick={() => this.restart()}>restart</button></li>
          </ul>
        </nav>
        {tableaux}
        <ItemPreview key="__preview" />
      </div>
    );
  }

  renderPiles(tableauKey: string) {
    let piles: JSX.Element[] = [];
    if (this.state.tableaux.hasOwnProperty(tableauKey)) {
      let tabState: TableauState = this.state.tableaux[tableauKey];

      tabState.piles.forEach(pileKey => {
        const pileProps = this.props.piles.find(cPileProps => cPileProps.id === pileKey);
        if (pileProps) {
          pileProps.makeMove = this.makeMove.bind(this);
          let newProps = {...pileProps, ...{key: pileProps.id}};
          let cards = this.renderCards(pileKey);
          piles.push(
            <Pile {...newProps}>
              {cards}
            </Pile>
          );
        }
      });
    }
    return piles;
  }

  makeMove(moveProps: MoveProps): void {
    let moveSubject = moveProps.amount && moveProps.amount > 0 ?
      moveProps.amount :
      (moveProps.card ? moveProps.card : 0);
    let m = new Move(
      moveProps.from,
      moveProps.to,
      moveSubject,
      true,
      moveProps.incomingRules,
      this.props
    );

    if (!m.isValid(this.state)) {
      return;
    }

    this.setState(prevState => m.make(prevState));
  }

  renderCards(pileKey: string) {
    let cards: JSX.Element[] = [];
    if (this.state.piles.hasOwnProperty(pileKey)) {
      let pileState: PileState = this.state.piles[pileKey];

      pileState.cards.forEach(cardKey => {
        const cardProps = this.props.cards.find(cCardProps => cCardProps.id === cardKey);
        if (cardProps) {
          cardProps.parentPile = pileKey;
          let newProps = {...cardProps, ...{ key: cardProps.id }};
          cards.push(
            <Card {...newProps} />
          );
        }
      });
    }
    return cards;
  }
}

export default DragDropContext(TouchBackend)(App);
