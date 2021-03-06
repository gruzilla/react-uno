import * as React from 'react';
import { default as Tableau, TableauProps } from './components/tableau/Tableau';
import {
  default as Card, CardProps,
  CardDragProps
} from './components/card/Card';
import { default as Pile, PileProps } from './components/pile/Pile';
import {
  GameState, Move, PileState,
  TableauState, MoveProps, Shuffle, CardGameEngine
} from './lib/CardGameEngine';
// import HTML5Backend from 'react-dnd-html5-backend';
// import TouchBackend from 'react-dnd-touch-backend';
import { default as MultiBackend, Preview } from 'react-dnd-multi-backend';
import HTML5toTouch from 'react-dnd-multi-backend/lib/HTML5toTouch'; // or any other pipeline
import { DragDropContext } from 'react-dnd';
// import ItemPreview from './components/lib/ItemPreview';
import './assets/uno.css';
import ItemTypes from './lib/ItemTypes';

// const logo = require('./logo.svg');
const gameState = require('./assets/state.json');
gameState.allowInvalidMoves = false;

export interface GameProps {
  piles: PileProps[];
  tableaux: TableauProps[];
  cards: CardProps[];
  initialMoves: MoveProps[];
}

class Game extends React.Component<GameProps, GameState> {
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
            console.log('setState');
            this.setState(prevState => shuffle.animate(prevState));
            window.setTimeout(
              () => {
                this.setState(prevState => shuffle.make(prevState));
              },
              1000
            );
          }
        }
      });
    }
  }

  toggleInvalidMoves() {
    this.setState(prevState => {
      let newState = JSON.parse(JSON.stringify(prevState));
      newState.allowInvalidMoves = !prevState.allowInvalidMoves;
      return newState;
    });
  }

  render() {
    let tableaux: JSX.Element[] = [];
    this.props.tableaux.forEach(tableauProps => {
      let piles = this.renderPiles(tableauProps.id);
      tableaux.push(
        <Tableau key={tableauProps.id} {...tableauProps}>
          {piles}
        </Tableau>
      );
    });
    return (
      <div>
        <nav>
          <ul>
            <li><button onClick={() => this.initialShuffle()}><span>1</span> shuffle</button></li>
            <li><button onClick={() => this.initialMoves()}><span>2</span> deal</button></li>
            <li><button onClick={() => this.restart()} className="restart">restart</button></li>
            <li><input
              name="allowInvalidMoves"
              type="checkbox"
              checked={this.state.allowInvalidMoves}
              onChange={() => this.toggleInvalidMoves()}
            />allow invalid moves</li>
          </ul>
        </nav>
        {tableaux}
        <Preview generator={generatePreview} />
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
          let pileState = CardGameEngine.getPileState(this.state, pileProps.id);
          let cards = this.renderCards(pileKey);
          piles.push(
            <Pile
              key={pileProps.id}
              allowInvalidMoves={this.state.allowInvalidMoves}
              getGameState={() => this.state}
              getGameProps={() => this.props}
              lastIncomingMoveValidity={pileState.lastIncomingMoveValidity}
              {...pileProps}
            >
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

    this.setState(prevState => {
      let isValid: boolean = m.isValid(prevState);
      let newState = m.make(prevState);
      let ps = CardGameEngine.getPileState(newState, moveProps.to);
      ps.lastIncomingMoveValidity = isValid;
      return newState;
    });

    // clean lastIncomingMove after 1 sec
    window.setTimeout(
      () => {
        this.setState(prevState => {
          let newState: GameState = JSON.parse(JSON.stringify(prevState));
          Object.keys(newState.piles).forEach(pileId => newState.piles[pileId].lastIncomingMoveValidity = true);
          return newState;
        });
      },
      1000
    );
  }

  renderCards(pileKey: string) {
    let cards: JSX.Element[] = [];
    if (this.state.piles.hasOwnProperty(pileKey)) {
      let pileState: PileState = this.state.piles[pileKey];

      pileState.cards.forEach(cardKey => {
        const cardProps = this.props.cards.find(cCardProps => cCardProps.id === cardKey);
        if (cardProps) {
          cardProps.parentPile = pileKey;
          if (pileState.isShuffling) {
            cardProps.animationName = 'shuffle';
          } else {
            cardProps.animationName = 'none';
          }
          cards.push(
            <Card key={cardProps.id} {...cardProps} />
          );
        }
      });
    }
    return cards;
  }
}

/* helper functions */

function generatePreview(type: ItemTypes, item: {}, style: React.CSSProperties) {
  if (type === ItemTypes.CARD) {
    const cardProps: CardDragProps = item as CardDragProps;

    const url = cardProps ? cardProps.previewUrl : '';

    return (
      <div
        className={'card is-flying ' + cardProps.cardId}
        style={style}
      >
        <img src={url} />
      </div>
    );
  }

  return <div />;
}

export default DragDropContext(MultiBackend(HTML5toTouch))(Game);
