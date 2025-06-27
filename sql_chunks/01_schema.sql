-- Create legal_articles table
CREATE TABLE IF NOT EXISTS legal_articles (
    id UUID PRIMARY KEY,
    article_id TEXT NOT NULL,
    title TEXT,
    book TEXT,
    law_type TEXT NOT NULL,
    language TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_legal_articles_article_id ON legal_articles(article_id);
CREATE INDEX IF NOT EXISTS idx_legal_articles_law_type ON legal_articles(law_type);
CREATE INDEX IF NOT EXISTS idx_legal_articles_language ON legal_articles(language);

-- Insert data
