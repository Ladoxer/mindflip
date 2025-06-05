import { Component, OnInit } from '@angular/core';
import { Card } from '../../models/card.model';
import { v4 as uuid } from 'uuid';
import { LocalStorageService } from '../../services/local-storage.service';
import { CommonModule } from '@angular/common';


@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {
  cards: Card[] = [];
  flippedCards: Card[] = [];
  matchCount = 0;
  totalFlips = 0;
  emojis = ['🐶', '🐱', '🦊', '🐻', '🐼', '🦁', '🐷', '🐸'];

  constructor(private storage: LocalStorageService) {}

  ngOnInit() {
    this.initGame();
  }

  initGame() {
    const deck = [...this.emojis, ...this.emojis].map(content => ({
      id: uuid(),
      content,
      flipped: false,
      matched: false
    }));

    this.cards = deck.sort(() => Math.random() - 0.5);
    this.matchCount = 0;
    this.totalFlips = 0;
  }

  onCardClick(card: Card) {
    if (card.flipped || card.matched || this.flippedCards.length === 2) return;

    card.flipped = true;
    this.flippedCards.push(card);
    this.totalFlips++;

    if (this.flippedCards.length === 2) {
      setTimeout(() => this.checkMatch(), 800);
    }
  }

  checkMatch() {
    const [a, b] = this.flippedCards;

    if (a.content === b.content) {
      a.matched = b.matched = true;
      this.matchCount++;
    } else {
      a.flipped = b.flipped = false;
    }

    this.flippedCards = [];

    if (this.matchCount === this.emojis.length) {
      this.storage.set('mindflip-highscore', this.totalFlips);
      alert('🎉 You matched all cards in ' + this.totalFlips + ' flips!');
    }
  }

  restart() {
    this.initGame();
  }
}