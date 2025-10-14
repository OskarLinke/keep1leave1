from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import create_engine 
from sqlalchemy.orm import sessionmaker

import random 

from models import Word, Vote, Base, engine 

from pydantic import BaseModel 

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI(title="K1L1 API") 

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class WordPair(BaseModel):
    word1: str
    word1_id: int
    word2: str
    word2_id: int

class VoteRequest(BaseModel):
    winner_id: int
    loser_id: int

@app.get("/")
def read_root():
    return {"message": "K1L1 API"}

@app.get("/api/word-pair", response_model=WordPair)
def get_word_pair(db: Session = Depends(get_db)):
    """Get two random words to compare"""
    words = db.query(Word).all()
    
    if len(words) < 2:
        # If we don't have enough words, return some defaults
        return WordPair(
            word1="fish", word1_id=1,
            word2="whales", word2_id=2
        )
    
    word1, word2 = random.sample(words, 2)

    # Update times shown
    word1.times_shown += 1
    word2.times_shown += 1
    db.commit()

    return WordPair(
            word1=word1.word, word1_id=word1.id,
            word2=word2.word, word2_id=word2.id
            )

@app.post("/api/vote") 
def submit_vote(vote: VoteRequest, db: Session = Depends(get_db)):
    """Submit a vote"""
    # Update word statistics
    winner = db.query(Word).filter(Word.id == vote.winner_id).first()
    loser = db.query(Word).filter(Word.id == vote.loser_id).first()
    
    if not winner or not loser:
        raise HTTPException(status_code=404, detail="Word not found")
    
    winner.wins += 1
    loser.losses += 1
    
    # Record the vote
    vote_record = Vote(winner_id=vote.winner_id, loser_id=vote.loser_id)
    db.add(vote_record)
    db.commit()
    
    return {"message": "Vote recorded", "winner": winner.word, "loser": loser.word}

@app.get("/api/rankings")
def get_rankings(db: Session = Depends(get_db)):
    """Get all words sorted by their ratio"""
    words = db.query(Word).all()
    
    # Sort by ratio (highest first), then by wins
    ranked_words = sorted(
        words, 
        key=lambda w: (w.win_rate, w.wins), 
        reverse=True
    )
    
    return [
        {
            "word": word.word,
            "wins": word.wins,
            "losses": word.losses,
            "ratio": word.win_rate,
            "times_shown": word.times_shown
        }
        for word in ranked_words
    ]

@app.get("/api/seed")
def seed_database(db: Session = Depends(get_db)):
    """Seed the database with some initial words"""
    initial_words = [
        "water", "fire", "mud", "oxygen", "paintings",
        "candy", "trees", "mountains", "swimming pools", "river", "smart phones",
        "computers", "books", "music", "chess", "tofu", "rice", "pasta", "bread", "potatoes", "whales", "fish"
    ]
    
    added_count = 0
    for word_text in initial_words:
        # Check if word already exists
        existing = db.query(Word).filter(Word.word == word_text).first()
        if not existing:
            word = Word(word=word_text)
            db.add(word)
            added_count += 1
    
    db.commit()
    return {"message": f"Added {added_count} new words to database"}
