from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime 
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

SQLALCHEMY_DATABASE_URI = 'sqlite:///words.db'

engine = create_engine(SQLALCHEMY_DATABASE_URI)

Base = declarative_base()

class Word(Base):
    __tablename__ = 'words'
    id = Column(Integer, primary_key=True, index=True)
    word = Column(String(100), unique=True, index=True)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    times_shown = Column(Integer, default==0) 

    @property
    def win_rate(self):
        if self.losses == 0: 
            return 1.0
        return self.wins / (self.wins + self.losses)


class Vote(Base): 
    __tablename__ = 'votes'
    id = Column(Integer, primary_key=True, index=True)
    winner_id = Column(Integer) 
    loser_id = Column(Integer)

Base.metadata.create_all(bind=engine)
