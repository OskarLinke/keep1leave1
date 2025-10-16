from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import create_engine 
from sqlalchemy.orm import sessionmaker

import random 

from models import Word, Vote, Base, engine 

from pydantic import BaseModel

from typing import Optional

# ADD CORS IMPORTS
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="K1L1 API") 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

losers_id_list = []

class VoteResponse(BaseModel):
    message: str
    winner: str
    loser: str
    next_opponent: Optional[dict] = None

class NextOpponent(BaseModel):
    word: str
    word_id: int

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


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

@app.get("/api/next-opponent", response_model = NextOpponent) 
def get_next_opponent(winner_id: int, loser_id: int, db: Session = Depends(get_db)):

    """Get a word from the bottom 10 with win rate higher than the loser"""
   
    

    losers_id_list.append(loser_id)
    print("losers_id_list", losers_id_list)
    winner = db.query(Word).filter(Word.id == winner_id).first()
    loser = db.query(Word).filter(Word.id == loser_id).first()

    if not winner or not loser:
        return None
    
    # Get all words except the winner, sorted by win rate (lowest first)
    all_words = db.query(Word).filter(Word.id != winner_id).all()
    
    # Sort by win rate (lowest first) to get the bottom words
    sorted_words = sorted(all_words, key=lambda w: w.win_rate)

    # Filter for words with win rate higher than the loser
    better_than_loser = [w for w in sorted_words if w.win_rate > loser.win_rate]
    
    if not better_than_loser:
        return None  # No words with higher win rate than the loser
    
    # Take the bottom 10 from the words that are better than the loser
    bottom_better_words = better_than_loser[:10]

    #filter out words in losers_id_list
    bottom_better_words = [w for w in bottom_better_words if w.id not in losers_id_list]
    
    if bottom_better_words:
        word = random.choice(bottom_better_words)
        return NextOpponent(word = word.word, word_id = word.id)
    return None

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
    
    # For the initial pair, get two from the bottom 10 by win rate
    sorted_words = sorted(words, key=lambda w: w.win_rate)
    low_rated_words = sorted_words[:10]
    
    if len(low_rated_words) >= 2:
        word1, word2 = random.sample(low_rated_words, 2)
    else:
        # Fallback if we don't have 10 words yet
        word1, word2 = random.sample(words, 2)

    db.commit()

    return WordPair(
            word1=word1.word, word1_id=word1.id,
            word2=word2.word, word2_id=word2.id
            )

@app.post("/api/vote", response_model=VoteResponse)
def submit_vote(vote: VoteRequest, db: Session = Depends(get_db)):
    """Submit a vote and get the next word pair with the winner facing a better opponent"""
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
    

    
    
        
    return {
            "message": "Vote recorded", 
            "winner": winner.word,
            "loser": loser.word,
            }
  


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
            "win_rate": word.win_rate,
            "times_shown": word.times_shown
        }
        for word in ranked_words
    ]

@app.get("/api/seed")
def seed_database(db: Session = Depends(get_db)):
    """Seed the database with some initial words"""
    initial_words = [
        "mud" , "paintings", "bicycles", "cars", "boats", "trains", "planes", "airplanes", "rockets", "helicopters",
        "firefighters", "police", "nurses", "coffee", "tea", "chocolate", "ice cream", "cake", "cookies", 
        "kebab", "apples", "oranges", "bananas", "grapes", "strawberries", "blueberries", "raspberries", "peaches",
        "avocados", "tomatoes", "cucumbers", "broccoli", "peppers", "onions", "garlic", "mushrooms", "lettuce", "salt", 
        "tigers" , "lions", "bears", "wolves", "foxes", "eagles", "snakes", "lizards", "dolphins", "sharks",
        "candy", "trees", "mountains", "swimming pools", "river", "smart phones",
        "computers", "books", "music", "chess", "tofu", "rice", "pasta", "bread", "potatoes", "whales", "fish", 
        "cats", "dogs", "mice", "geese", "ducks", "frogs", "turtles", "spiders", 
        "bees", "ants", "wasps", "beetles", "butterflies", "fireflies", "plant-based milk", "knitted sweaters", 
        "socks", "birkenstocks", "dishwashers", "TVs", "refrigerators", "wine", "beer", "roskilde festival"
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
