-- Legal237 New Laws Database Schema
-- This schema reorganizes laws into proper categories and structure

-- 1. Law Categories Table (Main law types)
CREATE TABLE IF NOT EXISTS law_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'penal_code', 'civil_code'
    name_en VARCHAR(255) NOT NULL,
    name_fr VARCHAR(255) NOT NULL,
    description_en TEXT,
    description_fr TEXT,
    article_prefix_en VARCHAR(50) DEFAULT 'Article', -- Prefix for articles (e.g., "Article", "Section")
    article_prefix_fr VARCHAR(50) DEFAULT 'Article', -- French prefix for articles
    icon VARCHAR(50) DEFAULT 'document-text', -- For UI display
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for UI
    price DECIMAL(10,2) DEFAULT 0, -- Price in XAF
    currency VARCHAR(3) DEFAULT 'XAF',
    display_order INTEGER DEFAULT 0, -- For custom ordering
    is_active BOOLEAN DEFAULT true,
    is_free BOOLEAN DEFAULT false, -- Whether this category is free to access
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Law Books Table (Subdivisions within categories - optional)
CREATE TABLE IF NOT EXISTS law_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES law_categories(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL, -- e.g., 'book_1', 'part_a'
    name_en VARCHAR(255) NOT NULL,
    name_fr VARCHAR(255) NOT NULL,
    description_en TEXT,
    description_fr TEXT,
    display_order INTEGER DEFAULT 0, -- For ordering within category
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(category_id, code)
);

-- 3. Law Articles Table (Individual articles)
CREATE TABLE IF NOT EXISTS law_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES law_categories(id) ON DELETE CASCADE,
    book_id UUID REFERENCES law_books(id) ON DELETE SET NULL, -- Optional book subdivision
    article_number INTEGER NOT NULL, -- Sequential number within category
    article_id VARCHAR(50) NOT NULL, -- Human-readable ID like "1", "1-1", "2a"
    title_en TEXT,
    title_fr TEXT,
    content_en TEXT NOT NULL,
    content_fr TEXT NOT NULL,
    display_order INTEGER DEFAULT 0, -- For custom ordering within category
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(category_id, article_number),
    UNIQUE(category_id, article_id)
);

-- 4. Law Versions Table (For tracking changes)
CREATE TABLE IF NOT EXISTS law_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES law_articles(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title_en TEXT,
    title_fr TEXT,
    content_en TEXT NOT NULL,
    content_fr TEXT NOT NULL,
    change_description TEXT,
    created_by VARCHAR(255), -- User who made the change
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(article_id, version_number)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_law_categories_code ON law_categories(code);
CREATE INDEX IF NOT EXISTS idx_law_categories_active ON law_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_law_categories_order ON law_categories(display_order);

CREATE INDEX IF NOT EXISTS idx_law_books_category ON law_books(category_id);
CREATE INDEX IF NOT EXISTS idx_law_books_active ON law_books(is_active);
CREATE INDEX IF NOT EXISTS idx_law_books_order ON law_books(category_id, display_order);

CREATE INDEX IF NOT EXISTS idx_law_articles_category ON law_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_law_articles_book ON law_articles(book_id);
CREATE INDEX IF NOT EXISTS idx_law_articles_number ON law_articles(category_id, article_number);
CREATE INDEX IF NOT EXISTS idx_law_articles_active ON law_articles(is_active);
CREATE INDEX IF NOT EXISTS idx_law_articles_order ON law_articles(category_id, display_order);

CREATE INDEX IF NOT EXISTS idx_law_versions_article ON law_versions(article_id);
CREATE INDEX IF NOT EXISTS idx_law_versions_number ON law_versions(article_id, version_number);

-- Row Level Security (RLS) Policies
ALTER TABLE law_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE law_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE law_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE law_versions ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "Public read access to active law categories" ON law_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public read access to active law books" ON law_books
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public read access to active law articles" ON law_articles
    FOR SELECT USING (is_active = true);

-- Admin full access (you'll need to adjust this based on your auth setup)
CREATE POLICY "Admin full access to law categories" ON law_categories
    FOR ALL USING (current_setting('request.jwt.claims')::json->>'role' = 'service_role');

CREATE POLICY "Admin full access to law books" ON law_books
    FOR ALL USING (current_setting('request.jwt.claims')::json->>'role' = 'service_role');

CREATE POLICY "Admin full access to law articles" ON law_articles
    FOR ALL USING (current_setting('request.jwt.claims')::json->>'role' = 'service_role');

CREATE POLICY "Admin full access to law versions" ON law_versions
    FOR ALL USING (current_setting('request.jwt.claims')::json->>'role' = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_law_categories_updated_at 
    BEFORE UPDATE ON law_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_law_books_updated_at 
    BEFORE UPDATE ON law_books 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_law_articles_updated_at 
    BEFORE UPDATE ON law_articles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create article version on update
CREATE OR REPLACE FUNCTION create_article_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert old version into versions table
    INSERT INTO law_versions (
        article_id, 
        version_number, 
        title_en, 
        title_fr, 
        content_en, 
        content_fr,
        change_description,
        created_by
    ) VALUES (
        OLD.id,
        OLD.version,
        OLD.title_en,
        OLD.title_fr,
        OLD.content_en,
        OLD.content_fr,
        'Auto-saved before update',
        current_setting('request.jwt.claims')::json->>'email'
    );
    
    -- Increment version number
    NEW.version = OLD.version + 1;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create version on article update
CREATE TRIGGER create_article_version_trigger
    BEFORE UPDATE ON law_articles
    FOR EACH ROW
    WHEN (OLD.content_en IS DISTINCT FROM NEW.content_en OR OLD.content_fr IS DISTINCT FROM NEW.content_fr)
    EXECUTE FUNCTION create_article_version();

-- Insert initial law categories
INSERT INTO law_categories (code, name_en, name_fr, description_en, description_fr, article_prefix_en, article_prefix_fr, icon, color, price, display_order) VALUES
('penal_code', 'Cameroon Penal Code', 'Code Pénal du Cameroun', 'Criminal laws and penalties in Cameroon', 'Lois pénales et sanctions au Cameroun', 'Article', 'Article', 'gavel', '#DC2626', 1000, 1),
('criminal_procedure', 'Criminal Procedure Code', 'Code de Procédure Pénale', 'Criminal procedure and court processes', 'Procédure pénale et processus judiciaires', 'Article', 'Article', 'scale-balanced', '#2563EB', 1000, 2),
('civil_code', 'Civil Code', 'Code Civil', 'Civil law matters and procedures', 'Questions de droit civil et procédures', 'Section', 'Section', 'users', '#059669', 1500, 3),
('commercial_code', 'Commercial Code', 'Code de Commerce', 'Business and commercial law', 'Droit commercial et des affaires', 'Article', 'Article', 'briefcase', '#7C3AED', 1500, 4),
('labor_code', 'Labor Code', 'Code du Travail', 'Employment and labor law', 'Droit du travail et de l''emploi', 'Section', 'Section', 'hard-hat', '#EA580C', 1200, 5),
('family_code', 'Family Code', 'Code de la Famille', 'Family law and matrimonial matters', 'Droit de la famille et questions matrimoniales', 'Article', 'Article', 'home', '#DB2777', 1200, 6)
ON CONFLICT (code) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_fr = EXCLUDED.name_fr,
    description_en = EXCLUDED.description_en,
    description_fr = EXCLUDED.description_fr,
    article_prefix_en = EXCLUDED.article_prefix_en,
    article_prefix_fr = EXCLUDED.article_prefix_fr,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    price = EXCLUDED.price,
    display_order = EXCLUDED.display_order;

-- Views for easy data access
CREATE OR REPLACE VIEW law_articles_with_category AS
SELECT 
    a.id,
    a.article_number,
    a.article_id,
    a.title_en,
    a.title_fr,
    a.content_en,
    a.content_fr,
    a.display_order,
    a.is_active,
    a.version,
    a.created_at,
    a.updated_at,
    c.code as category_code,
    c.name_en as category_name_en,
    c.name_fr as category_name_fr,
    c.article_prefix_en as category_article_prefix_en,
    c.article_prefix_fr as category_article_prefix_fr,
    c.icon as category_icon,
    c.color as category_color,
    c.price as category_price,
    b.code as book_code,
    b.name_en as book_name_en,
    b.name_fr as book_name_fr
FROM law_articles a
JOIN law_categories c ON a.category_id = c.id
LEFT JOIN law_books b ON a.book_id = b.id
WHERE a.is_active = true AND c.is_active = true
ORDER BY c.display_order, a.display_order, a.article_number;

-- View for category statistics
CREATE OR REPLACE VIEW law_category_stats AS
SELECT 
    c.id,
    c.code,
    c.name_en,
    c.name_fr,
    c.description_en,
    c.description_fr,
    c.icon,
    c.color,
    c.price,
    c.currency,
    c.display_order,
    c.is_active,
    c.is_free,
    COUNT(a.id) as total_articles,
    COUNT(CASE WHEN a.is_active = true THEN 1 END) as active_articles,
    MAX(a.updated_at) as last_updated
FROM law_categories c
LEFT JOIN law_articles a ON c.id = a.category_id
GROUP BY c.id, c.code, c.name_en, c.name_fr, c.description_en, c.description_fr, c.icon, c.color, c.price, c.currency, c.display_order, c.is_active, c.is_free
ORDER BY c.display_order; 