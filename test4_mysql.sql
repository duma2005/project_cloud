-- =========================================================
-- Converted for MySQL 8+ (InnoDB, utf8mb4)
-- =========================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

-- =========================================================
-- Auto-generated: Full schema + seed data for IMDb Top 20 movies
-- Notes:
-- - release_date is set to YYYY-01-01 (placeholder) because only year was available.
-- - duration_minutes / age_rating left NULL (you can update later).
-- =========================================================
DROP TABLE IF EXISTS movies;
DROP TABLE IF EXISTS watchlist;
DROP TABLE IF EXISTS movie_cast;
DROP TABLE IF EXISTS movie_genres;
DROP TABLE IF EXISTS persons;
DROP TABLE IF EXISTS genres;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS=1;

CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  role ENUM('user','admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT now()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE movies (
  movie_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) UNIQUE NOT NULL,
  release_date DATE,
  duration_minutes INT,
  age_rating VARCHAR(10),
  imdb_rank INT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE genres (
  genre_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE persons (
  person_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE movie_genres (
  movie_id INT NOT NULL REFERENCES movies(movie_id) ON DELETE CASCADE,
  genre_id INT NOT NULL REFERENCES genres(genre_id) ON DELETE RESTRICT,
  PRIMARY KEY (movie_id, genre_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE movie_cast (
  cast_id INT AUTO_INCREMENT PRIMARY KEY,
  movie_id INT NOT NULL REFERENCES movies(movie_id) ON DELETE CASCADE,
  person_id INT NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
  job VARCHAR(30) NOT NULL,
  character_name VARCHAR(255),
  billing_order INT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE watchlist (
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  movie_id INT NOT NULL REFERENCES movies(movie_id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (user_id, movie_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- =========================
-- Seed: movies (IMDb Top 20)
-- =========================
INSERT INTO movies (title, release_date, duration_minutes, age_rating, imdb_rank)
VALUES
  ('The Shawshank Redemption', '1994-01-01', 142, 'R', 1),
  ('The Godfather', '1972-01-01', 175, 'R', 2),
  ('The Dark Knight', '2008-01-01', 152, 'PG-13', 3),
  ('The Godfather Part II', '1974-01-01', 202, 'R', 4),
  ('12 Angry Men', '1957-01-01', 96, 'Approved', 5),
  ('The Lord of the Rings: The Return of the King', '2003-01-01', 201, 'PG-13', 6),
  ('Schindler''s List', '1993-01-01', 195, 'R', 7),
  ('The Lord of the Rings: The Fellowship of the Ring', '2001-01-01', 178, 'PG-13', 8),
  ('Pulp Fiction', '1994-01-01', 154, 'R', 9),
  ('The Good, the Bad and the Ugly', '1966-01-01', 178, 'R', 10),
  ('Forrest Gump', '1994-01-01', 142, 'PG-13', 11),
  ('The Lord of the Rings: The Two Towers', '2002-01-01', 179, 'PG-13', 12),
  ('Fight Club', '1999-01-01', 139, 'R', 13),
  ('Inception', '2010-01-01', 148, 'PG-13', 14),
  ('Star Wars: Episode V - The Empire Strikes Back', '1980-01-01', 124, 'PG',15),
  ('The Matrix', '1999-01-01', 136, 'R',16),
  ('Goodfellas', '1990-01-01', 145, 'R', 17),
  ('Interstellar', '2014-01-01', 169, 'PG-13', 18),
  ('One Flew Over the Cuckoo''s Nest', '1975-01-01', 133, 'R', 19),
  ('Se7en', '1995-01-01', 127, 'R', 20);

-- =========
-- Seed: genres
-- =========
INSERT IGNORE INTO genres (name) VALUES
  ('Action'),
  ('Adventure'),
  ('Biography'),
  ('Crime'),
  ('Drama'),
  ('Fantasy'),
  ('History'),
  ('Mystery'),
  ('Romance'),
  ('Sci-Fi'),
  ('Thriller'),
  ('War'),
  ('Western')
;

-- =========
-- Seed: persons (directors + top billed cast)
-- =========
INSERT IGNORE INTO persons (name) VALUES
  ('Aaron Eckhart'),
  ('Al Pacino'),
  ('Anne Hathaway'),
  ('Ben Kingsley'),
  ('Bob Gunton'),
  ('Brad Pitt'),
  ('Carrie Fisher'),
  ('Carrie-Anne Moss'),
  ('Christian Bale'),
  ('Christopher Nolan'),
  ('Clint Eastwood'),
  ('David Fincher'),
  ('Diane Keaton'),
  ('Edward Norton'),
  ('Eli Wallach'),
  ('Elijah Wood'),
  ('Elliot Page'),
  ('Francis Ford Coppola'),
  ('Frank Darabont'),
  ('Gary Sinise'),
  ('Harrison Ford'),
  ('Heath Ledger'),
  ('Helena Bonham Carter'),
  ('Henry Fonda'),
  ('Ian McKellen'),
  ('Irvin Kershner'),
  ('Jack Nicholson'),
  ('James Caan'),
  ('Jessica Chastain'),
  ('Joe Pesci'),
  ('John Travolta'),
  ('Joseph Gordon-Levitt'),
  ('Keanu Reeves'),
  ('Kevin Spacey'),
  ('Lana Wachowski'),
  ('Laurence Fishburne'),
  ('Lee J. Cobb'),
  ('Lee Van Cleef'),
  ('Leonardo DiCaprio'),
  ('Liam Neeson'),
  ('Lilly Wachowski'),
  ('Louise Fletcher'),
  ('Mark Hamill'),
  ('Marlon Brando'),
  ('Martin Balsam'),
  ('Martin Scorsese'),
  ('Matthew McConaughey'),
  ('Milos Forman'),
  ('Morgan Freeman'),
  ('Peter Jackson'),
  ('Quentin Tarantino'),
  ('Ralph Fiennes'),
  ('Ray Liotta'),
  ('Robert De Niro'),
  ('Robert Zemeckis'),
  ('Robin Wright'),
  ('Samuel L. Jackson'),
  ('Sean Astin'),
  ('Sergio Leone'),
  ('Sidney Lumet'),
  ('Steven Spielberg'),
  ('Tim Robbins'),
  ('Tom Hanks'),
  ('Uma Thurman'),
  ('Viggo Mortensen'),
  ('Will Sampson')
;

-- =================
-- Seed: movie_genres
-- =================
INSERT IGNORE INTO movie_genres(movie_id, genre_id)
SELECT m.movie_id, g.genre_id
FROM (
  SELECT 'The Shawshank Redemption' AS title, 'Drama' AS genre
  UNION ALL SELECT 'The Godfather', 'Crime'
  UNION ALL SELECT 'The Godfather', 'Drama'
  UNION ALL SELECT 'The Dark Knight', 'Action'
  UNION ALL SELECT 'The Dark Knight', 'Crime'
  UNION ALL SELECT 'The Dark Knight', 'Drama'
  UNION ALL SELECT 'The Dark Knight', 'Thriller'
  UNION ALL SELECT 'The Godfather Part II', 'Crime'
  UNION ALL SELECT 'The Godfather Part II', 'Drama'
  UNION ALL SELECT '12 Angry Men', 'Drama'
  UNION ALL SELECT 'Schindler''s List', 'Biography'
  UNION ALL SELECT 'Schindler''s List', 'Drama'
  UNION ALL SELECT 'Schindler''s List', 'History'
  UNION ALL SELECT 'Schindler''s List', 'War'
  UNION ALL SELECT 'The Lord of the Rings: The Return of the King', 'Adventure'
  UNION ALL SELECT 'The Lord of the Rings: The Return of the King', 'Fantasy'
  UNION ALL SELECT 'The Lord of the Rings: The Return of the King', 'Action'
  UNION ALL SELECT 'The Lord of the Rings: The Return of the King', 'Drama'
  UNION ALL SELECT 'The Lord of the Rings: The Fellowship of the Ring', 'Adventure'
  UNION ALL SELECT 'The Lord of the Rings: The Fellowship of the Ring', 'Fantasy'
  UNION ALL SELECT 'The Lord of the Rings: The Fellowship of the Ring', 'Action'
  UNION ALL SELECT 'Pulp Fiction', 'Crime'
  UNION ALL SELECT 'Pulp Fiction', 'Drama'
  UNION ALL SELECT 'The Good, the Bad and the Ugly', 'Western'
  UNION ALL SELECT 'The Good, the Bad and the Ugly', 'Adventure'
  UNION ALL SELECT 'Forrest Gump', 'Drama'
  UNION ALL SELECT 'Forrest Gump', 'Romance'
  UNION ALL SELECT 'The Lord of the Rings: The Two Towers', 'Adventure'
  UNION ALL SELECT 'The Lord of the Rings: The Two Towers', 'Fantasy'
  UNION ALL SELECT 'The Lord of the Rings: The Two Towers', 'Action'
  UNION ALL SELECT 'Fight Club', 'Drama'
  UNION ALL SELECT 'Fight Club', 'Thriller'
  UNION ALL SELECT 'Inception', 'Action'
  UNION ALL SELECT 'Inception', 'Sci-Fi'
  UNION ALL SELECT 'Inception', 'Thriller'
  UNION ALL SELECT 'Star Wars: Episode V - The Empire Strikes Back', 'Action'
  UNION ALL SELECT 'Star Wars: Episode V - The Empire Strikes Back', 'Adventure'
  UNION ALL SELECT 'Star Wars: Episode V - The Empire Strikes Back', 'Sci-Fi'
  UNION ALL SELECT 'The Matrix', 'Action'
  UNION ALL SELECT 'The Matrix', 'Sci-Fi'
  UNION ALL SELECT 'Goodfellas', 'Biography'
  UNION ALL SELECT 'Goodfellas', 'Crime'
  UNION ALL SELECT 'Goodfellas', 'Drama'
  UNION ALL SELECT 'Interstellar', 'Adventure'
  UNION ALL SELECT 'Interstellar', 'Drama'
  UNION ALL SELECT 'Interstellar', 'Sci-Fi'
  UNION ALL SELECT 'One Flew Over the Cuckoo''s Nest', 'Drama'
  UNION ALL SELECT 'Se7en', 'Crime'
  UNION ALL SELECT 'Se7en', 'Drama'
  UNION ALL SELECT 'Se7en', 'Mystery'
  UNION ALL SELECT 'Se7en', 'Thriller'
) AS v(title, genre)
JOIN movies m ON m.title = v.title
JOIN genres g ON g.name = v.genre


-- ================
-- Seed: movie_cast
-- ================
INSERT IGNORE INTO movie_cast(movie_id, person_id, job, character_name, billing_order)
SELECT m.movie_id, p.person_id, v.job, v.character_name, v.billing_order
FROM (
  SELECT 'The Shawshank Redemption' AS title, 'Frank Darabont' AS person, 'director' AS job, NULL AS character_name, NULL AS billing_order
  UNION ALL SELECT 'The Godfather', 'Francis Ford Coppola', 'director', NULL, NULL
  UNION ALL SELECT 'The Dark Knight', 'Christopher Nolan', 'director', NULL, NULL
  UNION ALL SELECT 'The Godfather Part II', 'Francis Ford Coppola', 'director', NULL, NULL
  UNION ALL SELECT '12 Angry Men', 'Sidney Lumet', 'director', NULL, NULL
  UNION ALL SELECT 'Schindler''s List', 'Steven Spielberg', 'director', NULL, NULL
  UNION ALL SELECT 'The Lord of the Rings: The Return of the King', 'Peter Jackson', 'director', NULL, NULL
  UNION ALL SELECT 'The Lord of the Rings: The Fellowship of the Ring', 'Peter Jackson', 'director', NULL, NULL
  UNION ALL SELECT 'Pulp Fiction', 'Quentin Tarantino', 'director', NULL, NULL
  UNION ALL SELECT 'The Good, the Bad and the Ugly', 'Sergio Leone', 'director', NULL, NULL
  UNION ALL SELECT 'Forrest Gump', 'Robert Zemeckis', 'director', NULL, NULL
  UNION ALL SELECT 'The Lord of the Rings: The Two Towers', 'Peter Jackson', 'director', NULL, NULL
  UNION ALL SELECT 'Fight Club', 'David Fincher', 'director', NULL, NULL
  UNION ALL SELECT 'Inception', 'Christopher Nolan', 'director', NULL, NULL
  UNION ALL SELECT 'Star Wars: Episode V - The Empire Strikes Back', 'Irvin Kershner', 'director', NULL, NULL
  UNION ALL SELECT 'The Matrix', 'Lana Wachowski', 'director', NULL, NULL
  UNION ALL SELECT 'The Matrix', 'Lilly Wachowski', 'director', NULL, NULL
  UNION ALL SELECT 'Goodfellas', 'Martin Scorsese', 'director', NULL, NULL
  UNION ALL SELECT 'Interstellar', 'Christopher Nolan', 'director', NULL, NULL
  UNION ALL SELECT 'One Flew Over the Cuckoo''s Nest', 'Milos Forman', 'director', NULL, NULL
  UNION ALL SELECT 'Se7en', 'David Fincher', 'director', NULL, NULL
  UNION ALL SELECT 'The Shawshank Redemption', 'Tim Robbins', 'actor', 'Andy Dufresne', 1
  UNION ALL SELECT 'The Shawshank Redemption', 'Morgan Freeman', 'actor', 'Ellis "Red" Redding', 2
  UNION ALL SELECT 'The Shawshank Redemption', 'Bob Gunton', 'actor', 'Warden Norton', 3
  UNION ALL SELECT 'The Godfather', 'Marlon Brando', 'actor', 'Vito Corleone', 1
  UNION ALL SELECT 'The Godfather', 'Al Pacino', 'actor', 'Michael Corleone', 2
  UNION ALL SELECT 'The Godfather', 'James Caan', 'actor', 'Sonny Corleone', 3
  UNION ALL SELECT 'The Dark Knight', 'Christian Bale', 'actor', 'Bruce Wayne / Batman', 1
  UNION ALL SELECT 'The Dark Knight', 'Heath Ledger', 'actor', 'Joker', 2
  UNION ALL SELECT 'The Dark Knight', 'Aaron Eckhart', 'actor', 'Harvey Dent', 3
  UNION ALL SELECT 'The Godfather Part II', 'Al Pacino', 'actor', 'Michael Corleone', 1
  UNION ALL SELECT 'The Godfather Part II', 'Robert De Niro', 'actor', 'Vito Corleone', 2
  UNION ALL SELECT 'The Godfather Part II', 'Diane Keaton', 'actor', 'Kay Adams', 3
  UNION ALL SELECT '12 Angry Men', 'Henry Fonda', 'actor', 'Juror 8', 1
  UNION ALL SELECT '12 Angry Men', 'Lee J. Cobb', 'actor', 'Juror 3', 2
  UNION ALL SELECT '12 Angry Men', 'Martin Balsam', 'actor', 'Juror 1', 3
  UNION ALL SELECT 'Schindler''s List', 'Liam Neeson', 'actor', 'Oskar Schindler', 1
  UNION ALL SELECT 'Schindler''s List', 'Ralph Fiennes', 'actor', 'Amon Goth', 2
  UNION ALL SELECT 'Schindler''s List', 'Ben Kingsley', 'actor', 'Itzhak Stern', 3
  UNION ALL SELECT 'The Lord of the Rings: The Return of the King', 'Elijah Wood', 'actor', 'Frodo Baggins', 1
  UNION ALL SELECT 'The Lord of the Rings: The Return of the King', 'Viggo Mortensen', 'actor', 'Aragorn', 2
  UNION ALL SELECT 'The Lord of the Rings: The Return of the King', 'Ian McKellen', 'actor', 'Gandalf', 3
  UNION ALL SELECT 'The Lord of the Rings: The Fellowship of the Ring', 'Elijah Wood', 'actor', 'Frodo Baggins', 1
  UNION ALL SELECT 'The Lord of the Rings: The Fellowship of the Ring', 'Ian McKellen', 'actor', 'Gandalf', 2
  UNION ALL SELECT 'The Lord of the Rings: The Fellowship of the Ring', 'Sean Astin', 'actor', 'Samwise Gamgee', 3
  UNION ALL SELECT 'Pulp Fiction', 'John Travolta', 'actor', 'Vincent Vega', 1
  UNION ALL SELECT 'Pulp Fiction', 'Samuel L. Jackson', 'actor', 'Jules Winnfield', 2
  UNION ALL SELECT 'Pulp Fiction', 'Uma Thurman', 'actor', 'Mia Wallace', 3
  UNION ALL SELECT 'The Good, the Bad and the Ugly', 'Clint Eastwood', 'actor', 'Blondie', 1
  UNION ALL SELECT 'The Good, the Bad and the Ugly', 'Eli Wallach', 'actor', 'Tuco', 2
  UNION ALL SELECT 'The Good, the Bad and the Ugly', 'Lee Van Cleef', 'actor', 'Angel Eyes', 3
  UNION ALL SELECT 'Forrest Gump', 'Tom Hanks', 'actor', 'Forrest Gump', 1
  UNION ALL SELECT 'Forrest Gump', 'Robin Wright', 'actor', 'Jenny Curran', 2
  UNION ALL SELECT 'Forrest Gump', 'Gary Sinise', 'actor', 'Lt. Dan Taylor', 3
  UNION ALL SELECT 'The Lord of the Rings: The Two Towers', 'Elijah Wood', 'actor', 'Frodo Baggins', 1
  UNION ALL SELECT 'The Lord of the Rings: The Two Towers', 'Viggo Mortensen', 'actor', 'Aragorn', 2
  UNION ALL SELECT 'The Lord of the Rings: The Two Towers', 'Ian McKellen', 'actor', 'Gandalf', 3
  UNION ALL SELECT 'Fight Club', 'Brad Pitt', 'actor', 'Tyler Durden', 1
  UNION ALL SELECT 'Fight Club', 'Edward Norton', 'actor', 'The Narrator', 2
  UNION ALL SELECT 'Fight Club', 'Helena Bonham Carter', 'actor', 'Marla Singer', 3
  UNION ALL SELECT 'Inception', 'Leonardo DiCaprio', 'actor', 'Dom Cobb', 1
  UNION ALL SELECT 'Inception', 'Joseph Gordon-Levitt', 'actor', 'Arthur', 2
  UNION ALL SELECT 'Inception', 'Elliot Page', 'actor', 'Ariadne', 3
  UNION ALL SELECT 'Star Wars: Episode V - The Empire Strikes Back', 'Mark Hamill', 'actor', 'Luke Skywalker', 1
  UNION ALL SELECT 'Star Wars: Episode V - The Empire Strikes Back', 'Harrison Ford', 'actor', 'Han Solo', 2
  UNION ALL SELECT 'Star Wars: Episode V - The Empire Strikes Back', 'Carrie Fisher', 'actor', 'Princess Leia', 3
  UNION ALL SELECT 'The Matrix', 'Keanu Reeves', 'actor', 'Neo', 1
  UNION ALL SELECT 'The Matrix', 'Laurence Fishburne', 'actor', 'Morpheus', 2
  UNION ALL SELECT 'The Matrix', 'Carrie-Anne Moss', 'actor', 'Trinity', 3
  UNION ALL SELECT 'Goodfellas', 'Ray Liotta', 'actor', 'Henry Hill', 1
  UNION ALL SELECT 'Goodfellas', 'Robert De Niro', 'actor', 'James Conway', 2
  UNION ALL SELECT 'Goodfellas', 'Joe Pesci', 'actor', 'Tommy DeVito', 3
  UNION ALL SELECT 'Interstellar', 'Matthew McConaughey', 'actor', 'Cooper', 1
  UNION ALL SELECT 'Interstellar', 'Anne Hathaway', 'actor', 'Brand', 2
  UNION ALL SELECT 'Interstellar', 'Jessica Chastain', 'actor', 'Murph', 3
  UNION ALL SELECT 'One Flew Over the Cuckoo''s Nest', 'Jack Nicholson', 'actor', 'Randle P. McMurphy', 1
  UNION ALL SELECT 'One Flew Over the Cuckoo''s Nest', 'Louise Fletcher', 'actor', 'Nurse Ratched', 2
  UNION ALL SELECT 'One Flew Over the Cuckoo''s Nest', 'Will Sampson', 'actor', 'Chief Bromden', 3
  UNION ALL SELECT 'Se7en', 'Brad Pitt', 'actor', 'David Mills', 1
  UNION ALL SELECT 'Se7en', 'Morgan Freeman', 'actor', 'William Somerset', 2
  UNION ALL SELECT 'Se7en', 'Kevin Spacey', 'actor', 'John Doe', 3
) AS v(title, person, job, character_name, billing_order)
JOIN movies m ON m.title = v.title
JOIN persons p ON p.name = v.person
;
