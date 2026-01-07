-- CreateEnum
CREATE TYPE "RatingSource" AS ENUM ('IMDB', 'RT_CRITIC', 'RT_AUDIENCE', 'METACRITIC', 'TMDB');

-- CreateTable
CREATE TABLE "Movie" (
    "tmdbId" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "originalTitle" TEXT,
    "overview" TEXT,
    "releaseDate" TIMESTAMP(3),
    "runtime" INTEGER,
    "posterPath" TEXT,
    "backdropPath" TEXT,
    "genres" TEXT[],
    "popularity" DOUBLE PRECISION,
    "imdbId" TEXT,
    "tmdbVoteAverage" DOUBLE PRECISION,
    "tmdbVoteCount" INTEGER,
    "consensusScore" INTEGER,
    "consensusFormula" TEXT,
    "confidence" INTEGER,
    "lastFetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Movie_pkey" PRIMARY KEY ("tmdbId")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "movieTmdbId" INTEGER NOT NULL,
    "source" "RatingSource" NOT NULL,
    "value" DOUBLE PRECISION,
    "valueText" TEXT,
    "votes" INTEGER,
    "url" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Movie_slug_idx" ON "Movie"("slug");

-- CreateIndex
CREATE INDEX "Movie_imdbId_idx" ON "Movie"("imdbId");

-- CreateIndex
CREATE INDEX "Rating_source_idx" ON "Rating"("source");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_movieTmdbId_source_key" ON "Rating"("movieTmdbId", "source");

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_movieTmdbId_fkey" FOREIGN KEY ("movieTmdbId") REFERENCES "Movie"("tmdbId") ON DELETE CASCADE ON UPDATE CASCADE;
