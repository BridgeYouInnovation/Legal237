-- Migration script to move from old legal_articles table to new laws structure
-- Run this AFTER creating the new schema (new_laws_schema_fixed.sql)

-- This migration properly handles article_id values that are not integers

-- Create a helper function to extract numeric part for sorting
CREATE OR REPLACE FUNCTION extract_sort_number(article_id TEXT) 
RETURNS INTEGER AS $$
BEGIN
    -- Extract the first number from article_id for sorting
    -- e.g., "1" -> 1, "1-1" -> 1, "2a" -> 2
    RETURN CAST(substring(article_id from '^(\d+)') AS INTEGER);
EXCEPTION
    WHEN OTHERS THEN
        RETURN 99999; -- Put non-numeric IDs at the end
END;
$$ LANGUAGE plpgsql;

-- Migration function that combines English and French versions properly
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
    
    IF penal_code_id IS NULL OR criminal_procedure_id IS NULL THEN
        RAISE EXCEPTION 'Law categories not found. Please run new_laws_schema_fixed.sql first.';
    END IF;
    
    -- Clear any existing articles to avoid conflicts
    DELETE FROM law_articles;
    RAISE NOTICE 'Cleared existing law_articles';
    
    -- Get unique article IDs for penal code, sorted properly
    -- Using subquery to handle DISTINCT with custom ORDER BY
    SELECT ARRAY(
        SELECT article_id 
        FROM (
            SELECT DISTINCT article_id, extract_sort_number(article_id) as sort_num
            FROM legal_articles 
            WHERE law_type = 'penal_code'
        ) sorted_articles
        ORDER BY sort_num, article_id
    ) INTO unique_articles;
    
    RAISE NOTICE 'Found % unique penal code articles', array_length(unique_articles, 1);
    
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
            display_order,
            created_at,
            updated_at
        ) VALUES (
            penal_code_id,
            article_num,
            current_article_id,
            COALESCE(en_article.title, ''),
            COALESCE(fr_article.title, ''),
            COALESCE(en_article.text, ''),
            COALESCE(fr_article.text, ''),
            article_num,
            COALESCE(en_article.created_at, fr_article.created_at, NOW()),
            COALESCE(en_article.updated_at, fr_article.updated_at, NOW())
        );
        
        article_num := article_num + 1;
    END LOOP;
    
    RAISE NOTICE 'Migrated % penal code articles', article_num - 1;
    
    -- Get unique article IDs for criminal procedure, sorted properly
    -- Using subquery to handle DISTINCT with custom ORDER BY
    SELECT ARRAY(
        SELECT article_id 
        FROM (
            SELECT DISTINCT article_id, extract_sort_number(article_id) as sort_num
            FROM legal_articles 
            WHERE law_type = 'criminal_procedure'
        ) sorted_articles
        ORDER BY sort_num, article_id
    ) INTO unique_articles;
    
    RAISE NOTICE 'Found % unique criminal procedure articles', array_length(unique_articles, 1);
    
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
            display_order,
            created_at,
            updated_at
        ) VALUES (
            criminal_procedure_id,
            article_num,
            current_article_id,
            COALESCE(en_article.title, ''),
            COALESCE(fr_article.title, ''),
            COALESCE(en_article.text, ''),
            COALESCE(fr_article.text, ''),
            article_num,
            COALESCE(en_article.created_at, fr_article.created_at, NOW()),
            COALESCE(en_article.updated_at, fr_article.updated_at, NOW())
        );
        
        article_num := article_num + 1;
    END LOOP;
    
    RAISE NOTICE 'Migrated % criminal procedure articles', article_num - 1;
    
    -- Get final counts
    DECLARE
        penal_count INTEGER;
        criminal_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO penal_count FROM law_articles WHERE category_id = penal_code_id;
        SELECT COUNT(*) INTO criminal_count FROM law_articles WHERE category_id = criminal_procedure_id;
        
        RAISE NOTICE 'Migration completed successfully!';
        RAISE NOTICE 'Final counts: Penal Code: %, Criminal Procedure: %', penal_count, criminal_count;
    END;
    
END;
$$ LANGUAGE plpgsql;

-- Run the migration
SELECT migrate_legal_articles_properly();

-- Clean up helper function
DROP FUNCTION IF EXISTS extract_sort_number(TEXT);
DROP FUNCTION IF EXISTS migrate_legal_articles_properly();

-- Verify migration results
DO $$
DECLARE
    total_articles INTEGER;
    total_categories INTEGER;
    rec RECORD;
BEGIN
    SELECT COUNT(*) INTO total_articles FROM law_articles;
    SELECT COUNT(*) INTO total_categories FROM law_categories;
    
    RAISE NOTICE '=== Migration Summary ===';
    RAISE NOTICE 'Total law categories: %', total_categories;
    RAISE NOTICE 'Total law articles: %', total_articles;
    
    -- Show articles per category
    FOR rec IN 
        SELECT c.name_en, COUNT(a.id) as article_count
        FROM law_categories c
        LEFT JOIN law_articles a ON c.id = a.category_id
        GROUP BY c.id, c.name_en
        ORDER BY c.display_order
    LOOP
        RAISE NOTICE 'Category "%" has % articles', rec.name_en, rec.article_count;
    END LOOP;
    
    RAISE NOTICE '=== Migration Complete ===';
END;
$$; 