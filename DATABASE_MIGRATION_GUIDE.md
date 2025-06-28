# Legal237 Database Migration Guide

## Overview
This guide will help you migrate from the old `legal_articles` table structure to the new comprehensive laws management system with separate law categories and articles.

## 🎯 What's New

### New Database Structure
- **law_categories**: Master table for different types of laws
- **law_articles**: Individual articles linked to categories
- **Enhanced metadata**: Pricing, versioning, multi-language support
- **Access control**: Better integration with payment system
- **Proper ordering**: Display order for both categories and articles

### New Features
- ✅ Admin dashboard for laws management
- ✅ CRUD operations for law categories and articles
- ✅ Multi-language support (English/French)
- ✅ Article versioning system
- ✅ Category-based pricing and access control
- ✅ Better mobile app integration
- ✅ Enhanced search capabilities

## 📋 Migration Steps

### Step 1: Backup Current Data
```sql
-- Create a backup of your current legal_articles table
CREATE TABLE legal_articles_backup AS SELECT * FROM legal_articles;
```

### Step 2: Run the New Schema Script
Copy and run the content from `database/new_laws_schema.sql` in your Supabase SQL editor.

### Step 3: Run the Migration Script
Copy and run the content from `database/migrate_to_new_laws.sql` in your Supabase SQL editor.

### Step 4: Verify Migration
```sql
-- Check law categories
SELECT * FROM law_categories ORDER BY display_order;

-- Check migrated articles
SELECT 
    la.*,
    lc.name_en as category_name
FROM law_articles la
JOIN law_categories lc ON la.category_id = lc.id
ORDER BY lc.display_order, la.article_number
LIMIT 10;

-- Check statistics
SELECT * FROM law_category_stats;
```

## 🏗️ Database Schema Details

### Law Categories Table
```sql
law_categories (
    id UUID PRIMARY KEY,
    code VARCHAR(50) UNIQUE,     -- e.g., 'penal_code'
    name_en VARCHAR(255),        -- English name
    name_fr VARCHAR(255),        -- French name
    description_en TEXT,         -- English description
    description_fr TEXT,         -- French description
    icon VARCHAR(50),            -- Icon name for UI
    color VARCHAR(7),            -- Hex color code
    price INTEGER,               -- Price in XAF
    currency VARCHAR(3),         -- Currency code
    display_order INTEGER,       -- Order in UI
    is_active BOOLEAN,           -- Active status
    is_free BOOLEAN              -- Free access flag
)
```

### Law Articles Table
```sql
law_articles (
    id UUID PRIMARY KEY,
    category_id UUID,            -- Foreign key to law_categories
    article_number INTEGER,      -- Sequential number
    article_id VARCHAR(50),      -- Display ID (e.g., "1", "1-1")
    title_en VARCHAR(500),       -- English title
    title_fr VARCHAR(500),       -- French title
    content_en TEXT,             -- English content
    content_fr TEXT,             -- French content
    display_order INTEGER,       -- Order within category
    is_active BOOLEAN,           -- Active status
    version INTEGER              -- Version number
)
```

## 🔧 Admin Dashboard Usage

### Adding New Law Categories
1. Go to **Laws Management** in admin dashboard
2. Click **"Add New Law Category"**
3. Fill in:
   - **Code**: Unique identifier (e.g., `civil_code`)
   - **Names**: English and French names
   - **Descriptions**: Brief descriptions in both languages
   - **Icon**: Choose from available icons
   - **Color**: Pick a theme color
   - **Price**: Set price in XAF (or mark as free)

### Adding Articles to Categories
1. Select a law category from the grid
2. Click **"Add New Article"**
3. Fill in:
   - **Article ID**: Display identifier
   - **Titles**: Optional titles in both languages
   - **Content**: Full article text in both languages

### Managing Existing Data
- **Edit**: Click the edit icon on any category or article
- **Delete**: Click the delete icon (with confirmation)
- **Reorder**: Categories are ordered by `display_order`
- **Activate/Deactivate**: Toggle `is_active` status

## 📱 Mobile App Integration

### Using New Services
Replace old `legalDataService` calls with `newLegalDataService`:

```javascript
// Old way
import legalDataService from './services/legalDataService';
const articles = await legalDataService.getArticlesByType('penal_code', 'en');

// New way
import newLegalDataService from './services/newLegalDataService';
await newLegalDataService.initialize();
const articles = await newLegalDataService.getArticles('penal_code', 'en');
```

### Navigation Updates
Update your navigation to use the new screens:
- `NewHomeScreen.js` - Updated home with dynamic categories
- `NewLawViewerScreen.js` - Enhanced law viewer with search and bookmarks

## 🔄 Payment Integration

### Category-Based Access
The new system integrates with your existing payment system:
- Free categories: `is_free = true`
- Paid categories: Price defined in `price` field
- Access control: Checked via `document_access` table

### Syncing Purchases
```javascript
// Sync a purchase to the database
await newLegalDataService.syncPurchaseToDatabase('civil_code');

// Refresh user access
await newLegalDataService.refreshUserPurchases();
```

## 🎨 UI Customization

### Category Icons
Available icons: `gavel`, `scale-balanced`, `users`, `briefcase`, `hard-hat`, `home`, `document-text`, `book-open`, `shield-check`, `building-office`, `banknotes`, `academic-cap`, `heart`, `truck`, `globe-alt`

### Color Themes
Each category can have a custom color that's used throughout the UI for consistent theming.

## 📊 Analytics & Statistics

### Built-in Statistics
The system provides automatic statistics:
- Total categories and articles
- User access metrics
- Category-specific article counts

### Querying Statistics
```sql
-- Get comprehensive stats
SELECT * FROM law_category_stats;

-- Get user-specific access
SELECT 
    lc.name_en,
    da.status,
    da.granted_at
FROM law_categories lc
LEFT JOIN document_access da ON da.document_type = lc.code 
WHERE da.user_id = 'user-uuid';
```

## 🔍 Search Improvements

### Enhanced Search
The new system provides:
- Multi-language search
- Category-specific search
- Content and title search
- Access-controlled results

### Search API
```javascript
// Search across all accessible categories
const results = await newLegalDataService.searchArticles('theft', null, 'en');

// Search within specific category
const results = await newLegalDataService.searchArticles('procedure', 'penal_code', 'en');
```

## 🛠️ Troubleshooting

### Common Issues

1. **Migration fails**: Ensure you have admin privileges and run scripts in order
2. **Missing articles**: Check the migration script completed successfully
3. **Access denied**: Verify user has proper document_access entries
4. **UI not updating**: Clear cache and refresh the admin dashboard

### Verification Queries
```sql
-- Check migration completion
SELECT 
    (SELECT COUNT(*) FROM legal_articles_backup) as old_count,
    (SELECT COUNT(*) FROM law_articles) as new_count;

-- Verify categories
SELECT code, name_en, total_articles, active_articles 
FROM law_category_stats;

-- Check user access
SELECT document_type, COUNT(*) 
FROM document_access 
WHERE status = 'active' 
GROUP BY document_type;
```

## 🔄 Rollback Plan

If you need to rollback:
```sql
-- 1. Restore original table
DROP TABLE IF EXISTS legal_articles;
ALTER TABLE legal_articles_backup RENAME TO legal_articles;

-- 2. Remove new tables (optional)
DROP TABLE IF EXISTS law_articles;
DROP TABLE IF EXISTS law_categories;
DROP VIEW IF EXISTS law_articles_with_category;
DROP VIEW IF EXISTS law_category_stats;
```

## 📞 Support

If you encounter any issues during migration:
1. Check the Supabase logs for detailed error messages
2. Verify your environment variables are properly set
3. Ensure the admin dashboard is deployed successfully
4. Test the mobile app with the new services

## 🎉 Post-Migration Benefits

After successful migration, you'll have:
- ✅ Scalable law category management
- ✅ Professional admin interface
- ✅ Better user experience in mobile app
- ✅ Enhanced search and filtering
- ✅ Proper versioning and audit trail
- ✅ Multi-language support
- ✅ Flexible pricing and access control

The new system is designed to grow with your Legal237 platform and provide a solid foundation for future enhancements. 