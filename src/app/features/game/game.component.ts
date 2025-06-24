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
  
  // Victory modal
  showVictory = false;
  finalScore = 0;
  clickCooldown = false;
  cooldownTime = 300; // milliseconds for rapid click detection
  penaltyActive = false;
  penaltyTimeLeft = 0;
  penaltyTimer: any;
  rapidClickCount = 0;
  lastClickTime = 0;
  comboStreak = 0;
  
  // Keep emojis private in the component
  emojis = ['🐶', '🐱', '🦊', '🐻', '🐼', '🦁', '🐷', '🐸']; // Made public for template
  private emojiMap: Map<number, string> = new Map();

  constructor(private storage: LocalStorageService) {}

  ngOnInit() {
    this.initGame();
  }

  initGame() {
    this.createEmojiMapping();
    
    const indices = [];
    for (let i = 0; i < this.emojis.length; i++) {
      indices.push(i, i);
    }
    
    const shuffledIndices = indices.sort(() => Math.random() - 0.5);
    
    this.cards = shuffledIndices.map(index => ({
      id: uuid(),
      contentIndex: index,
      flipped: false,
      matched: false
    }));
    
    this.matchCount = 0;
    this.totalFlips = 0;
    this.flippedCards = [];
    this.rapidClickCount = 0;
    this.comboStreak = 0;
    this.clearPenalty();
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
    // Check if penalty is active
    if (this.penaltyActive) {
      return;
    }

    // Don't allow clicking already flipped or matched cards
    if (card.flipped || card.matched) return;
    
    // Only allow 2 cards to be flipped at once
    if (this.flippedCards.length >= 2) return;

    // Check for rapid clicking for penalty system
    const currentTime = Date.now();
    const timeSinceLastClick = currentTime - this.lastClickTime;
    
    if (timeSinceLastClick < 300) { // 300ms threshold for rapid clicks
      this.rapidClickCount++;
      
      // Trigger penalty after 3 rapid clicks
      if (this.rapidClickCount >= 3) {
        this.activatePenalty();
        return;
      }
    } else {
      // Reset rapid click count if enough time has passed
      this.rapidClickCount = Math.max(0, this.rapidClickCount - 1);
    }
    
    this.lastClickTime = currentTime;

    // Flip the card
    card.flipped = true;
    this.flippedCards.push(card);
    this.totalFlips++;

    // Check for match when 2 cards are flipped
    if (this.flippedCards.length === 2) {
      // Delay check to allow users to see the cards
      setTimeout(() => this.checkMatch(), 1000);
    }
  }

  private activatePenalty() {
    this.penaltyActive = true;
    this.penaltyTimeLeft = 3; // 3 second penalty
    this.rapidClickCount = 0;
    this.comboStreak = 0; // Reset combo on penalty
    
    // Flip back any currently flipped cards
    this.flippedCards.forEach(card => card.flipped = false);
    this.flippedCards = [];
    
    this.penaltyTimer = setInterval(() => {
      this.penaltyTimeLeft--;
      if (this.penaltyTimeLeft <= 0) {
        this.clearPenalty();
      }
    }, 1000);
  }

  private clearPenalty() {
    this.penaltyActive = false;
    this.penaltyTimeLeft = 0;
    if (this.penaltyTimer) {
      clearInterval(this.penaltyTimer);
      this.penaltyTimer = null;
    }
  }

  private showPenaltyWarning() {
    // Visual feedback handled by template
  }

  checkMatch() {
    const [a, b] = this.flippedCards;

    if (a.contentIndex === b.contentIndex) {
      a.matched = b.matched = true;
      this.matchCount++;
      this.comboStreak++;
      
      // Reduce cooldown time for successful matches (reward good play)
      if (this.comboStreak > 2) {
        this.cooldownTime = Math.max(200, this.cooldownTime - 20);
      }
    } else {
      a.flipped = b.flipped = false;
      this.comboStreak = 0;
      // Reset cooldown time on mismatch
      this.cooldownTime = 300;
    }

    this.flippedCards = [];

    if (this.matchCount === this.emojis.length) {
      const score = this.calculateScore();
      this.storage.set('mindflip-highscore', score);
      // alert(`🎉 You won! Score: ${score} (Flips: ${this.totalFlips}, Combo: ${this.comboStreak})`);
      this.showVictory = true;
      this.finalScore = score;
    }
  }

  private calculateScore() {
    // Higher score is better: fewer flips + combo bonus
    const baseScore = Math.max(1000 - (this.totalFlips * 10), 0);
    const comboBonus = this.comboStreak * 50;
    return baseScore + comboBonus;
  }

  restart() {
    this.clearPenalty();
    this.showVictory = false;
    this.initGame();
  }

  ngOnDestroy() {
    this.clearPenalty();
  }
}