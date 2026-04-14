import { createClient } from '@libsql/client/web';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SQL_TABLES = `
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT,
  "password" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'USER',
  "lastLogin" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Subscription" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "plan" TEXT NOT NULL DEFAULT 'FREE',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endDate" DATETIME,
  "stripeCustomerId" TEXT UNIQUE,
  "stripePriceId" TEXT,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "TennisMatch" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "espnId" TEXT UNIQUE,
  "player1Name" TEXT NOT NULL,
  "player2Name" TEXT NOT NULL,
  "player1Ranking" INTEGER,
  "player2Ranking" INTEGER,
  "player1Country" TEXT,
  "player2Country" TEXT,
  "tournament" TEXT NOT NULL,
  "tournamentId" TEXT,
  "circuit" TEXT NOT NULL DEFAULT 'ATP',
  "round" TEXT,
  "surface" TEXT NOT NULL DEFAULT 'Hard',
  "tournamentLevel" TEXT NOT NULL DEFAULT '250',
  "city" TEXT,
  "country" TEXT,
  "indoor" INTEGER NOT NULL DEFAULT 0,
  "date" DATETIME NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "result" TEXT,
  "winnerId" TEXT,
  "score" TEXT,
  "sets" INTEGER,
  "totalGames" INTEGER,
  "duration" INTEGER,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "syncLogId" TEXT
);

CREATE TABLE IF NOT EXISTS "TennisPick" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "matchId" TEXT NOT NULL,
  "market" TEXT NOT NULL,
  "selection" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "odds" REAL NOT NULL,
  "trueOdds" REAL NOT NULL,
  "estimatedProb" REAL NOT NULL,
  "expectedValue" REAL NOT NULL,
  "confidenceScore" INTEGER NOT NULL,
  "valueLabel" TEXT NOT NULL DEFAULT 'MEDIUM',
  "isPremiumPick" INTEGER NOT NULL DEFAULT 0,
  "explanation" TEXT NOT NULL,
  "statsBreakdown" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "settledAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("matchId") REFERENCES "TennisMatch"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "PickHistory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "pickId" TEXT NOT NULL UNIQUE,
  "result" TEXT NOT NULL,
  "odds" REAL NOT NULL,
  "stake" REAL NOT NULL DEFAULT 1.0,
  "profit" REAL NOT NULL,
  "notes" TEXT,
  "settledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("pickId") REFERENCES "TennisPick"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "PlayerStats" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "playerName" TEXT NOT NULL UNIQUE,
  "circuit" TEXT NOT NULL DEFAULT 'ATP',
  "currentRanking" INTEGER,
  "peakRanking" INTEGER,
  "rankingPoints" INTEGER,
  "winRate" REAL,
  "surfaceWinRates" TEXT,
  "form5" TEXT,
  "form10" TEXT,
  "formScore" REAL,
  "firstServePerc" REAL,
  "firstServeWon" REAL,
  "secondServeWon" REAL,
  "acesPer100" REAL,
  "dfPer100" REAL,
  "returnWon" REAL,
  "bpConverted" REAL,
  "bpSaved" REAL,
  "isClayCourt" INTEGER NOT NULL DEFAULT 0,
  "isGrassCourt" INTEGER NOT NULL DEFAULT 0,
  "isHardCourt" INTEGER NOT NULL DEFAULT 0,
  "grandSlamWinRate" REAL,
  "masters1000Rate" REAL,
  "isInjured" INTEGER NOT NULL DEFAULT 0,
  "injuryNote" TEXT,
  "daysLastMatch" INTEGER,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "H2HRecord" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "player1Name" TEXT NOT NULL,
  "player2Name" TEXT NOT NULL,
  "totalMatches" INTEGER NOT NULL DEFAULT 0,
  "player1Wins" INTEGER NOT NULL DEFAULT 0,
  "player2Wins" INTEGER NOT NULL DEFAULT 0,
  "hardWinsP1" INTEGER NOT NULL DEFAULT 0,
  "hardWinsP2" INTEGER NOT NULL DEFAULT 0,
  "clayWinsP1" INTEGER NOT NULL DEFAULT 0,
  "clayWinsP2" INTEGER NOT NULL DEFAULT 0,
  "grassWinsP1" INTEGER NOT NULL DEFAULT 0,
  "grassWinsP2" INTEGER NOT NULL DEFAULT 0,
  "lastMatchDate" DATETIME,
  "lastMatchResult" TEXT,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("player1Name", "player2Name")
);

CREATE TABLE IF NOT EXISTS "FootballMatch" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "espnId" TEXT UNIQUE,
  "homeTeam" TEXT NOT NULL,
  "awayTeam" TEXT NOT NULL,
  "homeLogo" TEXT,
  "awayLogo" TEXT,
  "league" TEXT NOT NULL,
  "leagueLogo" TEXT,
  "date" DATETIME NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "homeScore" INTEGER,
  "awayScore" INTEGER,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "FootballPick" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "matchId" TEXT NOT NULL,
  "market" TEXT NOT NULL,
  "selection" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "odds" REAL NOT NULL,
  "trueOdds" REAL NOT NULL,
  "estimatedProb" REAL NOT NULL,
  "expectedValue" REAL NOT NULL,
  "confidenceScore" INTEGER NOT NULL,
  "valueLabel" TEXT NOT NULL DEFAULT 'MEDIUM',
  "isPremiumPick" INTEGER NOT NULL DEFAULT 0,
  "explanation" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("matchId") REFERENCES "FootballMatch"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "DailySyncLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" TEXT NOT NULL,
  "sport" TEXT NOT NULL DEFAULT 'TENNIS',
  "matchesFound" INTEGER NOT NULL DEFAULT 0,
  "picksGenerated" INTEGER NOT NULL DEFAULT 0,
  "premiumPicks" INTEGER NOT NULL DEFAULT 0,
  "circuits" TEXT,
  "errorMessage" TEXT,
  "durationMs" INTEGER
);

CREATE TABLE IF NOT EXISTS "UserPreferences" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT UNIQUE,
  "showTennis" INTEGER NOT NULL DEFAULT 1,
  "showFootball" INTEGER NOT NULL DEFAULT 1,
  "showATP" INTEGER NOT NULL DEFAULT 1,
  "showWTA" INTEGER NOT NULL DEFAULT 1,
  "showChallenger" INTEGER NOT NULL DEFAULT 1,
  "showITF" INTEGER NOT NULL DEFAULT 0,
  "riskProfile" TEXT NOT NULL DEFAULT 'BALANCED',
  "minConfidence" INTEGER NOT NULL DEFAULT 60,
  "minOdds" REAL NOT NULL DEFAULT 1.50,
  "maxOdds" REAL NOT NULL DEFAULT 5.00,
  "minEV" REAL NOT NULL DEFAULT 0.03,
  "emailAlerts" INTEGER NOT NULL DEFAULT 0,
  "telegramAlerts" INTEGER NOT NULL DEFAULT 0,
  "pushAlerts" INTEGER NOT NULL DEFAULT 0,
  "alertEmail" TEXT,
  "alertTelegram" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id")
);
`;

export async function GET() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    return NextResponse.json({ error: 'Missing Turso credentials' }, { status: 500 });
  }

  try {
    const client = createClient({ url, authToken });

    // Run each statement separately
    const statements = SQL_TABLES
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      await client.execute(stmt + ';');
    }

    return NextResponse.json({ 
      success: true, 
      message: '✅ Base de datos inicializada correctamente en Turso',
      tables: statements.length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
