import { isNumber } from 'util';
import { GameProps } from '../Game';
import { PileProps } from '../components/pile/Pile';
import { CardProps } from '../components/card/Card';

const CGE_DEBUG: boolean = true;

export interface MoveProps {
  from: string;
  to: string;
  amount?: number;
  card?: string;
  incomingRules?: string[];
}

export interface TableauState {
  piles: string[];
}

export interface PileState {
  cards: string[];
  showBack: boolean;
  unfolded: boolean;
  isShuffling: boolean;
  lastIncomingMoveValidity: boolean;
}

export interface CardState {
}

interface StringHash<T> {
  [key: string]: T;
}

export interface GameState {
  tableaux: StringHash<TableauState>;
  piles: StringHash<PileState>;
  allowInvalidMoves: boolean;
}

export class CardGameEngine {
  static getPileState(state: GameState, pileKey: string): PileState {
    if (state.piles.hasOwnProperty(pileKey)) {
      return state.piles[pileKey];
    }
    throw new Error('Pile ' + pileKey + ' not found!');
  }
}

export interface CardGameStateChanger {
  isValid(state: GameState): boolean;
  make(state: GameState): GameState;
}

function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

export class Shuffle implements CardGameStateChanger {
  private pile: string;

  constructor(pile: string) {
    this.pile = pile;
  }

  isValid(state: GameState): boolean {
    try {
      // check if pile can be found
      let myPile = CardGameEngine.getPileState(state, this.pile);

      // check if pile has cards and can be shuffled
      if (myPile.cards && myPile.cards.length > 0) {
        return true;
      } else {
        if (CGE_DEBUG) {
          console.error('Pile ' + this.pile + ' has no cards!');
        }
        return false;
      }
    } catch (e) {
      if (CGE_DEBUG) {
        console.error(e);
      }
      return false;
    }
  }

  animate(state: GameState): GameState {
    let newState = JSON.parse(JSON.stringify(state)); // clone old state

    let pileState = CardGameEngine.getPileState(newState, this.pile);

    pileState.isShuffling = true;

    return newState;
  }

  make(state: GameState): GameState {
    let newState = JSON.parse(JSON.stringify(state)); // clone old state

    let pileState = CardGameEngine.getPileState(newState, this.pile);

    pileState.isShuffling = false;
    pileState.cards = shuffle(pileState.cards);

    return newState;
  }
}

export class RuleContext {
  private state: GameState;
  private move: MoveProps;
  private props: GameProps;

  constructor(gameState: GameState, move: MoveProps, gameProps: GameProps) {
    this.state = gameState;
    this.move = move;
    this.props = gameProps;
  }

  // "move.cards.length === 1 && (move.target.cards.length === 0
  // || move.card(0).suit === 'wild'
  // || move.target.card('top').suit === 'wild'
  // || move.target.card('top').suit === move.card(0).suit
  // || move.target.card('top').rank === move.card(0).rank)"

  checkRule(rule: string): boolean {
    let preval = '"use strict"; ' +
      'var getCard = this.getCard.bind(this); ' +
      'var getPile = this.getPile.bind(this); ' +
      'var getStatePile = (function(p){return this.state.piles[p];}).bind(this); ' +
      'var getLast = function(a){return a[a.length-1];}; ' +
      'var card = this.move.card; ' +
      'var fromPile = getStatePile(this.move.from); ' +
      'var toPile = getStatePile(this.move.to); ' +
      'var move = this.move; ';
    /*
    if (this.move.amount === 1 && (
      this.state.piles[this.move.to].cards.length === 0 // is empty
      || this.getCard(this.move.card).suit === 'wild'
      || this.getCard(this.state.piles[this.move.to].cards[0]).suit === this.getCard(this.move.card).suit
      || this.getCard(this.state.piles[this.move.to].cards[0]).rank === this.getCard(this.move.card).rank
    )) {
      return true;
    }
    */
    return eval(preval + rule);
  }

  getPile(pileId?: string): PileProps {
    let pile = this.props.piles.find(pileItem => pileItem.id === pileId);
    if (!pile) {
      throw new Error('Pile ' + pileId + ' not found!');
    }
    return pile;
  }

  getCard(cardId?: string): CardProps {
    let card = this.props.cards.find(cardItem => cardItem.id === cardId);
    if (!card) {
      throw new Error('Card ' + cardId + ' not found!');
    }
    return card;
  }
}

export class Move implements CardGameStateChanger {
  private to: string;
  private from: string;
  private card: string = '';
  private amount: number = 0;
  private manual: boolean = true;
  private incomingRules: string[];
  private gameProps?: GameProps;

  constructor(
    fromPile: string,
    toPile: string,
    card: string|number,
    manual: boolean,
    incomingRules?: string[],
    gameProps?: GameProps
  ) {
    this.from = fromPile;
    this.to = toPile;
    if (isNumber(card)) {
      this.amount = card;
    } else {
      this.amount = 1;
      this.card = card;
    }
    this.manual = manual;
    this.incomingRules = incomingRules ? incomingRules : [];
    this.gameProps = gameProps;
  }

  isValid(state: GameState): boolean {
    console.log('checking if move is valid');
    try {
      // check if piles can be found
      let fromPile = CardGameEngine.getPileState(state, this.from);
      // let toPile = CardGameEngine.getPileState(state, this.to);

      // check if this is an amount-move or a card-move
      if (this.amount <= 0 && this.card === '') {
        if (CGE_DEBUG) {
          console.error('Move has no card :(');
        }
        return false; // can not decide
      }

      // if this is an amount-move
      if (this.amount === 1 && this.card) {

        // check if source pile has the card
        if (fromPile.cards.indexOf(this.card) === -1) {
          if (CGE_DEBUG) {
            console.error('FromPile ' + this.from + ' does not have a card ' + this.card);
          }
          return false;
        }

        // check if the target pile does not have the card
        /*
        if (toPile.cards.indexOf(this.card) >= 0) {
          if (CGE_DEBUG) {
            console.error('ToPile ' + this.to + ' does already have a card ' + this.card);
          }
          return false;
        }
        */
      } else {
        // check if there are enough cards
        if (fromPile.cards.length < this.amount) {
          if (CGE_DEBUG) {
            console.error('FromPile ' + this.from + ' does does not have enough card to move ' + this.amount);
          }
          return false;
        }
      }

      console.log(this.manual, this.gameProps, this.incomingRules);
      if (this.manual && this.gameProps && this.incomingRules.length > 0) {
        let rc = new RuleContext(
          state,
          {
            from: this.from,
            to: this.to,
            amount: this.amount,
            card: this.card
          },
          this.gameProps
        );

        return this.incomingRules
          .map(rule => rc.checkRule(rule))
          .every(v => v === true);
      }

      return true;
    } catch (e) {
      if (CGE_DEBUG) {
        console.error(e);
      }
      return false;
    }
  }

  make(state: GameState): GameState {
    // clone state
    let newState = JSON.parse(JSON.stringify(state));

    // make card move
    if (this.amount === 1 && this.card !== '') {
      newState.piles[this.from].cards.splice(
        newState.piles[this.from].cards.indexOf(this.card),
        1
      );
      newState.piles[this.to].cards.push(this.card);
    } else {
      // make amount move
      let cards = newState.piles[this.from].cards.splice(
        newState.piles[this.from].cards.length - this.amount,
        this.amount
      );
      newState.piles[this.to].cards = [...newState.piles[this.to].cards, ...cards];
    }

    return newState;
  }
}
