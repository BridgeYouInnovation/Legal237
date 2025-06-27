import json
import uuid
import re
from pathlib import Path
from typing import Dict, List, Optional

def clean_text(text: str) -> str:
    """Clean and normalize text content."""
    # Remove extra whitespace and normalize line breaks
    text = re.sub(r'\s+', ' ', text.strip())
    # Remove any headers/footers that match common patterns
    text = re.sub(r'President of the Republic|Secretariat|Copy certified|PRESIDENCE', '', text)
    return text

def detect_language(text: str) -> str:
    """Detect if text is in English or French based on common words."""
    fr_words = {'et', 'le', 'la', 'les', 'des', 'du', 'dans', 'pour', 'est', 'sont'}
    en_words = {'the', 'and', 'of', 'in', 'for', 'is', 'are', 'to', 'by', 'with'}
    
    words = set(text.lower().split())
    fr_count = len(words.intersection(fr_words))
    en_count = len(words.intersection(en_words))
    
    return 'fr' if fr_count > en_count else 'en'

def normalize_article_id(article_id: str) -> str:
    """Normalize article ID format."""
    # Remove 'Article ' prefix if present and clean up
    article_id = article_id.replace('Article ', '').strip()
    return article_id

def process_legal_documents(input_dir: str) -> tuple[List[Dict], List[Dict]]:
    """Process all legal documents and return data for SQL and embeddings."""
    input_path = Path(input_dir)
    sql_data = []
    embeddings_data = []
    
    for file_path in input_path.glob('*.json'):
        if file_path.name == 'all_legal_documents_parsed.json':
            continue
            
        # Determine law type from filename
        law_type = 'penal_code' if 'penal_code' in file_path.name else 'criminal_procedure'
        language = 'fr' if '_fr_' in file_path.name else 'en'
        
        with open(file_path, 'r', encoding='utf-8') as f:
            articles = json.load(f)
            
        for article in articles:
            # Clean and normalize data
            article_id = normalize_article_id(article['id'])
            text = clean_text(article['text'])
            title = clean_text(article.get('title', ''))
            book = clean_text(article.get('book', ''))
            
            # Create SQL record
            sql_record = {
                'id': str(uuid.uuid4()),
                'article_id': article_id,
                'title': title,
                'book': book,
                'law_type': law_type,
                'language': language,
                'text': text
            }
            sql_data.append(sql_record)
            
            # Create embeddings record
            embeddings_record = {
                'id': str(uuid.uuid4()),
                'text': text,
                'article_id': article_id,
                'law_type': law_type,
                'language': language,
                'metadata': {
                    'book': book,
                    'title': title
                }
            }
            embeddings_data.append(embeddings_record)
    
    return sql_data, embeddings_data

def generate_sql_script(data: List[Dict], output_file: str):
    """Generate SQL script for creating and populating the legal_articles table."""
    sql_lines = [
        '-- Create legal_articles table',
        'CREATE TABLE IF NOT EXISTS legal_articles (',
        '    id UUID PRIMARY KEY,',
        '    article_id TEXT NOT NULL,',
        '    title TEXT,',
        '    book TEXT,',
        '    law_type TEXT NOT NULL,',
        '    language TEXT NOT NULL,',
        '    text TEXT NOT NULL,',
        '    created_at TIMESTAMPTZ DEFAULT NOW(),',
        '    updated_at TIMESTAMPTZ DEFAULT NOW()',
        ');',
        '',
        "-- Create indexes",
        'CREATE INDEX IF NOT EXISTS idx_legal_articles_article_id ON legal_articles(article_id);',
        'CREATE INDEX IF NOT EXISTS idx_legal_articles_law_type ON legal_articles(law_type);',
        'CREATE INDEX IF NOT EXISTS idx_legal_articles_language ON legal_articles(language);',
        '',
        '-- Insert data'
    ]
    
    for record in data:
        # Escape single quotes in text fields
        article_id = record['article_id'].replace("'", "''")
        title = record['title'].replace("'", "''") if record['title'] else None
        book = record['book'].replace("'", "''") if record['book'] else None
        text = record['text'].replace("'", "''")
        
        values = [
            f"'{record['id']}'",
            f"'{article_id}'",
            f"'{title}'" if title else 'NULL',
            f"'{book}'" if book else 'NULL',
            f"'{record['law_type']}'",
            f"'{record['language']}'",
            f"'{text}'"
        ]
        sql_lines.append(f"INSERT INTO legal_articles (id, article_id, title, book, law_type, language, text)")
        sql_lines.append(f"VALUES ({', '.join(values)});")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))

def generate_embeddings_input(data: List[Dict], output_file: str):
    """Generate JSON file for embeddings input."""
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def main():
    # Process documents
    sql_data, embeddings_data = process_legal_documents('./parsed_legal_docs')
    
    # Generate SQL script
    generate_sql_script(sql_data, 'legal_articles.sql')
    
    # Generate embeddings input
    generate_embeddings_input(embeddings_data, 'legal_embeddings_input.json')
    
    print(f"Processed {len(sql_data)} articles")
    print("Generated:")
    print("- legal_articles.sql")
    print("- legal_embeddings_input.json")

if __name__ == '__main__':
    main() 