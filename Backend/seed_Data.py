# seed_data.py
from sqlalchemy.orm import Session
from database import engine, Base, SessionLocal
from models import Movie

# Tạo bảng
Base.metadata.create_all(bind=engine)

movies_sample = [
    # Nhóm phim của Christopher Nolan (Test trùng đạo diễn)
    Movie(
        title="Inception",
        year=2010,
        country="Mỹ",
        avg_rating=8.8,
        description="Kẻ trộm xâm nhập giấc mơ để đánh cắp bí mật.",
        genre_name="Hành động, Viễn tưởng",
        director_name="Christopher Nolan",
        celebs="Leonardo DiCaprio, Joseph Gordon-Levitt"
    ),
    Movie(
        title="Interstellar",
        year=2014,
        country="Mỹ",
        avg_rating=8.6,
        description="Nhóm phi hành gia đi xuyên hố đen tìm hành tinh mới.",
        genre_name="Khoa học viễn tưởng",
        director_name="Christopher Nolan",
        celebs="Matthew McConaughey, Anne Hathaway"
    ),
    Movie(
        title="The Dark Knight",
        year=2008,
        country="Mỹ",
        avg_rating=9.0,
        description="Batman đối đầu với Joker bảo vệ Gotham.",
        genre_name="Hành động, Kịch tính",
        director_name="Christopher Nolan",
        celebs="Christian Bale, Heath Ledger"
    ),
    # Nhóm phim cùng năm 2014 (Test trùng năm)
    Movie(
        title="John Wick",
        year=2014,
        country="Mỹ",
        avg_rating=7.4,
        description="Sát thủ giải nghệ trả thù cho chú chó của mình.",
        genre_name="Hành động",
        director_name="Chad Stahelski",
        celebs="Keanu Reeves"
    ),
    # Nhóm phim Việt Nam (Test quốc gia)
    Movie(
        title="Bố Già",
        year=2021,
        country="Việt Nam",
        avg_rating=7.0,
        description="Câu chuyện về tình cha con ở một xóm lao động nghèo.",
        genre_name="Tâm lý, Gia đình",
        director_name="Trấn Thành, Vũ Ngọc Đãng",
        celebs="Trấn Thành, Tuấn Trần"
    ),
    # Nhóm phim cùng năm 2010 (Test trùng năm với Inception)
    Movie(
        title="Đảo Kinh Hoàng",
        year=2010,
        country="Mỹ",
        avg_rating=8.2,
        description="Hai đặc vụ điều tra sự mất tích của một bệnh nhân tâm thần.",
        genre_name="Giật gân, Tâm lý",
        director_name="Martin Scorsese",
        celebs="Leonardo DiCaprio, Mark Ruffalo"
    )
]

def seed():
    db: Session = SessionLocal()
    # Xóa sạch dữ liệu cũ trong bảng Movie trước khi nạp mới
    db.query(Movie).delete() 
    for m in movies_sample:
        db.add(m)
    db.commit()
    db.close()
    print("Thanhcong!")

if __name__ == "__main__":
    seed()
