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
  styleUrls: ['./game.component.scss'],
})
export class GameComponent implements OnInit {
  cards: Card[] = [];
  flippedCards: Card[] = [];
  matchCount = 0;
  totalFlips = 0;
  emojis = ['🐶', '🐱', '🦊', '🐻', '🐼', '🦁', '🐷', '🐸'];
  private emojiMap: Map<number, string> = new Map();

  constructor(private storage: LocalStorageService) {}

  ngOnInit() {
    this.initGame();
  }

  initGame() {
    this.createEmojiMapping();

    // Create pairs of indices (0-7, 0-7)
    const indices = [];
    for (let i = 0; i < this.emojis.length; i++) {
      indices.push(i, i);
    }

    // Shuffle and create cards with indices only
    const shuffledIndices = indices.sort(() => Math.random() - 0.5);

    this.cards = shuffledIndices.map((index) => ({
      id: uuid(),
      contentIndex: index,
      flipped: false,
      matched: false,
    }));

    this.matchCount = 0;
    this.totalFlips = 0;
    this.flippedCards = [];
  }

  private createEmojiMapping() {
    const shuffledEmojis = [...this.emojis].sort(() => Math.random() - 0.5);
    this.emojiMap.clear();
    shuffledEmojis.forEach((emoji, index) => {
      this.emojiMap.set(index, emoji);
    });
  }

  getCardContent(card: Card): string {
    if (!card.flipped && !card.matched) {
      return '❓';
    }
    return this.emojiMap.get(card.contentIndex) || '❓';
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

    if (a.contentIndex === b.contentIndex) {
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
