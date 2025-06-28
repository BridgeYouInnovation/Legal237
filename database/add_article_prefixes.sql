-- Add Article Prefix Support to Law Categories
-- This script adds article_prefix_en and article_prefix_fr fields to allow customizable article prefixes

-- Add the new columns if they don't exist
ALTER TABLE law_categories 
ADD COLUMN IF NOT EXISTS article_prefix_en VARCHAR(50) DEFAULT 'Article',
ADD COLUMN IF NOT EXISTS article_prefix_fr VARCHAR(50) DEFAULT 'Article';

-- Update existing categories with appropriate prefixes
UPDATE law_categories SET 
  article_prefix_en = 'Article',
  article_prefix_fr = 'Article'
WHERE code = 'penal_code';

UPDATE law_categories SET 
  article_prefix_en = 'Article',
  article_prefix_fr = 'Article'  
WHERE code = 'criminal_procedure';

UPDATE law_categories SET 
  article_prefix_en = 'Section',
  article_prefix_fr = 'Section'
WHERE code = 'civil_code';

UPDATE law_categories SET 
  article_prefix_en = 'Article',
  article_prefix_fr = 'Article'
WHERE code = 'commercial_code';

UPDATE law_categories SET 
  article_prefix_en = 'Section',
  article_prefix_fr = 'Section'
WHERE code = 'labor_code';

UPDATE law_categories SET 
  article_prefix_en = 'Article',
  article_prefix_fr = 'Article'
WHERE code = 'family_code';

-- Drop existing views first to avoid column name conflicts
DROP VIEW IF EXISTS law_articles_with_category;
DROP VIEW IF EXISTS law_category_stats;

-- Recreate the law_articles_with_category view with article prefix fields
CREATE VIEW law_articles_with_category AS
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

-- Recreate the category stats view with article prefixes
CREATE VIEW law_category_stats AS
SELECT 
    c.id,
    c.code,
    c.name_en,
    c.name_fr,
    c.description_en,
    c.description_fr,
    c.article_prefix_en,
    c.article_prefix_fr,
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
GROUP BY c.id, c.code, c.name_en, c.name_fr, c.description_en, c.description_fr, c.article_prefix_en, c.article_prefix_fr, c.icon, c.color, c.price, c.currency, c.display_order, c.is_active, c.is_free
ORDER BY c.display_order; 