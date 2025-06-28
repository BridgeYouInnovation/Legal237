-- Migration script to move from old legal_articles table to new laws structure
-- Run this AFTER creating the new schema

-- First, ensure the new schema is created (run new_laws_schema.sql first)

-- Migrate existing data from legal_articles to new structure
DO $$
DECLARE
    penal_code_id UUID;
    criminal_procedure_id UUID;
    current_article RECORD;
    article_num INTEGER;
BEGIN
    -- Get category IDs
    SELECT id INTO penal_code_id FROM law_categories WHERE code = 'penal_code';
    SELECT id INTO criminal_procedure_id FROM law_categories WHERE code = 'criminal_procedure';
    
    -- Migrate penal code articles
    article_num := 1;
    FOR current_article IN 
        SELECT * FROM legal_articles 
        WHERE law_type = 'penal_code' 
        ORDER BY CAST(article_id AS INTEGER) NULLS LAST, article_id
    LOOP
        INSERT INTO law_articles (
            id,
            category_id,
            article_number,
            article_id,
            title_en,
            title_fr,
            content_en,
            content_fr,
            display_order,
            created_at,
            updated_at
        ) VALUES (
            current_article.id,
            CASE 
                WHEN current_article.language = 'en' THEN penal_code_id
                ELSE penal_code_id
            END,
            article_num,
            current_article.article_id,
            CASE WHEN current_article.language = 'en' THEN current_article.title ELSE '' END,
            CASE WHEN current_article.language = 'fr' THEN current_article.title ELSE '' END,
            CASE WHEN current_article.language = 'en' THEN current_article.text ELSE '' END,
            CASE WHEN current_article.language = 'fr' THEN current_article.text ELSE '' END,
            article_num,
            current_article.created_at,
            current_article.updated_at
        );
        
        article_num := article_num + 1;
    END LOOP;
    
    -- Migrate criminal procedure articles
    article_num := 1;
    FOR current_article IN 
        SELECT * FROM legal_articles 
        WHERE law_type = 'criminal_procedure' 
        ORDER BY CAST(article_id AS INTEGER) NULLS LAST, article_id
    LOOP
        INSERT INTO law_articles (
            id,
            category_id,
            article_number,
            article_id,
            title_en,
            title_fr,
            content_en,
            content_fr,
            display_order,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(), -- New ID since we're combining languages
            criminal_procedure_id,
            article_num,
            current_article.article_id,
            CASE WHEN current_article.language = 'en' THEN current_article.title ELSE '' END,
            CASE WHEN current_article.language = 'fr' THEN current_article.title ELSE '' END,
            CASE WHEN current_article.language = 'en' THEN current_article.text ELSE '' END,
            CASE WHEN current_article.language = 'fr' THEN current_article.text ELSE '' END,
            article_num,
            current_article.created_at,
            current_article.updated_at
        );
        
        article_num := article_num + 1;
    END LOOP;
    
    RAISE NOTICE 'Migration completed successfully';
END
$$;

-- Create a better migration that combines English and French versions
-- This creates one article record with both languages
CREATE OR REPLACE FUNCTION migrate_legal_articles_properly() 
RETURNS void AS $$
DECLARE
    penal_code_id UUID;
    criminal_procedure_id UUID;
    current_article_id TEXT;
    en_article RECORD;
    fr_article RECORD;
    article_num INTEGER;
    unique_articles TEXT[];
BEGIN
    -- Get category IDs
    SELECT id INTO penal_code_id FROM law_categories WHERE code = 'penal_code';
    SELECT id INTO criminal_procedure_id FROM law_categories WHERE code = 'criminal_procedure';
    
    -- Clear any existing articles to avoid conflicts
    DELETE FROM law_articles;
    
    -- Get unique article IDs for penal code
    SELECT ARRAY(
        SELECT DISTINCT article_id 
        FROM legal_articles 
        WHERE law_type = 'penal_code' 
        ORDER BY CAST(article_id AS INTEGER) NULLS LAST, article_id
    ) INTO unique_articles;
    
    -- Migrate penal code articles
    article_num := 1;
    FOREACH current_article_id IN ARRAY unique_articles
    LOOP
        -- Get English version
        SELECT * INTO en_article 
        FROM legal_articles 
        WHERE law_type = 'penal_code' AND article_id = current_article_id AND language = 'en'
        LIMIT 1;
        
        -- Get French version
        SELECT * INTO fr_article 
        FROM legal_articles 
        WHERE law_type = 'penal_code' AND article_id = current_article_id AND language = 'fr'
        LIMIT 1;
        
        -- Insert combined article
        INSERT INTO law_articles (
            category_id,
            article_number,
            article_id,
            title_en,
            title_fr,
            content_en,
            content_fr,
            display_order
        ) VALUES (
            penal_code_id,
            article_num,
            current_article_id,
            COALESCE(en_article.title, ''),
            COALESCE(fr_article.title, ''),
            COALESCE(en_article.text, ''),
            COALESCE(fr_article.text, ''),
            article_num
        );
        
        article_num := article_num + 1;
    END LOOP;
    
    -- Get unique article IDs for criminal procedure
    SELECT ARRAY(
        SELECT DISTINCT article_id 
        FROM legal_articles 
        WHERE law_type = 'criminal_procedure' 
        ORDER BY CAST(article_id AS INTEGER) NULLS LAST, article_id
    ) INTO unique_articles;
    
    -- Migrate criminal procedure articles
    article_num := 1;
    FOREACH current_article_id IN ARRAY unique_articles
    LOOP
        -- Get English version
        SELECT * INTO en_article 
        FROM legal_articles 
        WHERE law_type = 'criminal_procedure' AND article_id = current_article_id AND language = 'en'
        LIMIT 1;
        
        -- Get French version
        SELECT * INTO fr_article 
        FROM legal_articles 
        WHERE law_type = 'criminal_procedure' AND article_id = current_article_id AND language = 'fr'
        LIMIT 1;
        
        -- Insert combined article
        INSERT INTO law_articles (
            category_id,
            article_number,
            article_id,
            title_en,
            title_fr,
            content_en,
            content_fr,
            display_order
        ) VALUES (
            criminal_procedure_id,
            article_num,
            current_article_id,
            COALESCE(en_article.title, ''),
            COALESCE(fr_article.title, ''),
            COALESCE(en_article.text, ''),
            COALESCE(fr_article.text, ''),
            article_num
        );
        
        article_num := article_num + 1;
    END LOOP;
    
    RAISE NOTICE 'Migration completed successfully. Penal Code and Criminal Procedure articles migrated.';
END
$$ LANGUAGE plpgsql;

-- Run the migration
SELECT migrate_legal_articles_properly();

-- Verify migration results
SELECT 
    c.name_en as category,
    COUNT(a.id) as article_count,
    MIN(a.article_number) as first_article,
    MAX(a.article_number) as last_article
FROM law_categories c
LEFT JOIN law_articles a ON c.id = a.category_id
GROUP BY c.id, c.name_en
ORDER BY c.display_order;

-- Update document_access table to use new category codes
UPDATE document_access 
SET document_type = 'penal_code' 
WHERE document_type = 'penal_code';

UPDATE document_access 
SET document_type = 'criminal_procedure' 
WHERE document_type = 'criminal_procedure';

-- Update payment_transactions table
UPDATE payment_transactions 
SET document_type = 'penal_code' 
WHERE document_type = 'penal_code';

UPDATE payment_transactions 
SET document_type = 'criminal_procedure' 
WHERE document_type = 'criminal_procedure'; 